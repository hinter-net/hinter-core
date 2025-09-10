# hinter-core

- **Hinters** collect intelligence, compose personalized reports for other hinters, and exchange these reports.
- **The hinter protocol** is a P2P file sharing protocol that hinters use to exchange reports.
- **hinter-core** is the reference implementation of the hinter protocol.

See https://hinter.net/ for more information about hinter-core.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or later)
- [pm2](https://pm2.keymetrics.io/) (`npm install -g pm2`)

### From NPM

```bash
npm install -g @hinter-net/hinter-core
```

## Usage

### Initialization

Before running `hinter-core` for the first time, you need to initialize it.
This will create a data directory and generate a unique cryptographic key pair for your instance.

**Default (in your home directory):**

This will create a `hinter-core-data` directory in your user's home folder (`~/hinter-core-data`).

```bash
hinter-core-initialize
```

**Local (in the current directory):**

This will create a `hinter-core-data` directory inside the folder you are currently in.
This is useful for running multiple instances.

```bash
hinter-core-initialize --local
```

### Running the Service

To run `hinter-core` as a background service and ensure it restarts automatically, use `pm2`.

**Default Instance:**

```bash
pm2 start hinter-core --name my-hinter-core
```

**Local Instance:**

Make sure you are in the same directory where you ran the `hinter-core-initialize --local` command.

```bash
pm2 start hinter-core --name my-hinter-core -- --local
```

> **Note:** The `--` is important.
It tells `pm2` to stop parsing arguments for itself and pass the remaining arguments (in this case, `--local`) directly to the `hinter-core` application.

### Enabling Auto-Restart on System Reboot

To ensure your `hinter-core` instance starts automatically when your system reboots, run the following commands once:

```bash
pm2 startup
pm2 save
```

This will save the list of running processes and resurrect them on reboot.

## Security

This package is published with npm provenance, which cryptographically proves that it was built from this repository by the official GitHub Actions workflow.
