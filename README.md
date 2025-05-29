# `hinter-core`

> A terminal application that implements the hinter protocol, enabling users to exchange reports in a P2P manner

Hinters collect data, compose personalized reports for other hinters, and exchange these reports through the hinter protocol.
This repo contains:
- `hinter-core` implementation, which uses the hinter protocol to enable hinters to exchange reports
- AI scaffolding that enables hinters to use generic coding assistants for hinter operations

This repo is designed to work across all operating systems and be accessible to non-technical users.

> [!TIP]
> Read this entire README before attempting to do anything.

## Installation

1. Install [git](https://git-scm.com/downloads).

2. Install [VS Code](https://code.visualstudio.com/).

3. Install [Cline](https://cline.bot/):
    - Open VS Code
    - Click Extensions from the sidebar
    - Type "cline"
    - Click Install
    - Click the Cline icon that appears on the sidebar
    - Select an API provider and enter your API key

    If you are not a paid subscriber to any of these API providers, you are recommended to use [OpenRouter](https://openrouter.ai/) by prepaying around $5.

4. Install [Docker](https://docs.docker.com/engine/install/).

5. Clone this repository and navigate into it.
One way to do this is:
    - Open VS Code
    - Click File → Close Folder (ignore this step if you cannot see Close Folder)
    - Click Source Control from the sidebar
    - Click Clone Repository
    - Copy and paste `https://github.com/hinter-net/hinter-core.git`
    - Choose a destination
    - Agree to open the cloned repository
    - Click View → Terminal
    
    Note that all Docker commands are designed to be run inside this repository.

6. Create a `.env` file that contains your [keypair](#keypair) using:
    ```sh
    docker run -it --rm -v "$(pwd)":/app bbenligiray/hinter-core npm run generate-keys
    ```

7. Start `hinter-core` using:
    ```sh
    docker run -it --rm -v "$(pwd)/data/peers":/app/data/peers -v "$(pwd)/.env":/app/.env bbenligiray/hinter-core
    ```

> [!TIP]
> Retry the Docker commands above until you see the `hinter-core` ASCII art.
> This is because Pear Runtime sometimes fails silently when run inside a Docker container.

If the second Docker command prints the following, you can consider the installation complete and stop the container (for example, by closing the terminal.)
```
Parsing key pair...
Parsed key pair!
Parsing peers...
Parsed 2 peers!
Preparing to connect...
Ready to connect!
alice initial incoming: {"files":0,"add":0,"remove":2,"change":0}
bob initial incoming: {"files":0,"add":0,"remove":2,"change":0}
alice initial outgoing: {"files":2,"add":2,"remove":0,"change":0}
bob initial outgoing: {"files":2,"add":2,"remove":0,"change":0}
```

### Keypair

Your keypair is composed of a `PUBLIC_KEY` and `SECRET_KEY`, and is stored in the `.env` file.
Give your `PUBLIC_KEY` to your peers so they can connect to your machine.
Do not expose your `SECRET_KEY` to anyone.

## `hinter-core` Operation

For you to be able to exchange reports with another hinter, you need to be running `hinter-core` concurrently.
This is easy to achieve if both of you are running `hinter-core` at all times, or at least while your machines are running.

Run `hinter-core` in the background in "always restart" mode using:
```sh
docker run -d --name my-hinter-core --restart=always -v "$(pwd)/data/peers":/app/data/peers -v "$(pwd)/.env":/app/.env bbenligiray/hinter-core
```

Note that you will not see its logs when the container is running in the background.
However, since the command above names the container `my-hinter-core`, you can print its logs at any time using:
```sh
docker logs my-hinter-core
```

In "always restart" mode, the container will start automatically when your system boots up.
Stop and remove it (for example, to add or remove peers) using:
```sh
docker stop my-hinter-core
docker rm my-hinter-core
```
