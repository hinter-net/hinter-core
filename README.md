# `hinter-core`

> A terminal application that implements the hinter protocol, enabling users to exchange reports in a P2P manner

## Setup

If you already have `npm` set up and are fine with installing `pear` globally, do the following:

```sh
npm i -g pear
pear
pear run pear://runtime # and click "Automatic Setup Completion"
npm i
npm run start
```

Alternatively, see the [instructions for running `hinter-core` in a virtual machine.](./virtualbox-instructions.md)

## Generating keys

Run the following command to generate keys and write them in `.env`:

```
npm run generate-keys
```

You will give `PUBLIC_KEY` in `.env` to your peers for them to be able to decrypt your messages.

Do not expose `SECRET_KEY` in `.env` to anyone.

If you lose your `.env` file, you will have to create a new one and ask your peers to update your public key.

## Directory Structure

Each peer has a directory under `peers/`.
The names of these directories are `{ALIAS}-{PUBLIC_KEY}`.
`ALIAS` is an arbitrary string that is used to identify the peer in logs.
`ALIAS` cannot include `-`.
`PUBLIC_KEY` is the peer's public key from their `.env` file, which consists of 64 lowercase hexadecimals.

In each peer directory, there is an `incoming/` and an `outgoing/` directory.
While `hinter-core` is running for both you and your peer, the files you place in the respective `outgoing/` directory on your machine will appear on the respective `incoming/` directory of your peer, and vice versa.

```
peers/
├── [ALIAS-PUBLIC_KEY]/
│   ├── incoming/
│   │   └── *
│   └── outgoing/
│       └── *
├── [ANOTHER_ALIAS_ANOTHER-PUBLIC_KEY]/
│   ├── incoming/
│   │   └── *
│   └── outgoing/
│       └── *
└── ...
```

`hinter-core` supports syncing arbitrary content.
However, for the sake of protocolization, users should populate their `outgoing/` directories only with Markdown files that have `{TIMESTAMP}{OPTIONAL_ARBITRARY_SUFFIX}.md` as the file name (where `TIMESTAMP` is when the report was composed, in `YYYYMMDDHHMMSS` format).

## Adding/removing peers

To add a peer, get their public key from them, and come up with an alias for them.
Then, create a directory in `peers/` with the name `{ALIAS}-{PUBLIC_KEY}`.
Create two more directories in `peers/{ALIAS}-{PUBLIC_KEY}/` with the names `incoming/` and `outgoing/`.
Restart `hinter-core`.

To remove a peer, delete `peers/{ALIAS}-{PUBLIC_KEY}/`.
You can also delete `.storage/{PUBLIC_KEY}/` to recover some more disk space.
Then, restart `hinter-core`.
