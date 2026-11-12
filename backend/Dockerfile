# Node.js backend Dockerfile
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies first for layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose backend API port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the Node.js server
CMD ["node", "index.js"]

