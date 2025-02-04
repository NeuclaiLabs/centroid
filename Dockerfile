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

# Application Settings
ENV PROJECT_NAME=OpenAstra
ENV DOMAIN=localhost
ENV ENVIRONMENT=local
ENV EMAILS_FROM_EMAIL=info@openastra.com

# Backend API Configuration
ENV BACKEND_CORS_ORIGINS=http://localhost:3000
ENV SECRET_KEY=yBUzteofjwxyj4b3RLGJGntojhb8B_i0mt2Oy7T-gIU
ENV DB_TYPE=sqlite
ENV TELEMETRY_ENABLED=true

# User Management
ENV FIRST_SUPERUSER=admin@openastra.com
ENV FIRST_SUPERUSER_PASSWORD=openastra123
ENV USERS_OPEN_REGISTRATION=True

# LLM Service Configuration
ENV LLM_BASE_URL=https://api.openai.com/v1
ENV LLM_API_KEY=your_api_key_here
ENV LLM_DEFAULT_MODEL=gpt-4o-mini

# NextJS Frontend Environment Variables
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_DEFAULT_USER_EMAIL=${FIRST_SUPERUSER}
ENV NEXT_PUBLIC_DEFAULT_USER_PASSWORD=${FIRST_SUPERUSER_PASSWORD}
ENV NEXT_PUBLIC_LLM_DEFAULT_MODEL=${LLM_DEFAULT_MODEL}
ENV NEXT_TELEMETRY_DISABLED=1

# NextAuth Configuration
ENV NEXTAUTH_URL=http://localhost:3000


# Create dummy .env.local file for Next.js
RUN touch /app/frontend/.env.local
RUN pnpm run build

# Build backend
FROM python:3.10-slim
WORKDIR /app

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/node_modules /app/frontend/node_modules
COPY --from=frontend-builder /app/frontend/package*.json /app/frontend/

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for running Next.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Install openapi-to-postmanv2 globally
RUN npm install -g openapi-to-postmanv2

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Set up backend
WORKDIR /app/backend

# Copy entire backend directory
COPY backend/ ./

# Now run poetry install
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

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
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
