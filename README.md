# `hinter-core`

- **Hinters** collect intelligence, compose personalized reports for other hinters, and exchange these reports.
- **The hinter protocol** is a P2P file sharing protocol that hinters use to exchange reports.
- **`hinter-core`** is the reference implementation of the hinter protocol.

See [instructions](./instructions.md) to run `hinter-core` in a Docker container.

## `hinter-core-data/`

The `hinter-core-data/` directory, which stores your peer configurations, shared data and cryptographic keypair, will be created when you run the initialization script mentioned in the installation instructions.

```
hinter-core-data/
├── .env                                # Your keypair
└── peers/
     ├── {PEER_ALIAS_1}/                # Report directory of peer #1
     │    ├── config.json               # Configuration for peer #1
     │    ├── incoming/
     │    │    └── **                   # Incoming reports from peer #1 to you
     │    └── outgoing/
     │         └── **                   # Outgoing reports from you to peer #1
     ├── {PEER_ALIAS_2}/                # Report directory of peer #2
     │    ├── config.json               # Configuration for peer #2
     │    ├── incoming/
     │    │    └── **                   # Incoming reports from peer #2 to you
     │    └── outgoing/
     │         └── **                   # Outgoing reports from you to peer #2
     └──  **/                           # Report directories of additional peers
```

### Peer-specific `config.json` file

Each peer directory includes a `config.json` with the public key of the peer and additional optional parameters as required by sidecar applications such as [`hinter-cline`.](https://github.com/bbenligiray/hinter-cline)

```json
{
  "publicKey": "45a2...",
  ...
}
```
