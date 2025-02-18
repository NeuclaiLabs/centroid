#!/bin/bash

echo "[start.sh] Starting script..."

# Start backend first
echo "[start.sh] Starting backend server..."
cd /app/backend
echo "[start.sh] Current directory: $(pwd)"
echo "[start.sh] Listing directory contents:"
ls -la
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# Start frontend
echo "[start.sh] Starting frontend server..."
cd /app/frontend
echo "[start.sh] Current directory: $(pwd)"
echo "[start.sh] Listing directory contents:"
ls -la
pnpm run start
