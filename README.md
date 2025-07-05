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
     ├── {PEER_ALIAS_1}/                # Report directory of peer #1
     │    ├── hinter.config.json        # Configuration for peer #1
     │    ├── incoming/
     │    │    └── **                   # Incoming reports from peer #1 to you
     │    └── outgoing/
     │         └── **                   # Outgoing reports from you to peer #1
     └──  **/                           # Report directories of additional peers
```

### Configuration

Configuration is handled by `hinter.config.json` files. A global configuration file can be placed at `hinter-core-data/hinter.config.json`, and peer-specific settings can be configured in `hinter-core-data/peers/{PEER_ALIAS}/hinter.config.json`.

Peer-specific settings override global settings.

#### Global Configuration

The global `hinter.config.json` file can contain the following optional keys:

*   `peerSizeLimitMB` (default: `1024`): The maximum size of a peer's incoming directory in megabytes before they get blacklisted.
*   `disableIncomingReports` (default: `false`): When set to `true`, the application will not receive reports from any peers.

#### Peer-Specific Configuration

The peer-specific `hinter.config.json` file must contain the `publicKey` of the peer.
It can also override any of the global configuration settings.

```json
{
  "publicKey": "...",
  "peerSizeLimitMB": 2048,
  "disableIncomingReports": true
}
```
