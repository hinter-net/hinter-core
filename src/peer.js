import fs from 'bare-fs';
import path from 'bare-path';
import process from 'bare-process';
import { calculateDirectorySize } from './utils';
import { parsePeerConfig } from './config';

function checkPeerSizeLimit(peer) {
    // Saving some compute by not calling calculateDirectorySize() on already blacklisted peers
    if (fs.existsSync(path.join(peerDirectoryPath, '.blacklisted'))) {
        return { isBlacklisted: true };
    }
    const incomingDirectorySize = calculateDirectorySize(path.join('.storage', peer.publicKey, 'incoming'));
    if (incomingDirectorySize > peer.peerSizeLimitMB * 1024 * 1024) {
        return { isBlacklisted: false, exceedsSizeLimit: true };
    }
    return { isBlacklisted: false, exceedsSizeLimit: false };
}

export function parsePeers(peersDirectoryPath, globalConfig) {
    const peers = fs.readdirSync(peersDirectoryPath).map(peerDirectoryName => {
        const peerDirectoryPath = path.join(peersDirectoryPath, peerDirectoryName);
        // Tolerate files like .DS_STORE
        if (!fs.statSync(peerDirectoryPath).isDirectory()) {
            return null;
        }

        const peer = parsePeerConfig(peerDirectoryPath, globalConfig);
        peer.alias = path.basename(peerDirectoryPath);

        ['incoming', 'outgoing'].forEach(expectedPeerDirectoryName => {
            const expectedPeerDirectoryPath = path.join(peerDirectoryPath, expectedPeerDirectoryName);
            fs.mkdirSync(expectedPeerDirectoryPath, { recursive: true });
            // Unlikely, but there may already be files (not directories) named incoming or outgoing in the peer directory 
            if (!fs.statSync(expectedPeerDirectoryPath).isDirectory()) {
                throw new Error(`${expectedPeerDirectoryPath} is not a directory`);
            }
        });

        const sizeCheckResult = checkPeerSizeLimit(peer);
        // Have blacklisted peers be ignored by the .filter(Boolean) below
        if (sizeCheckResult.isBlacklisted) {
            return null;
        }
        if (sizeCheckResult.exceedsSizeLimit) {
            peer.exceedsSizeLimit = true;
        }
        return peer;
    }).filter(Boolean);

    const peersToBlacklist = peers.filter(peer => peer.exceedsSizeLimit);
    if (peersToBlacklist.length > 0) {
        const blacklistedAliases = peersToBlacklist.map(peer => {
            fs.writeFileSync(path.join(peersDirectoryPath, peer.alias, '.blacklisted'), '');
            return peer.alias;
        });
        console.log(`Peers blacklisted for exceeding the size limit: ${blacklistedAliases.join(', ')}. Exiting for restart.`);
        process.exit(0);
    }

    return peers;
}
