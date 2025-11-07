# Use official Node.js LTS version as base image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies first (package.json + package-lock.json if exists)
COPY package*.json ./

RUN npm install --production

# Copy source files
COPY . .

# Expose port from env variable, default to 5000 if not set
ARG PORT=5000
ENV PORT=${PORT}

EXPOSE ${PORT}

# Use nodemon in development, otherwise node to start server
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"development\" ]; then npx nodemon server.js; else node server.js; fi"]
