# Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Install build dependencies and Python for node-gyp
RUN apk add --no-cache python3 make g++ gcc

# Install pnpm
RUN npm install -g pnpm

COPY frontend/package*.json ./
RUN pnpm install
COPY frontend/ .


# NextJS Frontend Environment Variables
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_TELEMETRY_DISABLED=1

# NextAuth Configuration
ENV NEXTAUTH_URL=http://localhost:3000

# Create dummy .env.local file for Next.js
RUN touch /app/frontend/.env.local
RUN pnpm run build

# Build backend
FROM python:3.10-slim AS backend-builder
WORKDIR /app

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/node_modules /app/frontend/node_modules
COPY --from=frontend-builder /app/frontend/package*.json /app/frontend/

# Install system dependencies and Node.js
RUN apt-get update && \
    apt-get install -y \
    curl \
    build-essential \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install openapi-to-postmanv2 globally
RUN npm install -g openapi-to-postmanv2

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Set up backend
WORKDIR /app/backend

# Copy backend files
COPY backend/ .

# Configure Poetry to use virtual environments and install dependencies
RUN poetry config virtualenvs.create true && \
    poetry install --no-interaction --no-ansi

# Set environment variables
# Backend API Configuration
ENV BACKEND_CORS_ORIGINS=http://localhost:3000
ENV SECRET_KEY=yBUzteofjwxyj4b3RLGJGntojhb8B_i0mt2Oy7T-gIU
ENV TELEMETRY_ENABLED=true
ENV BASE_DIR=/app/data

# User Management
ENV FIRST_SUPERUSER=admin@example.com
ENV FIRST_SUPERUSER_PASSWORD=example123
ENV USERS_OPEN_REGISTRATION=True

# LLM Service Configuration
ENV LLM_BASE_URL=https://api.openai.com/v1
ENV LLM_API_KEY=your_api_key_here
ENV LLM_DEFAULT_MODEL=gpt-4o-mini

# Add logging configuration
ENV LOG_LEVEL=INFO
ENV LOG_FORMAT="%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
ENV LOG_DIR=logs
ENV LOG_FILE=app.log
ENV LOG_ROTATION_INTERVAL=midnight
ENV LOG_BACKUP_COUNT=7

RUN npm install -g pnpm

# Create logs directory with appropriate permissions
RUN mkdir -p /app/logs && chmod 755 /app/logs

# Add environment variable for migrations
ENV RUN_MIGRATIONS=true

# Copy start script
COPY ./start.sh /app/start.sh
RUN chmod +x /app/start.sh

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/app/start.sh"]
