# GitHub Actions Workflows

## NPM Publish Workflow

This workflow builds and publishes the `@hinter-net/hinter-core` package to the public NPM registry.

### Features

- **Manual Trigger**: Can be triggered manually from the GitHub Actions tab.
- **NPM Provenance**: Generates provenance attestations, cryptographically proving the package was built from this repository.
- **Git Tagging**: Automatically creates and pushes a git tag with the version from `package.json` (e.g., `v0.2.0`) upon successful publication.

### Required Secrets

Before running the workflow, you need to configure the following secret in your GitHub repository:

1. **Create an NPM Granular Access Token**:
   - Log in to [npmjs.com](https://www.npmjs.com/)
   - Go to your profile picture → Access Tokens
   - Click "Generate New Token" -> "Granular Access Token"
   - Give it a descriptive name (e.g., "GitHub Actions - hinter-core").
   - Under "Packages and Scopes", select the `@hinter-net/hinter-core` package (or the `@hinter-net` organization) and grant it "Read and Write" permissions.
   - Copy the generated token.

2. **Configure GitHub Repository Secrets**:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add the following repository secret:

| Secret Name | Description |
|-------------|-------------|
| `NPM_TOKEN` | Your NPM Granular Access Token (created in step 1) |

### How to Run

1. Go to the **Actions** tab in your GitHub repository.
2. Select **NPM Publish** from the workflow list.
3. Click **Run workflow**.

### What the Workflow Does

1. **Checkout**: Downloads the repository code.
2. **Version Detection**: Extracts the version from `package.json`.
3. **Setup**: Configures Node.js.
4. **Dependencies**: Installs project dependencies with `npm install`.
5. **Build**: Creates the package tarball with `npm run build:package`.
6. **Publish**: Publishes the package to the NPM registry with `--provenance`.
7. **Git Tag**: Creates and pushes a corresponding version tag to the repository.

---

## End-to-End Test Workflow

This workflow runs an end-to-end test to verify that two `hinter-core` instances can communicate and synchronize data correctly.

### Features

- **Manual Trigger**: Can be triggered manually from the GitHub Actions tab.
- **Real-World Simulation**: Tests the actual packaged and globally installed application, not just the source code.
- **Two-Node Test**: Simulates a network with two `hinter-core` nodes (`hinter1` and `hinter2`).
- **Data Synchronization**: Verifies that a file created on one node is successfully synchronized to the other.

### How it Works

The workflow consists of two parallel jobs, `hinter1` and `hinter2`.

1.  **Setup**:
    *   Each job checks out the repository and installs dependencies.
    *   It builds the npm package using `npm run build:package`.
    *   It installs the built package globally (`npm install -g ...`) along with `pm2`.

2.  **Execution**:
    *   Each job runs `hinter-core-initialize` to set up a local data directory.
    *   It then starts the `hinter-core` application as a background service using `pm2`.
    *   `hinter1` creates a report file (`report-from-1.txt`) in its outgoing directory for `hinter2`.
    *   `hinter2` creates a report file (`report-from-2.txt`) in its outgoing directory for `hinter1`.

3.  **Verification**:
    *   Each node waits for the other's report file to appear in its incoming directory and verifies the content.
    *   If a report is not received within the timeout period (180 seconds), the workflow fails.

### How to Run

1.  Go to the **Actions** tab in your GitHub repository.
2.  Select **End-to-End Test** from the workflow list.
3.  Click **Run workflow**.
