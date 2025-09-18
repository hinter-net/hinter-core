# hinter-core

## 0.2.0

### Minor Changes

- dd468e8: Switch from a Docker image to an npm package as the packaging format
- 9334627: `hinter-core-data/` is expected to be in the home directory by default, and in a specific directory if the `--data-dir` argument is used.

### Patch Changes

- d64d419: The peer gets blacklisted if corestore replication errors for any reason other than a connection reset or timeout.
  This covers a variety of cases such as the peer running multiple instances in parallel or an instance with corrupted storage.
- 459a0a4: Removed usage of Pear Runtime and its dependencies
- a0fd304: Modifications to incoming directories get rectified automatically while the app is running

## 0.1.1

### Patch Changes

- f81256e: Docker image working directory name is updated to track hinter-cline.
  This requires changes to how the volumes are mounted in the Docker command that runs the image.
