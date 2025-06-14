import fs from 'bare-fs';
import path from 'bare-path';
import process from 'bare-process';

/**
 * Recursively calculates the total size of a directory in bytes
 */
function calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    function traverse(currentPath) {
        const items = fs.readdirSync(currentPath);
        for (const item of items) {
            const itemPath = path.join(currentPath, item);
            const stats = fs.statSync(itemPath);
            if (stats.isDirectory()) {
                traverse(itemPath);
            } else {
                totalSize += stats.size;
            }
        }
    }
    
    traverse(dirPath);
    return totalSize;
}

/**
 * Validates peer directory structure and naming conventions
 */
function validatePeerDirectory(peerDirectoryPath, peersFileName) {
    if (!fs.statSync(peerDirectoryPath).isDirectory()) {
        throw new Error(`${peersFileName} is not a directory`);
    }
    
    if (!/^[^-]+-[a-f0-9]{64}$/.test(peersFileName)) {
        throw new Error(`${peersFileName} does not satisfy the ALIAS-PUBLIC_KEY format`);
    }
    
    const [peerAlias, peerPublicKey] = peersFileName.split('-');
    
    const expectedPeerDirectoryNames = ['incoming', 'outgoing'];
    const peerDirectoryContents = fs.readdirSync(peerDirectoryPath);
    
    if (peerDirectoryContents.length !== expectedPeerDirectoryNames.length) {
        throw new Error(`Unexpected number of contents in peers/${peerPublicKey}`);
    }
    
    expectedPeerDirectoryNames.forEach(expectedPeerDirectoryName => {
        if (!peerDirectoryContents.includes(expectedPeerDirectoryName)) {
            throw new Error(`Missing ${expectedPeerDirectoryName} in peers/${peerPublicKey}`);
        }
        if (!fs.statSync(path.join(peerDirectoryPath, expectedPeerDirectoryName)).isDirectory()) {
            throw new Error(`peers/${peerPublicKey}/${expectedPeerDirectoryName} is not a directory`);
        }
    });
    
    return { peerAlias, peerPublicKey };
}

/**
 * Checks peer size limit and handles blacklisting if exceeded
 */
function checkPeerSizeLimit(peerDirectoryPath, peerAlias, peerPublicKey, sizeLimitBytes, sizeLimitMB) {
    const blacklistFilePath = path.join(peerDirectoryPath, '.blacklisted');
    
    // Skip if peer is already blacklisted
    if (fs.existsSync(blacklistFilePath)) {
        console.log(`Skipping blacklisted peer: ${peerAlias}`);
        return { isBlacklisted: true, isAlreadyBlacklisted: true };
    }
    
    // Calculate incoming directory size
    const incomingDirectoryPath = path.join(peerDirectoryPath, 'incoming');
    const totalSize = calculateDirectorySize(incomingDirectoryPath);
    
    // Check if peer exceeds size limit
    if (totalSize > sizeLimitBytes) {
        fs.writeFileSync(blacklistFilePath, '');
        console.log(`Blacklisted peer ${peerAlias} for exceeding ${sizeLimitMB}MB limit (${Math.round(totalSize / 1024 / 1024)}MB used)`);
        return { isBlacklisted: true, isAlreadyBlacklisted: false };
    }
    
    return { isBlacklisted: false, isAlreadyBlacklisted: false };
}

/**
 * Parses peers from the specified directory, handling validation, size limits, and blacklisting
 */
export function parsePeers(peersDirectoryPath) {
    // Parse size limit from environment variable (default 1024MB = 1GB)
    const sizeLimitMB = parseInt(process.env.PEER_SIZE_LIMIT_MB || '1024');
    const sizeLimitBytes = sizeLimitMB * 1024 * 1024;
    
    const peers = fs.readdirSync(peersDirectoryPath).map(peersFileName => {
        const peerDirectoryPath = path.join(peersDirectoryPath, peersFileName);
        
        try {
            // Validate peer directory structure
            const { peerAlias, peerPublicKey } = validatePeerDirectory(peerDirectoryPath, peersFileName);
            
            // Check size limits and blacklisting
            const sizeCheckResult = checkPeerSizeLimit(peerDirectoryPath, peerAlias, peerPublicKey, sizeLimitBytes, sizeLimitMB);
            
            if (sizeCheckResult.isAlreadyBlacklisted) {
                return null; // Skip already blacklisted peers
            }
            
            if (sizeCheckResult.isBlacklisted) {
                return { alias: peerAlias, publicKey: peerPublicKey, isBlacklisted: true };
            }
            
            return { alias: peerAlias, publicKey: peerPublicKey };
            
        } catch (error) {
            throw error; // Re-throw validation errors
        }
    }).filter(Boolean); // Remove null entries (already blacklisted peers)
    
    // Check for newly blacklisted peers and exit if any found
    const blacklistedPeers = peers.filter(peer => peer.isBlacklisted);
    if (blacklistedPeers.length > 0) {
        const blacklistedAliases = blacklistedPeers.map(peer => peer.alias);
        console.log(`Blacklisted peers: ${blacklistedAliases.join(', ')}. Exiting for restart.`);
        process.exit(0);
    }
    
    return peers.filter(peer => !peer.isBlacklisted);
}
