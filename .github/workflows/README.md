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
2. **Setup**: Configures Node.js and Docker Buildx
3. **Version Detection**: Extracts version from `package.json`
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
