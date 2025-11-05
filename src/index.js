#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import process from 'process';
import Hyperswarm from 'hyperswarm';
import Hyperdrive from 'hyperdrive';
import Localdrive from 'localdrive';
import Corestore from 'corestore';
import b4a from 'b4a';
import chokidar from 'chokidar';
import lodash from 'lodash';
import { goSync } from '@api3/promise-utils';
import {
  deriveKeyExchangeTopic,
  getDataDir,
  getPeersDir,
  logError,
  logInfo,
  parseEnvFile,
  printAsciiArt,
} from './utils.js';
import { checkPeerSizeLimit, parsePeersAndMonitorForChanges } from './peer.js';
import { parseGlobalConfig } from './config.js';

const { debounce } = lodash;

printAsciiArt();

async function main() {
  const dataDir = getDataDir();
  const { keyPair } = await parseEnvFile();
  const globalConfig = parseGlobalConfig();
  const peersDirectoryPath = getPeersDir(dataDir);
  logInfo('Parsing peers...');
  const peerConfigs = parsePeersAndMonitorForChanges(peersDirectoryPath, globalConfig, () => {
    logInfo('Peers have changed. Exiting to allow restart.');
    process.exit(0);
  });
  logInfo(`Parsed ${peerConfigs.length} peer(s)!`);

  logInfo('Preparing to connect...');
  const storageDir = path.join(dataDir, '.storage');
  const store = new Corestore(storageDir);
  await store.ready();

  // Create a Hyperswarm instance with key pair
  const swarm = new Hyperswarm({ keyPair });

  const cleanup = async () => {
    logInfo('Closing swarm...');
    await swarm.destroy();
    logInfo('Closed swarm.');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  /*
   * Partially set up our outgoing hyperdrives so that we can exchange their drive keys with our peers
   */
  const peers = await Promise.all(
    peerConfigs.map(async (peerConfig) => {
      const outgoingNamespace = store.namespace(`outgoing:${peerConfig.publicKey}`);
      const outgoingHyperdrive = new Hyperdrive(outgoingNamespace);
      await outgoingHyperdrive.ready();

      return {
        ...peerConfig,
        outgoingHyperdrive,
        incomingHyperdriveKeyHex: null,
      };
    })
  );

  /*
   * Establish peer connections, and complete Hyperdrives setup for each peer (upon receiving their drive key)
   */
  swarm.on('connection', (conn, peerInfo) => {
    const peerPublicKey = Buffer.from(peerInfo.publicKey).toString('hex');
    const peer = peers.find((p) => p.publicKey === peerPublicKey);
    if (!peer) {
      logError(`Unknown peer with public key ${peerPublicKey}`);
      conn.end();
      return;
    }

    const stream = store.replicate(conn);
    stream.on('error', (err) => handleReplicationError(peer, err));
    logInfo(`Connected to ${peer.alias}!`);

    // Exchange drive keys
    conn.on('data', (buffer) => handleReceiveDriveKeyFromPeer(peer, buffer));
    const message = {
      type: 'share-drive-key',
      outgoingHyperdriveKeyHex: peer.outgoingHyperdrive.key.toString('hex'),
    };
    conn.write(JSON.stringify(message), 'utf8');
    logInfo(`Sent drive key to ${peer.alias}`);
  });

  function handleReplicationError(peer, err) {
    if (err.message.includes('connection reset by peer') || err.message.includes('connection timed out')) {
      logInfo(`[${peer.alias}] Disconnected`);
      return;
    }
    if (err.message.includes('Duplicate connection')) {
      logInfo(`[${peer.alias}] Connection duplicated`);
      return;
    }

    const errorMessage = `${peer.alias} replication error: ${err.message}`;
    console.error(errorMessage);
    fs.writeFileSync(path.join(peersDirectoryPath, peer.alias, '.blacklisted'), errorMessage);
    logInfo(`Blacklisted ${peer.alias} due to replication error. Exiting for restart.`);
    process.exit(0);
  }

  function handleReceiveDriveKeyFromPeer(peer, buffer) {
    const result = goSync(() => JSON.parse(buffer.toString('utf8')));
    if (!result.success) {
      // We don't log anything because we expect the parsing to fail for all buffers except the key exchange message
      return;
    }
    if (result.data?.type !== 'share-drive-key') {
      return;
    }

    logInfo(`Received drive key from ${peer.alias}`);
    if (peer.incomingHyperdriveKeyHex) {
      // If a peer deletes their .storage directory they will create a new outgoing Hyperdrive the next time their
      // hinter-core starts up. When that happens it's easier to just restart in order to mirror their new drive.
      if (peer.incomingHyperdriveKeyHex !== result.data.outgoingHyperdriveKeyHex) {
        logInfo(`${peer.alias} has a new outgoing Hyperdrive. Exiting for restart.`);
        process.exit(0);
      }
      logInfo(`[${peer.alias}] Already setup`);
      return;
    }

    peer.incomingHyperdriveKeyHex = result.data.outgoingHyperdriveKeyHex;
    completeHyperdriveSetup(peer, result.data.outgoingHyperdriveKeyHex);
  }

  /*
   * We join a key exchange topic first for each peer in order to exchange drive keys with each peer
   */
  await Promise.all(
    peers.map(async (peer) => {
      const keyExchangeTopic = deriveKeyExchangeTopic(keyPair.publicKey.toString('hex'), peer.publicKey);
      logInfo(`Joining key exchange topic for ${peer.alias}: ${keyExchangeTopic.toString('hex')}`);
      const discovery = swarm.join(keyExchangeTopic, { client: true, server: true });
      await discovery.flushed();
    })
  );

  async function completeHyperdriveSetup(peer, incomingDriveKeyHex) {
    logInfo(`[${peer.alias}] Setting up drives with incoming drive key: ${incomingDriveKeyHex}`);

    const outgoingDiscovery = swarm.join(peer.outgoingHyperdrive.discoveryKey, { client: false, server: true });
    await outgoingDiscovery.flushed();

    const outgoingLocaldrive = new Localdrive(path.join(peersDirectoryPath, peer.alias, 'outgoing'));
    async function mirrorOutgoing() {
      logInfo(`[${peer.alias}] Mirroring outgoing drive...`);
      const outgoingMirror = outgoingLocaldrive.mirror(peer.outgoingHyperdrive);
      await outgoingMirror.done();
      logInfo(`[${peer.alias}] Successfully mirrored outgoing drive`);
    }

    const debouncedMirrorOutgoing = debounce(mirrorOutgoing, 1000);
    // Mirror when changes are detected in outgoing localdrive
    chokidar
      .watch(path.join(peersDirectoryPath, peer.alias, 'outgoing'), {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 1000,
        },
      })
      .on('all', async () => {
        logInfo(`[${peer.alias}] Detected change in local outgoing directory`);
        debouncedMirrorOutgoing();
      });
    debouncedMirrorOutgoing();

    if (peer.disableIncomingReports) {
      logInfo(`[${peer.alias}] Incoming reports are disabled`);
      return;
    }

    const incomingNamespace = store.namespace(`incoming:${peer.publicKey}`);
    const incomingHyperdrive = new Hyperdrive(incomingNamespace, b4a.from(incomingDriveKeyHex, 'hex'));
    await incomingHyperdrive.ready();
    const incomingDiscovery = swarm.join(incomingHyperdrive.discoveryKey, { client: true, server: false });
    await incomingDiscovery.flushed();

    const incomingLocaldrive = new Localdrive(path.join(peersDirectoryPath, peer.alias, 'incoming'));
    async function mirrorIncoming() {
      logInfo(`[${peer.alias}] Mirroring incoming drive...`);
      const incomingMirror = incomingHyperdrive.mirror(incomingLocaldrive);
      await incomingMirror.done();
      logInfo(`[${peer.alias}] Successfully mirrored incoming drive`);

      const size = await checkPeerSizeLimit(peer, incomingHyperdrive);
      logInfo(`[${peer.alias}] Incoming drive size: ${(size / 1024 / 1024).toFixed(3)} MB (${size} bytes)`);
    }

    const debouncedMirrorIncoming = debounce(mirrorIncoming, 1000);
    incomingHyperdrive.core.on('append', () => {
      logInfo(`[${peer.alias}] Detected change in incoming drive`);
      debouncedMirrorIncoming();
    });
    // Mirror when changes are detected in incoming localdrive
    chokidar
      .watch(path.join(peersDirectoryPath, peer.alias, 'incoming'), {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 1000,
        },
      })
      .on('all', async () => {
        logInfo(`[${peer.alias}] Detected change in local incoming directory`);
        debouncedMirrorIncoming();
      });
    debouncedMirrorIncoming();
  }

  logInfo('Ready to connect all peers!');
}

main();
