#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import process from 'process';
import Hyperswarm from 'hyperswarm';
import Hyperdrive from 'hyperdrive';
import Localdrive from 'localdrive';
import Corestore from 'corestore';
import hypercoreCrypto from 'hypercore-crypto';
import b4a from 'b4a';
import chokidar from 'chokidar';
import { printAsciiArt, parseEnvFile, getDataDir } from './utils.js';
import { parsePeers } from './peer.js';
import { parseGlobalConfig } from './config.js';

printAsciiArt();

async function main() {
    const dataDir = getDataDir();
    const { keyPair } = await parseEnvFile();
    const globalConfig = parseGlobalConfig();
    const peersDirectoryPath = path.join(dataDir, 'peers');
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
    const storageDir = path.join(dataDir, '.storage');
    await Promise.all(peers.map(async (peer) => {
        if (!peer.disableIncomingReports) {
            const incomingCorestore = new Corestore(path.join(storageDir, peer.publicKey, 'incoming'));
            await incomingCorestore.ready();
            peer.incomingCorestore = incomingCorestore;
        }

        const outgoingCorestore = new Corestore(path.join(storageDir, peer.publicKey, 'outgoing'));
        await outgoingCorestore.ready();
        peer.outgoingCorestore = outgoingCorestore;
    }));

    // Create a Hyperswarm instance with key pair
    const swarm = new Hyperswarm({ keyPair });

    const cleanup = async () => {
        console.log('Closing swarm...');
        try {
            await swarm.destroy();
        } catch (err) {
            console.error(`Error closing swarm: ${err.message}`);
        }
        await swarm.destroy();
        console.log('Closed swarm.');
        console.log('Closing drives...');
        await Promise.all(peers.map(async (peer) => {
            if (peer.incomingHyperdrive) {
                try {
                    await peer.incomingHyperdrive.close();
                } catch (err) {
                    console.error(`Error closing incoming drive for ${peer.alias}: ${err.message}`);
                }
            }
            if (peer.outgoingHyperdrive) {
                try {
                    await peer.outgoingHyperdrive.close();
                } catch (err) {
                    console.error(`Error closing outgoing drive for ${peer.alias}: ${err.message}`);
                }
            }
        }));
        console.log('Closed drives.');
        process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // On connection with a peer, replicate the respective Corestore instances
    swarm.on('connection', (conn, peerInfo) => {
        const peer = peers.find(peer => peer.publicKey === Buffer.from(peerInfo.publicKey).toString('hex'));
        if (!peer) {
            conn.end();
            return;
        }
        if (!peer.disableIncomingReports) {
            const incomingStream = peer.incomingCorestore.replicate(conn);
            incomingStream.on('error', async (err) => {
                if (err.message.includes('connection reset by peer') || err.message.includes('connection timed out')) {
                    console.log(`${peer.alias} disconnected.`);
                    return;
                }
                const errorMessage = `Incoming replication error with ${peer.alias}: ${err.message}`;
                console.error(errorMessage);
                fs.writeFileSync(path.join(peersDirectoryPath, peer.alias, '.blacklisted'), errorMessage);
                console.log(`Blacklisted ${peer.alias} due to incoming replication error. Exiting for restart.`);
                process.exit(0);
            });
        }
        const outgoingStream = peer.outgoingCorestore.replicate(conn);
        outgoingStream.on('error', async (err) => {
            if (err.message.includes('connection reset by peer') || err.message.includes('connection timed out')) {
                console.log(`${peer.alias} disconnected.`);
                return;
            }
            const errorMessage = `Outgoing replication error with ${peer.alias}: ${err.message}`;
            console.error(errorMessage);
            fs.writeFileSync(path.join(peersDirectoryPath, peer.alias, '.blacklisted'), errorMessage);
            console.log(`Blacklisted ${peer.alias} due to outgoing replication error. Exiting for restart.`);
            process.exit(0);
        });

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
    console.log('Ready to connect all peers!');

    await Promise.all(peers.map(async (peer) => {
        if (!peer.disableIncomingReports) {
            // Force an initial incoming mirror
            const initialMirror = peer.incomingHyperdrive.mirror(peer.incomingLocaldrive);
            await initialMirror.done();
            // Mirror when changes are detected in incoming hyperdrive
            (async function watchIncoming() {
                for await (const { } of peer.incomingHyperdrive.watch()) {
                    const incomingMirror = peer.incomingHyperdrive.mirror(peer.incomingLocaldrive);
                    await incomingMirror.done();
                }
            })();
            // Mirror when changes are detected in incoming localdrive
            chokidar.watch(path.join(peersDirectoryPath, peer.alias, 'incoming'), {
                persistent: true,
                ignoreInitial: true,
                awaitWriteFinish: {
                    stabilityThreshold: 2000,
                    pollInterval: 100
                }
            }).on('all', async () => {
                const incomingMirror = peer.incomingHyperdrive.mirror(peer.incomingLocaldrive);
                await incomingMirror.done();
            });
        }

        // Mirror when changes are detected in outgoing localdrive
        chokidar.watch(path.join(peersDirectoryPath, peer.alias, 'outgoing'), {
            persistent: true,
            ignoreInitial: false,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        }).on('all', async () => {
            const outgoingMirror = peer.outgoingLocaldrive.mirror(peer.outgoingHyperdrive);
            await outgoingMirror.done();
        });
    }));
}

main();
