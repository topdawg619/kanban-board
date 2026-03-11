FROM node:20-alpine

# Install build deps for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/

EXPOSE 3001

CMD ["node", "src/index.js"]
