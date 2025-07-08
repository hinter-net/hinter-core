# Instructions

This project is designed to work across all operating systems and be accessible to non-technical users.

## Installation

1. Install [Docker Desktop](https://docs.docker.com/desktop/).
[Enable host networking](https://docs.docker.com/engine/network/drivers/host/#docker-desktop).

2. (OPTIONAL) The technically inclined may choose to build the Docker image locally.

3. Open a terminal, and create the `hinter-core-data/` directory (which includes your [keypair](#keypair)) using:
    ```sh
    docker run -it --rm -v"$(pwd)/hinter-core-data":/app/hinter-core-data bbenligiray/hinter-core:0.0.7 npm run initialize
    ```
    If you are on Mac or Linux, claim the ownership of the created `hinter-core-data/` directory using:
    ```sh
    sudo chown -R $(id -u):$(id -g) ./hinter-core-data
    ```

4. Start `hinter-core` in [always restart mode](#always-restart-mode) using:
    ```sh
    docker run -d --name my-hinter-core --restart=always --network host -v"$(pwd)/hinter-core-data":/app/hinter-core-data bbenligiray/hinter-core:0.0.7
    ```

### Keypair

Your keypair is composed of a `PUBLIC_KEY` and `SECRET_KEY`, and is stored in the `hinter-core-data/.env` file.
Give your `PUBLIC_KEY` to your peers so they can connect to your machine.
Do not expose your `SECRET_KEY` to anyone.

### Always restart mode

To exchange reports with another hinter, you need to be running `hinter-core` concurrently.
This is easy to achieve if both of you are running `hinter-core` at all times, or at least while your machines are running.
Therefore, you are recommended to run `hinter-core` in the background, in always restart mode.

Note that you will not see its logs when the container is running in the background.
However, since the command above names the container `my-hinter-core`, you can print its logs at any time using:
```sh
docker logs my-hinter-core
```

In always restart mode, the container will start automatically when your system boots up.
Stop and remove it using:
```sh
docker stop my-hinter-core
docker rm my-hinter-core
```

## Next stop: `hinter-cline`

`hinter-core` merely enables you to share files with other hinters.
You are strongly recommended to use it with [`hinter-cline`](https://github.com/bbenligiray/hinter-cline), which enables you to leverage a coding assistant in hinter operations.
