# Use an official Node.js image as the base
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to install dependencies
COPY package.json pnpm-lock.yaml ./

ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_API_URL=https://api.openastra.com

# Install pnpm globally and add Python
RUN apk add --no-cache python3 make g++ \
    && npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the Next.js application
CMD ["pnpm", "run", "start"]
