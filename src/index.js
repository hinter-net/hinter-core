import fs from 'bare-fs';
import path from 'bare-path';
import Hyperswarm from 'hyperswarm';
import Hyperdrive from 'hyperdrive';
import Localdrive from 'localdrive';
import Corestore from 'corestore';
import crypto from 'hypercore-crypto';
import b4a from 'b4a';
import { printAsciiArt } from './utils';

printAsciiArt();

async function parseKeyPairFromEnv() {
    if (!fs.existsSync('.env')) {
        throw new Error('Generate .env first!');
    }
    console.log('Parsing key pair...');
    const dotenvContent = fs.readFileSync('.env', 'utf8');
    const keyPair = {
        publicKey: b4a.from(dotenvContent.match(/PUBLIC_KEY=([0-9a-f]+)/)[1], 'hex'),
        secretKey: b4a.from(dotenvContent.match(/SECRET_KEY=([0-9a-f]+)/)[1], 'hex')
    };
    if (!crypto.validateKeyPair(keyPair)) {
        throw new Error('Key pair not valid');
    }
    console.log('Parsed key pair!');
    return keyPair;
}

async function parsePeers(peersDirectoryPath) {
    console.log('Parsing peers...');
    const peers = fs.readdirSync(peersDirectoryPath).map(peersFileName => {
        const peerDirectoryPath = path.join(peersDirectoryPath, peersFileName);
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
        expectedPeerDirectoryNames.map(expectedPeerDirectoryName => {
            if (!peerDirectoryContents.includes(expectedPeerDirectoryName)) {
                throw new Error(`Missing ${expectedPeerDirectoryName} in peers/${peerPublicKey}`);
            }
            if (!fs.statSync(path.join(peerDirectoryPath, expectedPeerDirectoryName)).isDirectory()) {
                throw new Error(`peers/${peerPublicKey}/${expectedPeerDirectoryName} is not a directory`);
            }
        });
        return { alias: peerAlias, publicKey: peerPublicKey };
    });
    console.log(`Parsed ${peers.length} peers!`);
    return peers;
}

async function main() {
    const keyPair = await parseKeyPairFromEnv();
    const peersDirectoryPath = path.join('data', 'peers');
    const peers = await parsePeers(peersDirectoryPath);

    console.log('Preparing to connect...');
    // Create 2 Corestore instances per peer in a local directory
    await Promise.all(peers.map(async (peer) => {
        const incomingCorestore = new Corestore(path.join('.storage', peer.publicKey, 'incoming'));
        await incomingCorestore.ready();
        peer.incomingCorestore = incomingCorestore;

        const outgoingCorestore = new Corestore(path.join('.storage', peer.publicKey, 'outgoing'));
        await outgoingCorestore.ready();
        peer.outgoingCorestore = outgoingCorestore;
    }));

    // Create a Hyperswarm instance with key pair
    const swarm = new Hyperswarm({ keyPair });
    Pear.teardown(() => swarm.destroy());

    // On connection with a peer, replicate the respective Corestore instances
    swarm.on('connection', (conn, peerInfo) => {
        const peer = peers.find(peer => peer.publicKey === Buffer.from(peerInfo.publicKey).toString('hex'));
        if (peer) {
            peer.incomingCorestore.replicate(conn);
            peer.outgoingCorestore.replicate(conn);
            peer.connection = conn;
            console.log(`Connected to ${peer.alias}!`);
        } else {
            conn.end();
        }
    });

    await Promise.all(peers.map(async (peer) => {
        peer.incomingLocaldrive = new Localdrive(path.join(peersDirectoryPath, `${peer.alias}-${peer.publicKey}`, 'incoming'));

        const incomingHyperdriveKeyPair = crypto.keyPair(crypto.data(b4a.concat([b4a.from(peer.publicKey, 'hex'), keyPair.publicKey])));
        peer.incomingHyperdrive = new Hyperdrive(peer.incomingCorestore, incomingHyperdriveKeyPair.publicKey);
        await peer.incomingHyperdrive.ready();

        peer.incomingDiscovery = swarm.join(peer.incomingHyperdrive.discoveryKey, { client: true, server: false });
        await peer.incomingDiscovery.flushed();

        peer.outgoingLocaldrive = new Localdrive(path.join(peersDirectoryPath, `${peer.alias}-${peer.publicKey}`, 'outgoing'));

        const outgoingHyperdriveKeyPair = crypto.keyPair(crypto.data(b4a.concat([keyPair.publicKey, b4a.from(peer.publicKey, 'hex')])));
        const outgoingCorestoreMainHypercore = peer.outgoingCorestore.get({ key: outgoingHyperdriveKeyPair.publicKey, keyPair: outgoingHyperdriveKeyPair })
        await outgoingCorestoreMainHypercore.ready()
        peer.outgoingHyperdrive = new Hyperdrive(peer.outgoingCorestore, outgoingHyperdriveKeyPair.publicKey);
        await peer.outgoingHyperdrive.ready();

        peer.outgoingDiscovery = swarm.join(peer.outgoingHyperdrive.discoveryKey, { client: false, server: true });
        await peer.outgoingDiscovery.flushed();
    }));
    console.log('Ready to connect!');

    await Promise.all(peers.map(async (peer) => {
        // Do the initial mirror
        const initialIncomingMirror = peer.incomingHyperdrive.mirror(peer.incomingLocaldrive);
        await initialIncomingMirror.done();
        console.log(`${peer.alias} initial incoming: ${JSON.stringify(initialIncomingMirror.count)}`);

        const initialOutgoingMirror = peer.outgoingLocaldrive.mirror(peer.outgoingHyperdrive);
        await initialOutgoingMirror.done();
        console.log(`${peer.alias} initial outgoing: ${JSON.stringify(initialOutgoingMirror.count)}`);

        // Mirror detected incoming changes in hyperdrive
        (async () => {
            for await (const { } of peer.incomingHyperdrive.watch()) {
                const incomingMirror = peer.incomingHyperdrive.mirror(peer.incomingLocaldrive);
                await incomingMirror.done();
                console.log(`${peer.alias} detected incoming: ${JSON.stringify(incomingMirror.count)}`);
            }
        })();

        // Mirror detected outgoing changes in localdrive
        fs.watch(path.join(peersDirectoryPath, `${peer.alias}-${peer.publicKey}`, 'outgoing'), { recursive: true }, async () => {
            const outgoingMirror = peer.outgoingLocaldrive.mirror(peer.outgoingHyperdrive);
            await outgoingMirror.done();
            console.log(`${peer.alias} detected outgoing: ${JSON.stringify(outgoingMirror.count)}`);
        });
    }));
}

main();
