FROM ubuntu:24.04

# Install dependencies
RUN apt-get update && apt-get install -y curl git libatomic1 \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y nodejs \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install the pear installer
RUN npm i -g pear

# Install code-server and Cline
RUN curl -fsSL https://code-server.dev/install.sh | sh
RUN code-server --install-extension saoudrizwan.claude-dev
# telemetry.telemetryLevel:off is known to not turn off all VS Code telemetry
RUN mkdir -p /root/.local/share/code-server/User && \
  echo '{\n  "workbench.colorTheme": "Default Dark+",\n  "telemetry.telemetryLevel": "off"\n}' > /root/.local/share/code-server/User/settings.json
# Cline settings are not stored in settings.json so we can't turn off Cline telemetry here
# Cline claims to respect the VS Code telemetry settings but the user should turn it off manually as well

# Apply placeholder git user config
RUN git config --global user.name "hinter-core" && git config --global user.email "hinter-core"

# Copy over and install hinter-core
WORKDIR /app
COPY package*.json .
RUN npm i
COPY .clinerules/ ./.clinerules/
COPY ai/ ./ai/
COPY src/ ./src/

# Default command installs pear, starts code-server in the background and starts hinter-core
CMD ["/bin/sh", "-c", "pear && code-server --auth none --disable-telemetry /app & pear run src/index.js"]
