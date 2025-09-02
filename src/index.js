import fs from 'fs';
import path from 'path';
import process from 'process';
import Hyperswarm from 'hyperswarm';
import Hyperdrive from 'hyperdrive';
import Localdrive from 'localdrive';
import Corestore from 'corestore';
import hypercoreCrypto from 'hypercore-crypto';
import b4a from 'b4a';
import { printAsciiArt, parseEnvFile } from './utils.js';
import { parsePeers } from './peer.js';
import { parseGlobalConfig } from './config.js';

printAsciiArt();

async function main() {
    const { keyPair } = await parseEnvFile();
    const globalConfig = parseGlobalConfig();
    const peersDirectoryPath = path.join('hinter-core-data', 'peers');
    console.log('Parsing peers...');
    const initialPeers = await parsePeers(peersDirectoryPath, globalConfig);
    // Clone initialPeers to be able to add dynamic elements to it
    const peers = structuredClone(initialPeers);
    console.log(`Parsed ${initialPeers.length} peers!`);
    setInterval(async () => {
        const currentPeers = await parsePeers(peersDirectoryPath, globalConfig);
        // This assumes parsePeers() returns an object that is fully serializable with toString()
        if (initialPeers.map(peer => peer.toString()).sort().toString() !== currentPeers.map(peer => peer.toString()).sort().toString()) {
            console.log('Peers have changed. Exiting to allow restart.');
            process.exit(0);
        }
    }, 60000);

    console.log('Preparing to connect...');
    // Create Corestore instances per peer in a local directory
    await Promise.all(peers.map(async (peer) => {
        if (!peer.disableIncomingReports) {
            const incomingCorestorePath = path.join('.storage', peer.publicKey, 'incoming');
            fs.rmSync(incomingCorestorePath, { recursive: true, force: true });
            const incomingCorestore = new Corestore(incomingCorestorePath);
            await incomingCorestore.ready();
            peer.incomingCorestore = incomingCorestore;
        }

        const outgoingCorestore = new Corestore(path.join('.storage', peer.publicKey, 'outgoing'));
        await outgoingCorestore.ready();
        peer.outgoingCorestore = outgoingCorestore;
    }));

    // Create a Hyperswarm instance with key pair
    const swarm = new Hyperswarm({ keyPair });

    const cleanup = async () => {
        console.log('Closing swarm...');
        await swarm.destroy();
        console.log('Closed swarm.');
        process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // On connection with a peer, replicate the respective Corestore instances
    swarm.on('connection', (conn, peerInfo) => {
        const peer = peers.find(peer => peer.publicKey === Buffer.from(peerInfo.publicKey).toString('hex'));
        if (!peer) {
            conn.end();
        }
        if (!peer.disableIncomingReports) {
            peer.incomingCorestore.replicate(conn);
        }
        peer.outgoingCorestore.replicate(conn);
        peer.connection = conn;
        console.log(`Connected to ${peer.alias}!`);
    });

    await Promise.all(peers.map(async (peer) => {
        if (!peer.disableIncomingReports) {
            peer.incomingLocaldrive = new Localdrive(path.join(peersDirectoryPath, peer.alias, 'incoming'));

            const incomingHyperdriveKeyPair = hypercoreCrypto.keyPair(hypercoreCrypto.data(b4a.concat([b4a.from(peer.publicKey, 'hex'), keyPair.publicKey])));
            peer.incomingHyperdrive = new Hyperdrive(peer.incomingCorestore, incomingHyperdriveKeyPair.publicKey);
            await peer.incomingHyperdrive.ready();

            peer.incomingDiscovery = swarm.join(peer.incomingHyperdrive.discoveryKey, { client: true, server: false });
            await peer.incomingDiscovery.flushed();
        }

        peer.outgoingLocaldrive = new Localdrive(path.join(peersDirectoryPath, peer.alias, 'outgoing'));

        const outgoingHyperdriveKeyPair = hypercoreCrypto.keyPair(hypercoreCrypto.data(b4a.concat([keyPair.publicKey, b4a.from(peer.publicKey, 'hex')])));
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
        const initialOutgoingMirror = peer.outgoingLocaldrive.mirror(peer.outgoingHyperdrive);
        await initialOutgoingMirror.done();

        // Mirror detected incoming changes in hyperdrive
        if (!peer.disableIncomingReports) {
            (async () => {
                for await (const { } of peer.incomingHyperdrive.watch()) {
                    const incomingMirror = peer.incomingHyperdrive.mirror(peer.incomingLocaldrive);
                    await incomingMirror.done();
                    console.log(`${peer.alias} detected incoming: ${JSON.stringify(incomingMirror.count)}`);
                }
            })();
        }

        // Mirror detected outgoing changes in localdrive
        fs.watch(path.join(peersDirectoryPath, peer.alias, 'outgoing'), { recursive: true }, async () => {
            const outgoingMirror = peer.outgoingLocaldrive.mirror(peer.outgoingHyperdrive);
            await outgoingMirror.done();
            console.log(`${peer.alias} detected outgoing: ${JSON.stringify(outgoingMirror.count)}`);
        });
    }));
}

main();
