import fs from 'bare-fs';
import path from 'bare-path';
import process from 'bare-process';
import { calculateDirectorySize } from './utils';

function validatePeerDirectory(peerDirectoryPath) {
    const configPath = path.join(peerDirectoryPath, 'hinter.config.json');
    if (!fs.existsSync(configPath)) {
        throw new Error(`hinter.config.json not found in ${peerDirectoryPath}`);
    }

    const publicKey = JSON.parse(fs.readFileSync(configPath, 'utf-8')).publicKey;
    if (!publicKey || !/^[a-f0-9]{64}$/.test(publicKey)) {
        throw new Error(`Invalid or missing publicKey in ${configPath}`);
    }

    ['incoming', 'outgoing'].forEach(expectedPeerDirectoryName => {
        const expectedPeerDirectoryPath = path.join(peerDirectoryPath, expectedPeerDirectoryName);
        fs.mkdirSync(expectedPeerDirectoryPath, { recursive: true });
        if (!fs.statSync(expectedPeerDirectoryPath).isDirectory()) {
            throw new Error(`${expectedPeerDirectoryPath} is not a directory`);
        }
    });

    return { peerAlias: path.basename(peerDirectoryPath), peerPublicKey: publicKey };
}

function checkPeerSizeLimit(peerDirectoryPath, peerAlias, sizeLimitMB) {
    if (fs.existsSync(path.join(peerDirectoryPath, '.blacklisted'))) {
        return { isBlacklisted: true };
    }
    const incomingDirectorySize = calculateDirectorySize(path.join(peerDirectoryPath, 'incoming'));
    if (incomingDirectorySize > sizeLimitMB * 1024 * 1024) {
        return { isBlacklisted: false, exceedsSizeLimit: true };
    }
    return { isBlacklisted: false, exceedsSizeLimit: false };
}

export function parsePeers(peersDirectoryPath, peerSizeLimitMB) {
    const peers = fs.readdirSync(peersDirectoryPath).map(peerDirectoryName => {
        const peerDirectoryPath = path.join(peersDirectoryPath, peerDirectoryName);
        if (!fs.statSync(peerDirectoryPath).isDirectory()) {
            return null;
        }
        const { peerAlias, peerPublicKey } = validatePeerDirectory(peerDirectoryPath);
        const sizeCheckResult = checkPeerSizeLimit(peerDirectoryPath, peerAlias, peerSizeLimitMB);
        if (sizeCheckResult.isBlacklisted) {
            return null;
        }
        if (sizeCheckResult.exceedsSizeLimit) {
            return { alias: peerAlias, publicKey: peerPublicKey, exceedsSizeLimit: true };
        }
        return { alias: peerAlias, publicKey: peerPublicKey };
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

    return peers.filter(peer => !peer.isBlacklisted);
}
