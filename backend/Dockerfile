# Node.js 20 lightweight Alpine base
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

EXPOSE 5000

# Start server (auto-initializes schema & seeds demo user if needed)
CMD ["node", "src/server.js"]
