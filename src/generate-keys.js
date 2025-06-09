import fs from 'fs';
import crypto from 'hypercore-crypto';

if (fs.existsSync('.env')) {
    throw new Error('.env already exists!');
}

const { publicKey, secretKey } = crypto.keyPair();
const envContent = `PUBLIC_KEY=${Buffer.from(publicKey).toString('hex')}\nSECRET_KEY=${Buffer.from(secretKey).toString('hex')}`;
fs.writeFileSync('.env', envContent);
console.log('Generated keys!');
