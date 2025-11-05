import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import hypercoreCrypto from 'hypercore-crypto';
import b4a from 'b4a';

export function getDataDir() {
  const dataDirIndex = process.argv.indexOf('--data-dir');
  if (dataDirIndex !== -1 && process.argv.length > dataDirIndex + 1) {
    const dataDir = process.argv[dataDirIndex + 1];
    if (!path.isAbsolute(dataDir)) {
      throw new Error('The --data-dir path must be an absolute path.');
    }
    return dataDir;
  }
  return path.join(os.homedir(), 'hinter-core-data');
}

export function getPeersDir(dataDir = getDataDir()) {
  return path.join(dataDir, 'peers');
}

export function printAsciiArt() {
  console.log(
    '  _     _       _                                     \n',
    '| |   (_)     | |                                    \n',
    '| |__  _ _ __ | |_ ___ _ __   ___   ___ ___  _ __ ___ \n',
    "| '_ \\| | '_ \\| __/ _ \\ '__| |___| / __/ _ \\| '__/ _ \\\n",
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
    secretKey: b4a.from(envFileContent.match(/SECRET_KEY=([0-9a-f]+)/)[1], 'hex'),
  };
  if (!hypercoreCrypto.validateKeyPair(keyPair)) {
    throw new Error('Key pair not valid');
  }

  return { keyPair };
}

// Derive a topic from two identities (order-independent)
export function deriveKeyExchangeTopic(publicKeyA, publicKeyB) {
  const [x, y] = [publicKeyA.toLowerCase(), publicKeyB.toLowerCase()].sort();
  return crypto.createHash('sha256').update('key-exchange-topic').update(x).update(y).digest();
}

export async function calculateDriveSize(hyperdrive) {
  let total = 0;

  for await (const entry of hyperdrive.db.createHistoryStream()) {
    if (entry.type !== 'put') continue;

    const hyperblobs = await hyperdrive.getBlobs();
    const { blob } = entry.value;
    const downloaded = await hyperblobs.core.has(
      blob.blockOffset,
      blob.blockOffset + Math.max(blob.blockLength - 1, 0)
    );
    if (downloaded) {
      total += blob.byteLength;
    }
  }

  return total;
}

export function logInfo(message) {
  console.log('\x1b[2m', new Date().toISOString(), '\x1b[0m', message);
}

export function logError(message, error) {
  console.error('\x1b[2m', new Date().toISOString(), '\x1b[0m', message, error);
}
