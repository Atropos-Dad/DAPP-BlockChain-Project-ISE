# Use an official Node.js runtime as a parent image
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Install serve globally to serve the static files
RUN npm install -g serve

# Expose the port the app runs on
EXPOSE 4173

# Command to run the application using serve
# serve -s dist will serve the dist folder
# serve -l 4173 will listen on port 4173
# The --no-clipboard option is good practice in containers
CMD ["serve", "-s", "dist", "-l", "4173", "--no-clipboard"] 