FROM node:22-alpine3.16 as base

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the gRPC port
EXPOSE 5005

# Start the service
CMD ["node", "src/index.js"]
