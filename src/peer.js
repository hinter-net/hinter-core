import fs from 'fs';
import path from 'path';
import process from 'process';
import { calculateDriveSize, getPeersDir } from './utils.js';
import { parsePeerConfig } from './config.js';

export function parsePeers(peersDirectoryPath, globalConfig) {
  const peers = fs
    .readdirSync(peersDirectoryPath)
    .map((peerDirectoryName) => {
      const peerDirectoryPath = path.join(peersDirectoryPath, peerDirectoryName);
      // Tolerate files like .DS_STORE
      if (!fs.statSync(peerDirectoryPath).isDirectory()) {
        return null;
      }

      const peer = parsePeerConfig(peerDirectoryPath, globalConfig);
      peer.alias = path.basename(peerDirectoryPath);

      ['incoming', 'outgoing'].forEach((expectedPeerDirectoryName) => {
        const expectedPeerDirectoryPath = path.join(peerDirectoryPath, expectedPeerDirectoryName);
        fs.mkdirSync(expectedPeerDirectoryPath, { recursive: true });
        // Unlikely, but there may already be files (not directories) named incoming or outgoing in the peer directory
        if (!fs.statSync(expectedPeerDirectoryPath).isDirectory()) {
          throw new Error(`${expectedPeerDirectoryPath} is not a directory`);
        }
      });

      if (fs.existsSync(path.join(peerDirectoryPath, '.blacklisted'))) {
        // Have blacklisted peers be ignored by the .filter(Boolean) below
        return null;
      }

      return peer;
    })
    .filter(Boolean);

  if (new Set(peers.map((peer) => peer.publicKey)).size !== peers.length) {
    throw new Error('Duplicate public key found in peer configurations');
  }

  return peers;
}

export async function checkPeerSizeLimit(peer, incomingHyperdrive) {
  const peersDirectoryPath = getPeersDir();
  const incomingDriveSize = await calculateDriveSize(incomingHyperdrive);
  if (incomingDriveSize > peer.peerSizeLimitMB * 1024 * 1024) {
    fs.writeFileSync(path.join(peersDirectoryPath, peer.alias, '.blacklisted'), 'Exceeded the size limit');
    console.log(`${peer.alias} blacklisted for exceeding the size limit (${incomingDriveSize}). Exiting for restart.`);
    process.exit(0);
  }
  return incomingDriveSize;
}
