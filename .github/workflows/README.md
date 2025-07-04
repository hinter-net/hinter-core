# GitHub Actions Workflows

## Docker Build and Push Workflow

This workflow builds multiplatform Docker images for the hinter-core application and pushes them to Docker Hub.

### Features

- **Manual Trigger**: Can be triggered manually from the GitHub Actions tab
- **Multiplatform Build**: Builds for both `linux/amd64` and `linux/arm64` architectures
- **Dual Tagging**: Tags images with both `latest` and the version from `package.json`
- **Git Tagging**: Automatically creates and pushes a git tag with the version (e.g., `v0.0.1`)
- **Provenance**: Generates GitHub provenance attestations for supply chain security
- **SBOM**: Generates Software Bill of Materials for security scanning
- **Build Cache**: Uses GitHub Actions cache to speed up subsequent builds

### Required Secrets

Before running the workflow, you need to configure the following secrets in your GitHub repository:

1. **Create a Docker Hub Access Token** (recommended for security):
   - Log in to [Docker Hub](https://hub.docker.com/)
   - Go to Account Settings → Security → Access Tokens
   - Click "New Access Token"
   - Give it a descriptive name (e.g., "GitHub Actions - hinter-core")
   - Select appropriate permissions (Read, Write, Delete for your repositories)
   - Copy the generated token (you won't be able to see it again)

2. **Configure GitHub Repository Secrets**:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add the following repository secrets:

| Secret Name | Description |
|-------------|-------------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_TOKEN` | Your Docker Hub access token (created in step 1) |

### How to Run

1. Go to the **Actions** tab in your GitHub repository
2. Select **Build and Push Docker Images** from the workflow list
3. Click **Run workflow**
4. Choose whether to push to Docker Hub (default: true)
5. Click **Run workflow** to start the build

### What the Workflow Does

1. **Checkout**: Downloads the repository code
2. **Version Detection**: Extracts version from `package.json`
3. **Setup**: Configures Docker Buildx
4. **Authentication**: Logs into Docker Hub (if pushing)
5. **Metadata**: Generates image tags and labels
6. **Build**: Builds multiplatform Docker images with provenance
7. **Push**: Pushes images to Docker Hub (if enabled)
8. **Attestation**: Creates GitHub provenance attestations
9. **Git Tag**: Creates and pushes a version tag to the repository
10. **Summary**: Outputs build details in the workflow summary

### Output

The workflow will create:

- Docker images tagged as:
  - `bbenligiray/hinter-core:latest`
  - `bbenligiray/hinter-core:0.0.1` (or current version)
- Git tag: `v0.0.1` (or current version)
- GitHub provenance attestations for supply chain verification

### Security Features

- **Provenance**: Each image includes cryptographically signed provenance data
- **SBOM**: Software Bill of Materials for dependency tracking
- **Attestations**: GitHub-signed build attestations
- **Minimal Permissions**: Uses least-privilege principle for GitHub token permissions

### Troubleshooting

- **Authentication Failed**: Check that `DOCKER_USERNAME` and `DOCKER_TOKEN` secrets are correctly set
- **Tag Already Exists**: The workflow will skip git tag creation if the version tag already exists
- **Build Failures**: Check the workflow logs for specific error messages
- **Permission Denied**: Ensure the repository has the necessary permissions for attestations

---

## End-to-End Test Workflow

This workflow runs an end-to-end test to verify that two `hinter-core` instances can communicate and synchronize data correctly.

### Features

- **Manual Trigger**: Can be triggered manually from the GitHub Actions tab.
- **Two-Node Test**: Simulates a network with two `hinter-core` nodes (`hinter1` and `hinter2`).
- **Data Synchronization**: Verifies that a file created on one node is successfully synchronized to the other.
- **Isolated Environment**: Each node runs in its own Docker container.

### How it Works

The workflow consists of two parallel jobs, `hinter1` and `hinter2`, which represent the two nodes in the test.

1.  **Setup**:
    *   Each job checks out the repository and builds a local Docker image tagged as `hinter-core:test`.
    *   It sets up a data directory (`hinter-core-data`) and configures the public and secret keys for each node using environment variables.

2.  **Execution**:
    *   Each job starts a `hinter-core` container in the background.
    *   `hinter1` creates a report file (`report-from-1.txt`) in its outgoing directory for `hinter2`.
    *   `hinter2` creates a report file (`report-from-2.txt`) in its outgoing directory for `hinter1`.

3.  **Verification**:
    *   `hinter1` waits for `report-from-2.txt` to appear in its incoming directory and verifies its content.
    *   `hinter2` waits for `report-from-1.txt` to appear in its incoming directory and verifies its content.
    *   If a report is not received within the timeout period (180 seconds), the workflow fails.

### How to Run

1.  Go to the **Actions** tab in your GitHub repository.
2.  Select **End-to-End Test** from the workflow list.
3.  Click **Run workflow**.

### Troubleshooting

-   **Timeout Reached**: If the workflow fails due to a timeout, check the Docker logs for `hinter1` and `hinter2` in the workflow output. This can indicate issues with container startup, network communication, or data synchronization.
-   **File Content Mismatch**: If the received report does not have the expected content, there may be an issue with how the files are being created or transferred.
