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
     ├── {ALIAS_1}-{PUBLIC_KEY_1}/      # Report directory of peer #1
     │    ├── incoming/
     │    │    └── **                   # Incoming reports from peer #1 to you
     │    └── outgoing/
     │         └── **                   # Outgoing reports from you to peer #1
     ├── {ALIAS_2}-{PUBLIC_KEY_2}/      # Report directory of peer #2
     │    ├── incoming/
     │    │    └── **                   # Incoming reports from peer #2 to you
     │    └── outgoing/
     │         └── **                   # Outgoing reports from you to peer #2
     └──  **/                           # Report directories of additional peers
```
