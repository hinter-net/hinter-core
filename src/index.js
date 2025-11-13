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
import { pauseHeartbeatForPeer, runHeartbeatForPeerOverConnection } from './heartbeats.js';
import {
  getIncomingHyperdriveKeyHex,
  recordIncomingMirrorSuccess,
  recordOutgoingMirrorSuccess,
  setIncomingHeartbeat,
  setIncomingHyperdriveKeyHex,
} from './peer-state.js';
import { detectIncomingStaleness, detectOutgoingStaleness } from './stale-detection.js';
import { HEARTBEAT_MESSAGE_TYPE, KEY_EXCHANGE_MESSAGE_TYPE, PERIODIC_MIRROR_INTERVAL_IN_SECONDS } from './constants.js';

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

      return { ...peerConfig, outgoingHyperdrive };
    })
  );

  /*
   * Establish peer connections, initiate heartbeats, and complete Hyperdrives setup for each peer (upon
   * receiving their drive key)
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
    logInfo(`Connected to ${peer.alias}!`);
    stream.on('error', (err) => handleReplicationError(peer, err));
    conn.on('data', (buffer) => handleMessagesFromPeer(peer, buffer));

    runHeartbeatForPeerOverConnection(conn, peer, peer.outgoingHyperdrive);

    // Exchange drive keys
    const message = {
      type: KEY_EXCHANGE_MESSAGE_TYPE,
      outgoingHyperdriveKeyHex: peer.outgoingHyperdrive.key.toString('hex'),
    };
    conn.write(JSON.stringify(message), 'utf8');
    logInfo(`[${peer.alias}] Sent drive key to ${peer.alias}`);
  });

  function handleReplicationError(peer, err) {
    pauseHeartbeatForPeer(peer);
    if (err.message.includes('connection reset by peer') || err.message.includes('connection timed out')) {
      logInfo(`[${peer.alias}] Disconnected`);
      return;
    }
    if (err.message.includes('Duplicate connection')) {
      logInfo(`[${peer.alias}] Connection duplicated`);
      return;
    }

    const errorMessage = `${peer.alias} replication error: ${err.message}`;
    logError(errorMessage);
    fs.writeFileSync(path.join(peersDirectoryPath, peer.alias, '.blacklisted'), errorMessage);
    logInfo(`Blacklisted ${peer.alias} due to replication error. Exiting for restart.`);
    process.exit(0);
  }

  function handleMessagesFromPeer(peer, buffer) {
    const result = goSync(() => JSON.parse(buffer.toString('utf8')));
    if (!result.success) {
      // We don't log anything because we expect the parsing to fail for all buffers except the key exchange message
      return;
    }

    const { data: message } = result;
    switch (message?.type) {
      case KEY_EXCHANGE_MESSAGE_TYPE: {
        logInfo(`[${peer.alias}] Received drive key from ${peer.alias}`);
        const { outgoingHyperdriveKeyHex: driveKeyHex } = message;
        const existingIncomingHyperdriveKeyHex = getIncomingHyperdriveKeyHex(peer);
        if (existingIncomingHyperdriveKeyHex) {
          // If a peer deletes their .storage directory they will create a new outgoing Hyperdrive the next time their
          // hinter-core starts up. When that happens it's easier to just restart in order to mirror their new drive.
          if (existingIncomingHyperdriveKeyHex !== driveKeyHex) {
            logInfo(`${peer.alias} has a new outgoing Hyperdrive. Exiting for restart.`);
            process.exit(0);
          }
          logInfo(`[${peer.alias}] Already setup`);
          return;
        }

        setIncomingHyperdriveKeyHex(peer, driveKeyHex);
        completeHyperdriveSetup(peer, driveKeyHex);
        return;
      }

      case HEARTBEAT_MESSAGE_TYPE: {
        logInfo(`[${peer.alias}] Received heartbeat (${message.outgoingHyperdriveVersion}) from ${peer.alias}`);
        setIncomingHeartbeat(peer, message.outgoingHyperdriveVersion);
        return;
      }
    }
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
    const { outgoingHyperdrive } = peer;
    const outgoingDiscovery = swarm.join(outgoingHyperdrive.discoveryKey, { client: false, server: true });
    await outgoingDiscovery.flushed();

    const outgoingLocaldrive = new Localdrive(path.join(peersDirectoryPath, peer.alias, 'outgoing'));
    async function mirrorOutgoing(opts = { recordAction: true }) {
      logInfo(`[${peer.alias}] Mirroring outgoing drive...`);
      const outgoingMirror = outgoingLocaldrive.mirror(outgoingHyperdrive);
      await outgoingMirror.done();
      const mirroredVersion = outgoingHyperdrive.db.version;
      logInfo(`[${peer.alias}] Successfully mirrored outgoing drive (version: ${mirroredVersion})`);
      if (opts.recordAction) {
        recordOutgoingMirrorSuccess(peer, mirroredVersion);
      }
      return mirroredVersion;
    }

    const debouncedMirrorOutgoing = debounce(mirrorOutgoing, 1000);
    // Mirror when changes are detected in outgoing localdrive
    chokidar
      .watch(path.join(peersDirectoryPath, peer.alias, 'outgoing'), {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100,
        },
      })
      .on('all', () => {
        logInfo(`[${peer.alias}] Detected change in local outgoing directory`);
        debouncedMirrorOutgoing();
      });
    debouncedMirrorOutgoing();

    detectOutgoingStaleness(peer, {
      mirrorOutgoing,
      onStaleDriveDetected: () => {
        logError(`[${peer.alias}] Stale outgoing drive detected. Initiating periodic mirror`);
        setInterval(debouncedMirrorOutgoing, PERIODIC_MIRROR_INTERVAL_IN_SECONDS * 1000);
      },
    });

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
      const mirroredVersion = incomingHyperdrive.db.version;
      logInfo(`[${peer.alias}] Successfully mirrored incoming drive (version: ${mirroredVersion})`);
      recordIncomingMirrorSuccess(peer, mirroredVersion);

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
          pollInterval: 100,
        },
      })
      .on('all', () => {
        logInfo(`[${peer.alias}] Detected change in local incoming directory`);
        debouncedMirrorIncoming();
      });
    debouncedMirrorIncoming();

    detectIncomingStaleness(peer, {
      onStaleHeartbeatDetected: () => {
        logError(`[${peer.alias}] Stale incoming heartbeat detected for ${peer.alias}. Initiating periodic mirror`);
        setInterval(debouncedMirrorIncoming, PERIODIC_MIRROR_INTERVAL_IN_SECONDS * 1000);
      },
      onStaleDriveDetected: () => {
        logError(`[${peer.alias}] Stale incoming drive detected for ${peer.alias}. Initiating periodic mirror`);
        setInterval(debouncedMirrorIncoming, PERIODIC_MIRROR_INTERVAL_IN_SECONDS * 1000);
      },
    });
  }

  logInfo('Ready to connect all peers!');
}

main();
