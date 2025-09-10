#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import hypercoreCrypto from 'hypercore-crypto';
import { getDataDir } from './utils.js';

const dataDir = getDataDir();

if (fs.existsSync(dataDir) && (!fs.statSync(dataDir).isDirectory() || fs.readdirSync(dataDir).length > 0)) {
    throw new Error(`'${dataDir}' must either not exist or be an empty directory for initialization.`);
}

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(path.join(dataDir, 'peers'), { recursive: true });

const { publicKey, secretKey } = hypercoreCrypto.keyPair();
const envContent = `PUBLIC_KEY=${Buffer.from(publicKey).toString('hex')}\nSECRET_KEY=${Buffer.from(secretKey).toString('hex')}`;
const envFilePath = path.join(dataDir, '.env');
fs.writeFileSync(envFilePath, envContent);
console.log(`Initialization complete. Generated key pair and saved to ${envFilePath}`);
