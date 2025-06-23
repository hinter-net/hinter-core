import fs from 'bare-fs';
import path from 'bare-path';
import process from 'bare-process';
import { calculateDirectorySize } from './utils';

function validatePeerDirectory(peerDirectoryPath, peerDirectoryName) {
    if (!/^[^-]+-[a-f0-9]{64}$/.test(peerDirectoryName)) {
        throw new Error(`${peerDirectoryName} does not satisfy the ALIAS-PUBLIC_KEY format`);
    }

    ['incoming', 'outgoing'].forEach(expectedPeerDirectoryName => {
        const expectedPeerDirectoryPath = path.join(peerDirectoryPath, expectedPeerDirectoryName);
        fs.mkdirSync(expectedPeerDirectoryPath, { recursive: true });
        if (!fs.statSync(expectedPeerDirectoryPath).isDirectory()) {
            throw new Error(`${expectedPeerDirectoryPath} is not a directory`);
        }
    });

    const [peerAlias, peerPublicKey] = peerDirectoryName.split('-');
    return { peerAlias, peerPublicKey };
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
        const { peerAlias, peerPublicKey } = validatePeerDirectory(peerDirectoryPath, peerDirectoryName);
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
            fs.writeFileSync(path.join(peersDirectoryPath, `${peer.alias}-${peer.publicKey}`, '.blacklisted'), '');
            return peer.alias;
        });
        console.log(`Peers blacklisted for exceeding the size limit: ${blacklistedAliases.join(', ')}. Exiting for restart.`);
        process.exit(0);
    }

    return peers.filter(peer => !peer.isBlacklisted);
}
