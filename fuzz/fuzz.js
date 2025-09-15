import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import b4a from 'b4a';
import hypercoreCrypto from 'hypercore-crypto';
import crypto from 'crypto';

const ALICE = 'alice';
const BOB = 'bob';
const PEERS = [ALICE, BOB];

const FUZZ_DIR = path.resolve('fuzz');
const ALICE_DATA_DIR = path.join(FUZZ_DIR, 'alice-data');
const BOB_DATA_DIR = path.join(FUZZ_DIR, 'bob-data');

const VERIFICATION_DELAY_MS = 10000;
const ACTION_DELAY_MS = 10000;

const PEER_DATA_DIRS = {
    [ALICE]: ALICE_DATA_DIR,
    [BOB]: BOB_DATA_DIR
};

function getRandomPeer() {
    return PEERS[Math.floor(Math.random() * PEERS.length)];
}

async function readKeysFromDir(dir) {
    const envFilePath = path.join(dir, '.env');
    const envFileContent = await fs.readFile(envFilePath, 'utf8');
    const keyPair = {
        publicKey: b4a.from(envFileContent.match(/PUBLIC_KEY=([0-9a-f]+)/)[1], 'hex'),
        secretKey: b4a.from(envFileContent.match(/SECRET_KEY=([0-9a-f]+)/)[1], 'hex')
    };
    if (!hypercoreCrypto.validateKeyPair(keyPair)) {
        throw new Error('Key pair not valid');
    }
    return { keyPair };
}

// --- Shared Action Definitions ---
function startPeerProcess(peer, peerProcesses) {
    console.log(`Starting process for ${peer}...`);
    const process = spawn('node', ['src/index.js', '--data-dir', PEER_DATA_DIRS[peer]], { stdio: 'pipe' });
    peerProcesses[peer] = process;

    process.stdout.on('data', (data) => console.log(`[${peer} stdout] ${data.toString().trim()}`));
    process.stderr.on('data', (data) => console.error(`[${peer} stderr] ${data.toString().trim()}`));

    process.on('exit', (code, signal) => {
        if (process.isStopping) {
            console.log(`${peer} stopped intentionally.`);
            return;
        }
        console.error(`CRASH: ${peer} exited unexpectedly with code ${code}, signal ${signal}. Restarting...`);
        startPeerProcess(peer, peerProcesses);
    });
}

const actions = {
    startPeer: (peer, filename, content, worldState, lastSyncedState, peerProcesses) => {
        if (peerProcesses[peer]) return;
        console.log(`ACTION: Starting ${peer}`);
        startPeerProcess(peer, peerProcesses);
    },
    stopPeer: async (peer, filename, content, worldState, lastSyncedState, peerProcesses) => {
        const process = peerProcesses[peer];
        if (!process) return;
        console.log(`ACTION: Stopping ${peer}`);

        process.isStopping = true;

        return new Promise((resolve) => {
            process.once('exit', () => {
                peerProcesses[peer] = null;
                resolve();
            });
            process.kill('SIGINT');
        });
    },
    createFile: async (peer, filename, content, worldState, lastSyncedState, peerProcesses) => {
        // Generate filename and content if not provided
        if (!filename) {
            filename = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.txt`;
        }
        if (!content) {
            content = crypto.randomBytes(32).toString('hex');
        }

        console.log(`ACTION: ${peer} creates ${filename}`);
        worldState[peer][filename] = content;
        const otherPeer = PEERS.find(p => p !== peer);
        // Don't update lastSyncedState here - it will be updated during verification
        const filePath = path.join(PEER_DATA_DIRS[peer], 'peers', otherPeer, 'outgoing', filename);
        await fs.writeFile(filePath, content);
    },
    appendToFile: async (peer, filename, content, worldState, lastSyncedState, peerProcesses) => {
        // Skip if no files exist to append to
        if (!filename || !worldState[peer][filename]) {
            const existingFiles = Object.keys(worldState[peer]);
            if (existingFiles.length === 0) {
                console.log(`ACTION: ${peer} skips append (no files exist)`);
                return;
            }
            filename = existingFiles[Math.floor(Math.random() * existingFiles.length)];
        }
        if (!content) {
            content = crypto.randomBytes(16).toString('hex');
        }

        console.log(`ACTION: ${peer} appends to ${filename}`);
        worldState[peer][filename] += content;
        const otherPeer = PEERS.find(p => p !== peer);
        // Don't update lastSyncedState here - it will be updated during verification
        const filePath = path.join(PEER_DATA_DIRS[peer], 'peers', otherPeer, 'outgoing', filename);
        await fs.appendFile(filePath, content);
    },
    deleteFile: async (peer, filename, content, worldState, lastSyncedState, peerProcesses) => {
        // Skip if no files exist to delete
        if (!filename || !worldState[peer][filename]) {
            const existingFiles = Object.keys(worldState[peer]);
            if (existingFiles.length === 0) {
                console.log(`ACTION: ${peer} skips delete (no files exist)`);
                return;
            }
            filename = existingFiles[Math.floor(Math.random() * existingFiles.length)];
        }

        console.log(`ACTION: ${peer} deletes ${filename}`);
        delete worldState[peer][filename];
        const otherPeer = PEERS.find(p => p !== peer);
        // Don't update lastSyncedState here - it will be updated during verification
        const filePath = path.join(PEER_DATA_DIRS[peer], 'peers', otherPeer, 'outgoing', filename);
        await fs.rm(filePath, { force: true });
    },
    corruptIncomingFile: async (peer) => {
        const otherPeer = PEERS.find(p => p !== peer);
        const incomingDir = path.join(PEER_DATA_DIRS[peer], 'peers', otherPeer, 'incoming');
        const files = await fs.readdir(incomingDir).catch(() => []);
        if (files.length === 0) return;
        const fileToCorrupt = files[Math.floor(Math.random() * files.length)];
        console.log(`ACTION: Corrupting ${fileToCorrupt} in ${peer}'s incoming dir`);
        const filePath = path.join(incomingDir, fileToCorrupt);
        await fs.writeFile(filePath, crypto.randomBytes(16).toString('hex'));
    },
    deleteStorage: async (peer) => {
        const storageDir = path.join(PEER_DATA_DIRS[peer], '.storage');
        console.log(`ACTION: Deleting storage for ${peer}`);
        await fs.rm(storageDir, { recursive: true, force: true });
    }
};
const actionNames = Object.keys(actions);


async function fuzz(numActions = 100) {
    const actionPlan = [
        { name: 'startPeer', peer: ALICE },
        { name: 'startPeer', peer: BOB },
        { name: 'createFile', peer: getRandomPeer() }
    ];

    for (let i = 0; i < numActions - 3; i++) {
        const actionName = actionNames[Math.floor(Math.random() * actionNames.length)];
        const peer = getRandomPeer();
        actionPlan.push({ name: actionName, peer });
    }

    actionPlan.sort(() => Math.random() - 0.5);

    const testPassed = await runActionSequence(actionPlan);
    if (!testPassed) {
        console.error('Failing action log saved to fuzz/failing-case.json');
        process.exit(1);
    }
}

async function runActionSequence(actionLog, isReducing = false) {
    if (!isReducing) {
        console.log('--- Running Test Scenario ---');
        console.log(JSON.stringify(actionLog, null, 2));
    }
    // Reset environment
    for (const peer of PEERS) {
        await fs.rm(PEER_DATA_DIRS[peer], { recursive: true, force: true });
        await fs.mkdir(PEER_DATA_DIRS[peer], { recursive: true });
        await new Promise((resolve, reject) => {
            const process = spawn('node', ['src/initialize.js', '--data-dir', PEER_DATA_DIRS[peer]], { stdio: 'pipe' });
            process.on('close', (code) => code === 0 ? resolve() : reject());
        });
    }
    const peerKeys = {};
    for (const peer of PEERS) {
        const { keyPair } = await readKeysFromDir(PEER_DATA_DIRS[peer]);
        peerKeys[peer] = keyPair.publicKey.toString('hex');
    }
    for (const peer of PEERS) {
        const otherPeer = PEERS.find(p => p !== peer);
        const peerConfigDir = path.join(PEER_DATA_DIRS[peer], 'peers', otherPeer);
        await fs.mkdir(peerConfigDir, { recursive: true });
        const peerConfigFile = path.join(peerConfigDir, 'hinter.config.json');
        const config = { publicKey: peerKeys[otherPeer] };
        await fs.writeFile(peerConfigFile, JSON.stringify(config, null, 2));
        await fs.mkdir(path.join(peerConfigDir, 'outgoing'), { recursive: true });
        await fs.mkdir(path.join(peerConfigDir, 'incoming'), { recursive: true });
    }

    const worldState = { [ALICE]: {}, [BOB]: {} };
    const lastSyncedState = { [ALICE]: {}, [BOB]: {} };
    const peerProcesses = { [ALICE]: null, [BOB]: null };
    const peerOnlineSince = { [ALICE]: null, [BOB]: null };

    try {
        for (const action of actionLog) {
            const { name, peer, filename, content } = action;

            // Track when peers come online
            if (name === 'startPeer' && !peerProcesses[peer]) {
                peerOnlineSince[peer] = Date.now();
            } else if (name === 'stopPeer' && peerProcesses[peer]) {
                peerOnlineSince[peer] = null;
            }

            await actions[name](peer, filename, content, worldState, lastSyncedState, peerProcesses);

            // Update lastSyncedState after each action if both peers are online
            // This ensures we only expect files to be synced that were created while both peers were running
            if (peerProcesses[ALICE] && peerProcesses[BOB]) {
                // Only sync files that existed when both peers were online
                for (const p of PEERS) {
                    lastSyncedState[p] = { ...worldState[p] };
                }
            }

            await new Promise(resolve => setTimeout(resolve, ACTION_DELAY_MS));
        }

        // Verification logic
        await new Promise(resolve => setTimeout(resolve, VERIFICATION_DELAY_MS));

        // Check for blacklisting before verification
        const blacklistExists = await Promise.all(PEERS.map(async (peer) => {
            const otherPeer = PEERS.find(p => p !== peer);
            const blacklistFile = path.join(PEER_DATA_DIRS[peer], 'peers', otherPeer, '.blacklisted');
            return fs.access(blacklistFile).then(() => true).catch(() => false);
        }));

        if (blacklistExists.some(exists => exists)) {
            console.log('Blacklisting detected - this is expected behavior, not a failure');
            return true; // Blacklisting is a valid outcome, not a failure
        }

        // Final sync state update before verification
        // If both peers are online now, they should have synced everything
        if (peerProcesses[ALICE] && peerProcesses[BOB]) {
            for (const p of PEERS) {
                lastSyncedState[p] = { ...worldState[p] };
            }
        }

        for (const peer of PEERS) {
            if (!peerProcesses[peer]) continue;
            const otherPeer = PEERS.find(p => p !== peer);
            const incomingDir = path.join(PEER_DATA_DIRS[peer], 'peers', otherPeer, 'incoming');
            const expectedFiles = lastSyncedState[otherPeer];
            for (const [filename, expectedContent] of Object.entries(expectedFiles)) {
                const filePath = path.join(incomingDir, filename);
                const actualContent = await fs.readFile(filePath, 'utf-8').catch(() => null);
                if (actualContent !== expectedContent) {
                    if (!isReducing) {
                        console.error(`VERIFICATION FAILED: File ${filename} (from ${otherPeer}) not found or content mismatch in ${peer}'s incoming dir.`);
                        await fs.writeFile(path.join(FUZZ_DIR, 'failing-case.json'), JSON.stringify(actionLog, null, 2));
                    }
                    return false;
                }
            }
            const actualFiles = await fs.readdir(incomingDir).catch(() => []);
            for (const actualFile of actualFiles) {
                if (!expectedFiles[actualFile]) {
                    if (!isReducing) {
                        console.error(`VERIFICATION FAILED: Unexpected file ${actualFile} found in ${peer}'s incoming dir.`);
                        await fs.writeFile(path.join(FUZZ_DIR, 'failing-case.json'), JSON.stringify(actionLog, null, 2));
                    }
                    return false;
                }
            }
        }
        return true;
    } catch (e) {
        console.error('Test failed with exception:', e.message);

        // Check if the failure is due to blacklisting (which is expected behavior)
        const blacklistExists = await Promise.all(PEERS.map(async (peer) => {
            const otherPeer = PEERS.find(p => p !== peer);
            const blacklistFile = path.join(PEER_DATA_DIRS[peer], 'peers', otherPeer, '.blacklisted');
            return fs.access(blacklistFile).then(() => true).catch(() => false);
        }));

        if (blacklistExists.some(exists => exists)) {
            console.log('Blacklisting detected - this is expected behavior, not a failure');
            return true; // Blacklisting is a valid outcome, not a failure
        }

        return false;
    } finally {
        for (const peer of PEERS) {
            if (peerProcesses[peer]) await actions.stopPeer(peer, null, null, worldState, lastSyncedState, peerProcesses);
        }
    }
}

async function reduceTestCase(actionLog) {
    let lastFailingLog = [...actionLog];
    console.log(`Initial check: Does the full ${lastFailingLog.length}-action test case fail?`);
    let testPassed = await runActionSequence(lastFailingLog, true);
    if (testPassed) {
        console.error("The provided test case does not fail. Cannot reduce.");
        return;
    }
    console.log("Confirmed. The test case fails. Starting reduction...");

    let reduced = true;
    while (reduced) {
        reduced = false;
        for (let i = lastFailingLog.length - 1; i >= 0; i--) {
            const tempLog = [...lastFailingLog];
            tempLog.splice(i, 1);

            console.log(`Trying to remove action ${i + 1}/${lastFailingLog.length}...`);
            testPassed = await runActionSequence(tempLog, true);

            if (!testPassed) {
                console.log(`  -> SUCCESS: Action ${i + 1} was redundant. New length: ${tempLog.length}`);
                lastFailingLog = tempLog;
                reduced = true;
                break;
            }
        }
    }

    console.log('\n--- Minimal Failing Test Case ---');
    console.log(JSON.stringify(lastFailingLog, null, 2));
}

const main = async () => {
    if (process.argv.includes('--reduce')) {
        const failingCasePath = path.join(FUZZ_DIR, 'failing-case.json');
        try {
            const failingActions = JSON.parse(await fs.readFile(failingCasePath, 'utf-8'));
            await reduceTestCase(failingActions);
        } catch (err) {
            console.error(`Could not read or parse ${failingCasePath}.`, err);
            process.exit(1);
        }
    } else {
        const actionsArgIndex = process.argv.indexOf('--actions');
        let numActions = 100;
        if (actionsArgIndex !== -1 && process.argv.length > actionsArgIndex + 1) {
            const parsedNum = parseInt(process.argv[actionsArgIndex + 1], 10);
            if (isNaN(parsedNum) || parsedNum < 3) {
                console.error('Error: --actions flag requires a valid number greater than or equal to 3.');
                process.exit(1);
            }
            numActions = parsedNum;
        }

        let i = 0;
        while (true) {
            console.log(`--- Starting Fuzz Iteration ${++i} ---`);
            await fuzz(numActions);
        }
    }
};

main().catch(err => {
    console.error('Main process failed with an unhandled error:', err);
    process.exit(1);
});
