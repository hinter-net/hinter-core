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
import { printAsciiArt, parseEnvFile, getDataDir, getPeersDir, deriveKeyExchangeTopic } from './utils.js';
import { checkPeerSizeLimit, parsePeersAndMonitorForChanges } from './peer.js';
import { parseGlobalConfig } from './config.js';

const { debounce } = lodash;

printAsciiArt();

async function main() {
  const dataDir = getDataDir();
  const { keyPair } = await parseEnvFile();
  const globalConfig = parseGlobalConfig();
  const peersDirectoryPath = getPeersDir(dataDir);
  console.log('Parsing peers...');
  const peerConfigs = parsePeersAndMonitorForChanges(peersDirectoryPath, globalConfig, () => {
    console.log('Peers have changed. Exiting to allow restart.');
    process.exit(0);
  });
  console.log(`Parsed ${peerConfigs.length} peer(s)!`);

  console.log('Preparing to connect...');
  const storageDir = path.join(dataDir, '.storage');
  const store = new Corestore(storageDir);
  await store.ready();

  // Create a Hyperswarm instance with key pair
  const swarm = new Hyperswarm({ keyPair });

  const cleanup = async () => {
    console.log('Closing swarm...');
    await swarm.destroy();
    console.log('Closed swarm.');
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

      console.log(`[${peerConfig.alias}] Outgoing drive key: ${outgoingHyperdrive.key.toString('hex')}`);
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
      console.error(`Unknown peer with public key ${peerPublicKey}`);
      conn.end();
      return;
    }

    const stream = store.replicate(conn);
    stream.on('error', (err) => handleReplicationError(peer, err));
    console.log(`Connected to ${peer.alias}!`);

    conn.on('data', (buffer) => handleReceiveDriveKeyFromPeer(peer, buffer));
    console.log(`Sending drive key to ${peer.alias}`);
    const message = {
      type: 'share-drive-key',
      outgoingHyperdriveKeyHex: peer.outgoingHyperdrive.key.toString('hex'),
    };
    conn.write(JSON.stringify(message), 'utf8');
  });

  function handleReplicationError(peer, err) {
    if (err.message.includes('connection reset by peer') || err.message.includes('connection timed out')) {
      console.log(`${peer.alias} disconnected.`);
      return;
    }
    if (err.message.includes('Duplicate connection')) {
      console.log(`${peer.alias} connection duplicated.`);
      return;
    }

    const errorMessage = `${peer.alias} replication error: ${err.message}`;
    console.error(errorMessage);
    fs.writeFileSync(path.join(peersDirectoryPath, peer.alias, '.blacklisted'), errorMessage);
    console.log(`Blacklisted ${peer.alias} due to replication error. Exiting for restart.`);
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

    console.log(`Received drive key exchange message from ${peer.alias}:`, result.data);
    if (peer.incomingHyperdriveKeyHex) {
      // If a peer deletes their .storage directory they will create a new outgoing Hyperdrive the next time their
      // hinter-core starts up. When that happens it's easier to just restart in order to mirror their new drive.
      if (peer.incomingHyperdriveKeyHex !== result.data.outgoingHyperdriveKeyHex) {
        console.log(`${peer.alias} has a new outgoing Hyperdrive. Exiting for restart.`);
        process.exit(0);
      }
      console.log(`[${peer.alias}] Already setup`);
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
      console.log(`[${peer.alias}] Joining key exchange: ${keyExchangeTopic.toString('hex')}`);
      const discovery = swarm.join(keyExchangeTopic, { client: true, server: true });
      await discovery.flushed();
      console.log(`[${peer.alias}] Joined key exchange`);
    })
  );

  async function completeHyperdriveSetup(peer, incomingDriveKeyHex) {
    console.log(`[${peer.alias}] Setting up drives with incoming drive key: ${incomingDriveKeyHex}`);

    const outgoingDiscovery = swarm.join(peer.outgoingHyperdrive.discoveryKey, { client: false, server: true });
    await outgoingDiscovery.flushed();

    const outgoingLocaldrive = new Localdrive(path.join(peersDirectoryPath, peer.alias, 'outgoing'));
    async function mirrorOutgoing() {
      console.log(`[${peer.alias}] OUT: Mirroring outgoing drive`);
      const outgoingMirror = outgoingLocaldrive.mirror(peer.outgoingHyperdrive);
      await outgoingMirror.done();
      console.log(`[${peer.alias}] OUT: Successfully mirrored outgoing drive`);
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
        console.log(`OUT: Detected change in local outgoing directory for ${peer.alias}`);
        debouncedMirrorOutgoing();
      });
    debouncedMirrorOutgoing();

    if (peer.disableIncomingReports) {
      console.log(`[${peer.alias}] Incoming reports are disabled`);
      return;
    }

    const incomingNamespace = store.namespace(`incoming:${peer.publicKey}`);
    const incomingHyperdrive = new Hyperdrive(incomingNamespace, b4a.from(incomingDriveKeyHex, 'hex'));
    await incomingHyperdrive.ready();
    const incomingDiscovery = swarm.join(incomingHyperdrive.discoveryKey, { client: true, server: false });
    await incomingDiscovery.flushed();

    const incomingLocaldrive = new Localdrive(path.join(peersDirectoryPath, peer.alias, 'incoming'));
    async function mirrorIncoming() {
      console.log(`[${peer.alias}] IN: Mirroring incoming drive`);
      const incomingMirror = incomingHyperdrive.mirror(incomingLocaldrive);
      await incomingMirror.done();
      console.log(`[${peer.alias}] IN: Successfully mirrored incoming drive`);

      console.log(`[${peer.alias}] Calculating incoming drive size`);
      const size = await checkPeerSizeLimit(peer, incomingHyperdrive);
      console.log(`[${peer.alias}] Calculated incoming drive size: ${size / 1024 / 1024}MB (${size})`);
    }

    const debouncedMirrorIncoming = debounce(mirrorIncoming, 1000);
    incomingHyperdrive.core.on('append', () => {
      console.log(`[${peer.alias}] IN: Detected change in incoming drive`);
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
        console.log(`[${peer.alias}] IN: Detected change in local incoming directory`);
        debouncedMirrorIncoming();
      });
    debouncedMirrorIncoming();
  }

  console.log('Ready to connect all peers!');
}

main();
