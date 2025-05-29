# `data/` structure

```
├── entries
│    ├── pinned
│    │    └── *.md                  # Your pinned entries
│    └── *.md                       # Your regular entries
└── peers
     ├── {ALIAS_1}-{PUBLIC_KEY_1}   # Report directory of peer #1
     │    ├── incoming
     │    │    └── *.md             # Incoming reports from peer #1 to you
     │    └── outgoing
     │         └── *.md             # Outgoing reports from you to peer #1
     ├── {ALIAS_2}-{PUBLIC_KEY_2}   # Report directory of peer #2
     │    ├── incoming
     │    │    └── *.md             # Incoming reports from peer #2 to you
     │    └── outgoing
     │         └── *.md             # Outgoing reports from you to peer #2
     └──  {ALIAS_*}-{PUBLIC_KEY_*}  # Report directories of additional peers
```

## Entries

Your entries reside in the `entries/` directory.
Place your regular entries directly in it, and your pinned (i.e., important) entries in the `pinned/` subdirectory.
This enables pinned entries to be given priority when the LLM context size is limited.

Your entries must be Markdown files with filenames following the format `{TIMESTAMP}{OPTIONAL_ARBITRARY_SUFFIX}.md` (where `TIMESTAMP` represents when the entry was composed, in `YYYYMMDDHHMMSS` format).
This enables newer entries to be given priority when the LLM context size is limited.

`hinter-core` only shares your outgoing reports.
Your entries are private (to the degree that you are following the best practices.)

## Peers

Each peer has a report directory under `peers/`.
The names of these directories are `{ALIAS}-{PUBLIC_KEY}`.
`ALIAS` is an arbitrary string that is used to identify the peer in logs.
`ALIAS` cannot include the `-` character.
`PUBLIC_KEY` is the peer's [public key](#keypair) from their `.env` file, which consists of 64 lowercase hexadecimal characters.

In each peer directory, there are `incoming/` and `outgoing/` subdirectories.
While `hinter-core` is running for both you and your peer, the files you place in an `outgoing/` subdirectory on your machine will appear in the respective `incoming/` subdirectory of your peer, and vice versa.

`hinter-core` supports syncing arbitrary content.
However, for the sake of protocolization, you should populate `outgoing/` subdirectories only with Markdown files with filenames following the format `{TIMESTAMP}{OPTIONAL_ARBITRARY_SUFFIX}.md` (where `TIMESTAMP` represents when the report was composed, in `YYYYMMDDHHMMSS` format).
This filename will be mirrored on your peer's machine in its entirety, i.e., `OPTIONAL_ARBITRARY_SUFFIX` will be exposed to your peer.
