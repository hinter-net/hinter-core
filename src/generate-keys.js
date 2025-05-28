import crypto from 'hypercore-crypto';
import fs from 'bare-fs';

if (fs.existsSync('.env')) {
    throw new Error('.env already exists!');
}

const { publicKey, secretKey } = crypto.keyPair();
const envContent = `PUBLIC_KEY=${Buffer.from(publicKey).toString('hex')}\nSECRET_KEY=${Buffer.from(secretKey).toString('hex')}`;
fs.writeFileSync('.env', envContent);
