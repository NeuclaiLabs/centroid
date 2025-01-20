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

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Copy poetry files
COPY backend/pyproject.toml backend/poetry.lock /app/backend/

# Install dependencies
WORKDIR /app/backend
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

# Copy backend code
COPY backend/ /app/backend/

# Set environment variables
ENV NEXT_PUBLIC_API_URL=http://localhost:8000
ENV OPENAI_API_KEY=your_api_key_here
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=dev_secret_key
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV PROJECT_NAME=OpenAstra
ENV FIRST_SUPERUSER=admin@openastra.com
ENV FIRST_SUPERUSER_PASSWORD=openastra123
ENV NEXT_PUBLIC_DEFAULT_USER_EMAIL=user@openastra.com
ENV NEXT_PUBLIC_DEFAULT_USER_PASSWORD=openastra123
ENV DOMAIN=localhost
ENV ENVIRONMENT=local
ENV BACKEND_CORS_ORIGINS=http://localhost:3000
ENV SECRET_KEY=yBUzteofjwxyj4b3RLGJGntojhb8B_i0mt2Oy7T-gIU
ENV USERS_OPEN_REGISTRATION=True
ENV DB_TYPE=sqlite

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
