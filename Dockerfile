FROM ubuntu:22.04

# Install node
RUN apt-get update && apt-get install -y wget gnupg \
    && wget -qO- https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Install pear
RUN apt-get install -y libatomic1 \
    && npm i -g pear \
    && pear
ENV PATH="/root/.config/pear/bin:${PATH}"
RUN echo 'export PATH="/root/.config/pear/bin:$PATH"' >> /root/.bashrc
RUN echo 'export PATH="/root/.config/pear/bin:$PATH"' >> /etc/profile

# Install code-server and Cline
RUN curl -fsSL https://code-server.dev/install.sh | sh
RUN code-server --install-extension saoudrizwan.claude-dev
# telemetry.telemetryLevel:off is known to not turn off all VS Code telemetry
RUN mkdir -p /root/.local/share/code-server/User && \
    echo '{\n  "workbench.colorTheme": "Default Dark+",\n  "telemetry.telemetryLevel": "off"\n}' > /root/.local/share/code-server/User/settings.json
# Cline settings are not stored in settings.json so we can't turn off Cline telemetry here
# Cline claims to respect the VS Code telemetry settings but the user should turn it off manually as well

# Copy over and install hinter-core
WORKDIR /app
COPY package*.json .
RUN npm i
COPY .clinerules/ ./.clinerules/
COPY ai/ ./ai/
COPY src/ ./src/

# Default command starts code-server in the background and starts hinter-core
CMD ["bash", "-c", "code-server --auth none --disable-telemetry /app & npm run start"]
