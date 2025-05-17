# `hinter-core`

> A terminal application that implements the hinter protocol, enabling users to exchange reports in a P2P manner

## Instructions

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
4. Populate [`peers/`](#peers).
5. Start `hinter-core` with
    ```sh
    docker run -it --rm -v "$(pwd)/peers":/app/peers -v "$(pwd)/.env":/app/.env bbenligiray/hinter-core
    ```

### Start `hinter-core` automatically at startup

Once you confirm that `hinter-core` runs as expected, run it in the background, in "always restart" mode with
```sh
docker run -d --name my-hinter-core --restart=always -v "$(pwd)/peers":/app/peers -v "$(pwd)/.env":/app/.env bbenligiray/hinter-core
```

Note that you will not see its logs when the container is running in the background.
However, since the command above names the container `my-hinter-core`, you can print its logs at any time with
```sh
docker logs my-hinter-core
```

In "always restart" mode, the container will start automatically at startup.
Stop and remove it (for example, to [add/remove peers](#addingremoving-peers)) with
```sh
docker stop my-hinter-core | xargs docker rm
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
│    │    └── *.md                  # pinned entries of user
│    └── *.md                       # regular entries of user
├── peers/
│    ├── {ALIAS_1}-{PUBLIC_KEY_1}   # report directory of peer #1
│    │    ├── incoming/
│    │    │    └── *.md             # incoming reports from peer #1 to user
│    │    └── outgoing/
│    │         └── *.md             # outgoing reports from user to peer #1
│    ├── {ALIAS_2}-{PUBLIC_KEY_2}   # report directory of peer #2
│    │    ├── incoming/
│    │    │    └── *.md             # incoming reports from peer #2 to user
│    │    └── outgoing/
│    │         └── *.md             # outgoing reports from user to peer #2
│    └──  {ALIAS_*}-{PUBLIC_KEY_*}  # more report directories
└── .env                            # keypair of user
```

### Entries

TODO

### Peers

Each peer has a report directory under `peers/`.
The names of these directories are `{ALIAS}-{PUBLIC_KEY}`.
`ALIAS` is an arbitrary string that is used to identify the peer in logs.
`ALIAS` cannot include `-`.
`PUBLIC_KEY` is the peer's [public key](#keypair) from their `.env` file, which consists of 64 lowercase hexadecimals.

In each peer directory, there is an `incoming/` and an `outgoing/` directory.
While `hinter-core` is running for both you and your peer, the files you place in an `outgoing/` directory on your machine will appear on the respective `incoming/` directory of your peer, and vice versa.

`hinter-core` supports syncing arbitrary content.
However, for the sake of protocolization, users should populate their `outgoing/` directories only with Markdown files that have `{TIMESTAMP}{OPTIONAL_ARBITRARY_SUFFIX}.md` as the file name (where `TIMESTAMP` is when the report was composed, in `YYYYMMDDHHMMSS` format).

#### Adding/removing peers

`hinter-core` loads peers at the beginning.
Therefore, to add/remove peers:
1. Stop `hinter-core`
2. Modify your `peers/` directory according to the [repo contents diagram](#repo-contents)
3. Start `hinter-core`

## Keypair

Your keypair is composed of a `PUBLIC_KEY` and `SECRET_KEY`, and is stored in the `.env` file.
See the [instructions](#instructions) for how to generate a keypair.

Give `PUBLIC_KEY` to your peers for them to be able to connect to your machine.
Do not expose `SECRET_KEY` to anyone.
