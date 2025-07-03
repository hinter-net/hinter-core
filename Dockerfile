FROM ubuntu:24.04

# Install dependencies
RUN apt-get update && apt-get install -y curl libatomic1 \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y nodejs \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install the pear installer
RUN npm i -g pear

# Copy over and install hinter-core
WORKDIR /app
COPY package*.json .
RUN npm i
COPY src/ ./src/

# Default command installs pear and starts hinter-core
CMD ["/bin/sh", "-c", "pear && pear run src/index.js"]
