import fs from 'bare-fs';
import path from 'bare-path';
import crypto from 'hypercore-crypto';
import b4a from 'b4a';

export function printAsciiArt() {
    console.log(
        '  _     _       _                                     \n',
        '| |   (_)     | |                                    \n',
        '| |__  _ _ __ | |_ ___ _ __   ___   ___ ___  _ __ ___ \n',
        '| \'_ \\| | \'_ \\| __/ _ \\ \'__| |___| / __/ _ \\| \'__/ _ \\\n',
        '| | | | | | | | ||  __/ |         | (_| (_) | | |  __/\n',
        '|_| |_|_|_| |_|\\__\\___|_|          \\___\\___/|_|  \\___|\n',
        '                                                     \n'
    );
}

export function calculateDirectorySize(dirPath) {
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

export async function parseEnvFile() {
    const envFilePath = path.join('hinter-core-data', '.env');
    if (!fs.existsSync(envFilePath)) {
        throw new Error('hinter-core-data/.env file not found.');
    }
    const envFileContent = fs.readFileSync(envFilePath, 'utf8');
    const keyPair = {
        publicKey: b4a.from(envFileContent.match(/PUBLIC_KEY=([0-9a-f]+)/)[1], 'hex'),
        secretKey: b4a.from(envFileContent.match(/SECRET_KEY=([0-9a-f]+)/)[1], 'hex')
    };
    if (!crypto.validateKeyPair(keyPair)) {
        throw new Error('Key pair not valid');
    }
    
    return { keyPair };
}
