FROM node:24-alpine

WORKDIR /app

# Copy package definitions
COPY package.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm --prefix client install
RUN npm --prefix server install

# Copy source
COPY client/ ./client/
COPY server/ ./server/

# Build client bundle
RUN npm --prefix client run build

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server/src/server.js"]
