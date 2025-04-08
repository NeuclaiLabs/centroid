# Base stage for shared dependencies
FROM node:18-alpine AS node-base
RUN npm install -g pnpm
RUN apk add --no-cache python3 make g++ gcc

# Frontend dependencies stage
FROM node-base AS frontend-deps
WORKDIR /app/frontend
COPY frontend/package*.json ./
# Cache dependency installation
RUN --mount=type=cache,id=pnpm,target=/root/.pnpm-store \
    pnpm install

# Frontend builder stage
FROM frontend-deps AS frontend-builder
WORKDIR /app/frontend
# Copy frontend source code
COPY frontend/ .

# NextJS Frontend Environment Variables
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTAUTH_URL=http://localhost:3000

# Create dummy .env.local file for Next.js
RUN touch /app/frontend/.env.local
# Build frontend app
# RUN --mount=type=cache,id=next-cache,target=/app/frontend/.next/cache \
RUN    pnpm run build

# Python base stage with uv
FROM python:3.10 AS python-base

ENV PYTHONUNBUFFERED=1
WORKDIR /app/

# Install uv from official image
COPY --from=ghcr.io/astral-sh/uv:0.6.13 /uv /uvx /bin/

# Configure Python and uv environment
ENV PATH="/app/.venv/bin:$PATH"
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PYTHONPATH=/app

# Backend dependencies stage
FROM python-base AS backend-deps
WORKDIR /app/backend

# Install dependencies
COPY backend/pyproject.toml backend/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project

# Node.js installation for backend stage
FROM backend-deps AS backend-with-node
# Install system dependencies and Node.js
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm openapi-to-postmanv2

# Final application stage
FROM backend-with-node AS app
WORKDIR /app

# Set environment variables
# Backend API Configuration
ENV BACKEND_CORS_ORIGINS=http://localhost:3000
ENV SECRET_KEY=yBUzteofjwxyj4b3RLGJGntojhb8B_i0mt2Oy7T-gIU
ENV TELEMETRY_ENABLED=true
ENV BASE_DIR=/app/data
ENV PROJECT_NAME=OpenAstra

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
ENV LOG_DIR=/app/data/logs
ENV LOG_FILE=app.log
ENV LOG_ROTATION_INTERVAL=midnight
ENV LOG_BACKUP_COUNT=7

# Add environment variable for migrations
ENV RUN_MIGRATIONS=true

# Copy backend files
COPY backend/scripts /app/scripts
COPY backend/pyproject.toml backend/uv.lock backend/alembic.ini /app/
COPY backend/app /app/app

# Copy frontend build artifacts
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/node_modules /app/frontend/node_modules
COPY --from=frontend-builder /app/frontend/package*.json /app/frontend/

# Sync the project with uv
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync

# Create logs directory with appropriate permissions
RUN mkdir -p /app/data/logs && chmod 755 /app/data/logs

# Copy startup scripts
COPY ./start.sh /app/start.sh
RUN chmod +x /app/start.sh

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
