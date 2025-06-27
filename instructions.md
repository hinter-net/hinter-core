# Instructions

This repo is designed to work across all operating systems and be accessible to non-technical users.
However, given the advanced nature of the underlying technology, setup and usage may require some effort and patience—grab a cup of coffee and settle in.

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

5. Wait a few minutes for `hinter-core` to boot.
    Then, open your browser and navigate to [localhost:8080](http://localhost:8080).
    You should see the VS Code interface, which you will use to interact with the AI assistant.

6. Click the Cline icon on the VS Code sidebar.
    Select an API provider and enter your API key.

    If you are not a paid subscriber to any of these API providers:
    - Create an [OpenRouter](https://openrouter.ai/) account
    - Create an API key
    - Configure Cline to use [`deepseek/deepseek-chat-v3-0324:free`](https://openrouter.ai/deepseek/deepseek-chat-v3-0324:free)

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

## AI Assistant Operation

Click the Cline icon that appears on the VS Code sidebar.
You can simply ask Cline to help you get started.

There are two important concepts to be aware of while using Cline:

### Plan/Act toggle button

You can chat with the AI about the contents of your repo in Plan Mode.
For Cline to make changes (for example, to execute predefined hinter workflows), you will need to switch to Act Mode.
Switching between Plan and Act Mode retains the context, so you will likely want to switch between the two during use.

> [!TIP]
> Using Git for version control will enable you to track and revert changes that Cline makes in a powerful way.
To set Git up, run the following commands in VS Code terminal:
> ```
> cd hinter-core-data
> git init
> echo -e ".env" > .gitignore
> git add .
> git commit -m "Initial commit"
> ```
> From this point on, you can use the Source Control button on the VS Code sidebar to review and commit changes made in your `hinter-core-data/` directory.

### Tasks
Whenever you want Cline to start as a clean slate, start a new task (for example, by clicking the plus sign on the Cline extension).
Doing this between independent hinter workflows will cause Cline to perform in a more consistent manner.
However, you may want to continue using the same task during multiple dependent hinter workflows, such as revising the same report multiple times.
