# `hinter-core`

> A terminal application that implements the hinter protocol, enabling users to exchange reports in a P2P manner

## Instructions

> [!TIP]
> Read this entire README before attempting to do anything.

1. Install [Docker](https://docs.docker.com/engine/install/).
2. Clone this repo and move in it.
    ```sh
    git clone https://github.com/hinter-net/hinter-core.git
    cd hinter-core
    ```
3. Create a `.env` file that holds your [keypair](#keypair) with
    ```sh
    docker run -it --rm -v "$(pwd)":/app bbenligiray/hinter-core npm run generate-keys
    ```
4. Start `hinter-core` with
    ```sh
    docker run -it --rm -v "$(pwd)/peers":/app/peers -v "$(pwd)/.env":/app/.env bbenligiray/hinter-core
    ```

> [!TIP]
> Retry the Docker commands above until you see the `hinter-core` ASCII art.
> This is because Pear Runtime sometimes fails silently when run inside a Docker container.

This repo is populated with example [peers](#peers) and [entries](#entries).
Remove them and add your own before actual usage.

### Start `hinter-core` automatically at startup

For you to be able exchange reports with a peer, you need to be running `hinter-core` concurrently.
This is easy to achieve if both of you are running `hinter-core` at all times, at least while your machine is running.

Run `hinter-core` in the background, in "always restart" mode with
```sh
docker run -d --name my-hinter-core --restart=always -v "$(pwd)/peers":/app/peers -v "$(pwd)/.env":/app/.env bbenligiray/hinter-core
```

Note that you will not see its logs when the container is running in the background.
However, since the command above names the container `my-hinter-core`, you can print its logs at any time with
```sh
docker logs my-hinter-core
```

In "always restart" mode, the container will start automatically at startup.
Stop and remove it (for example, to [add or remove peers](#add-or-remove-peers)) with
```sh
docker stop my-hinter-core
docker rm my-hinter-core
```

### Build `hinter-core` locally

Optionally, you can build `hinter-core` locally with
```sh
docker build -t hinter-core .
```

## Repo Contents

```
├── entries
│    ├── pinned
│    │    └── *.md                  # your pinned entries
│    └── *.md                       # your regular entries
├── peers/
│    ├── {ALIAS_1}-{PUBLIC_KEY_1}   # report directory of peer #1
│    │    ├── incoming/
│    │    │    └── *.md             # incoming reports from peer #1 to you
│    │    └── outgoing/
│    │         └── *.md             # outgoing reports from you to peer #1
│    ├── {ALIAS_2}-{PUBLIC_KEY_2}   # report directory of peer #2
│    │    ├── incoming/
│    │    │    └── *.md             # incoming reports from peer #2 to you
│    │    └── outgoing/
│    │         └── *.md             # outgoing reports from you to peer #2
│    └──  {ALIAS_*}-{PUBLIC_KEY_*}  # report directories of more peers
└── .env                            # your keypair
```

### Entries

Your entries reside in the `entries/` directory.
Place your regular entries directly in it, and your pinned (i.e., important) entries in the `pinned/` directory in the entries directory.
This signals to [workflows](#workflows) to give priority to pinned entries for cases when the LLM context size is limited.

Your entries must be Markdown files that have `{TIMESTAMP}{OPTIONAL_ARBITRARY_SUFFIX}.md` as the file name (where `TIMESTAMP` is when the report was composed, in `YYYYMMDDHHMMSS` format).
This signals to [workflows](#workflows) to give priority to newer entries for cases when the LLM context size is limited.

Everything in your entries directory is private.
However, [workflows](#workflows) compose outgoing reports based on your entries.

### Peers

Each peer has a report directory under `peers/`.
The names of these directories are `{ALIAS}-{PUBLIC_KEY}`.
`ALIAS` is an arbitrary string that is used to identify the peer in logs.
`ALIAS` cannot include `-`.
`PUBLIC_KEY` is the peer's [public key](#keypair) from their `.env` file, which consists of 64 lowercase hexadecimals.

In each peer directory, there is an `incoming/` and an `outgoing/` directory.
While `hinter-core` is running for both you and your peer, the files you place in an `outgoing/` directory on your machine will appear on the respective `incoming/` directory of your peer, and vice versa.

`hinter-core` supports syncing arbitrary content.
However, for the sake of protocolization, you should populate their `outgoing/` directories only with Markdown files that have `{TIMESTAMP}{OPTIONAL_ARBITRARY_SUFFIX}.md` as the file name (where `TIMESTAMP` is when the report was composed, in `YYYYMMDDHHMMSS` format).
This file name will be mirrored in your peer's machine in its entirety, i.e., `OPTIONAL_ARBITRARY_SUFFIX` will be exposed to your peer.

#### Add or remove peers

`hinter-core` loads peers at the beginning.
Therefore, to add/remove peers:
1. Stop `hinter-core`
2. Modify your `peers/` directory according to the [repo contents diagram](#repo-contents)
3. Start `hinter-core`

## Workflows

TODO

## Keypair

Your keypair is composed of a `PUBLIC_KEY` and `SECRET_KEY`, and is stored in the `.env` file.
See the [instructions](#instructions) for how to generate a keypair.

Give `PUBLIC_KEY` to your peers for them to be able to connect to your machine.
Do not expose `SECRET_KEY` to anyone.
