FROM ubuntu:22.04

RUN apt-get update && apt-get install -y wget gnupg \
    && wget -qO- https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

RUN apt-get install -y libatomic1 \
    && npm i -g pear \
    && pear
ENV PATH="/root/.config/pear/bin:${PATH}"
RUN echo 'export PATH="/root/.config/pear/bin:$PATH"' >> /root/.bashrc
RUN echo 'export PATH="/root/.config/pear/bin:$PATH"' >> /etc/profile

WORKDIR /app

COPY package*.json .
RUN npm i

COPY src/ ./src/

CMD ["npm", "run", "start"]
