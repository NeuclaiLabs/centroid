#!/bin/bash

# Run database migrations if enabled
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    cd /app/backend && poetry run alembic upgrade head
fi

# Start frontend
echo "Starting frontend..."
cd /app/frontend && pnpm install && pnpm run start &

# Start backend
echo "Starting backend..."
cd /app/backend && poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
