import fs from 'fs';
import path from 'path';
import os from 'os';
import hypercoreCrypto from 'hypercore-crypto';
import b4a from 'b4a';

export function getDataDir() {
    const dataDirIndex = process.argv.indexOf('--data-dir');
    if (dataDirIndex !== -1 && process.argv.length > dataDirIndex + 1) {
        return process.argv[dataDirIndex + 1];
    }
    return path.join(os.homedir(), 'hinter-core-data');
}

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
    const dataDir = getDataDir();
    const envFilePath = path.join(dataDir, '.env');
    if (!fs.existsSync(envFilePath)) {
        throw new Error(`${envFilePath} file not found.`);
    }
    const envFileContent = fs.readFileSync(envFilePath, 'utf8');
    const keyPair = {
        publicKey: b4a.from(envFileContent.match(/PUBLIC_KEY=([0-9a-f]+)/)[1], 'hex'),
        secretKey: b4a.from(envFileContent.match(/SECRET_KEY=([0-9a-f]+)/)[1], 'hex')
    };
    if (!hypercoreCrypto.validateKeyPair(keyPair)) {
        throw new Error('Key pair not valid');
    }

    return { keyPair };
}
