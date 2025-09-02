FROM node:22

WORKDIR /hinter-core
COPY package*.json .
RUN npm i
COPY src/ ./src/

CMD ["node", "src/index.js"]
