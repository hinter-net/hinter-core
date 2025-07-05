import fs from 'bare-fs';
import path from 'bare-path';

const globalConfigDefaults = {
    peerSizeLimitMB: 1024,
    disableIncomingReports: false
};

export function parseGlobalConfig() {
    const globalConfigPath = path.join('hinter-core-data', 'hinter.config.json');
    const config = { ...globalConfigDefaults };

    // Unlike the peer config file, the global config file is optional
    if (fs.existsSync(globalConfigPath)) {
        const globalConfig = JSON.parse(fs.readFileSync(globalConfigPath, 'utf-8'));
        // We allow sidecar applications to overload the global config schema
        for (const key in globalConfigDefaults) {
            if (globalConfig[key] !== undefined) {
                // Type validation would be nice here but we don't want more dependencies
                config[key] = globalConfig[key];
            }
        }
    }

    return config;
}

export function parsePeerConfig(peerDirectoryPath, globalConfig) {
    const configPath = path.join(peerDirectoryPath, 'hinter.config.json');
    if (!fs.existsSync(configPath)) {
        throw new Error(`hinter.config.json not found in ${peerDirectoryPath}`);
    }

    const peerConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    if (!peerConfig.publicKey || !/^[a-f0-9]{64}$/.test(peerConfig.publicKey)) {
        throw new Error(`Invalid or missing publicKey in ${configPath}`);
    }

    const config = { ...globalConfig, publicKey: peerConfig.publicKey };

    // Similar to global config, we allow sidecar applications to overload the peer config schema
    for (const key in globalConfigDefaults) {
        if (peerConfig[key] !== undefined) {
            config[key] = peerConfig[key];
        }
    }

    return config;
}
