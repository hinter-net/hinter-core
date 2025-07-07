# `hinter-core`

- **Hinters** collect intelligence, compose personalized reports for other hinters, and exchange these reports.
- **The hinter protocol** is a P2P file sharing protocol that hinters use to exchange reports.
- **`hinter-core`** is the reference implementation of the hinter protocol.

See [instructions](./instructions.md) to run `hinter-core` in a Docker container.

## `hinter-core-data/`

The `hinter-core-data/` directory, which stores your peer configurations, shared data and cryptographic keypair, will be created when you run the initialization script mentioned in the installation instructions.

### Directory Structure

```
hinter-core-data/
├── .env                                # Your keypair
├── hinter.config.json                  # Global configuration (optional)
└── peers/
     ├── {PEER_ALIAS_1}/                # Directory of peer #1
     │    ├── hinter.config.json        # Configuration for peer #1
     │    ├── incoming/
     │    │    └── **                   # Incoming reports from peer #1 to you
     │    └── outgoing/
     │         └── **                   # Outgoing reports from you to peer #1
     └──  **/                           # Directories of additional peers
```

### Configuration

Configuration is handled by `hinter.config.json` files.
A global configuration file can be placed at `hinter-core-data/hinter.config.json`, and peer-specific settings must be configured in `hinter-core-data/peers/{PEER_ALIAS}/hinter.config.json`.

Peer-specific settings override global settings.

#### Global Configuration

The global `hinter.config.json` file can contain the following keys:

*   `disableIncomingReports` (optional, default: `false`): When set to `true`, the application will not listen for incoming reports.
*   `peerSizeLimitMB` (optional, default: `1024`): The maximum size of a peer's incoming Corestore directory in megabytes before they get blacklisted.

#### Peer-Specific Configuration

The peer-specific `hinter.config.json` file must contain the `publicKey` of the peer.
It can also override any of the global configuration settings in a peer-specific manner.

```jsonc
{
  "publicKey": "...",
  "disableIncomingReports": true,     // Optional
  "peerSizeLimitMB": 2048             // Optional
}
```
