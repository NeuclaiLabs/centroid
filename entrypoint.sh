#!/bin/bash

cd /app/backend

# Set up ChromaDB model persistence
echo "[entrypoint.sh] Setting up ChromaDB model persistence..."
CACHE_DIR="/root/.cache/chroma/onnx_models"
PERSISTENT_DIR="/app/data/.chromadb/models"

# Create persistent directory if it doesn't exist
mkdir -p "$PERSISTENT_DIR"

# Remove existing cache directory or symlink if it exists
rm -rf "$CACHE_DIR"

# Create parent directory for cache
mkdir -p "$(dirname "$CACHE_DIR")"

# Create symlink
ln -s "$PERSISTENT_DIR" "$CACHE_DIR"

# Wait for database to be ready
echo "[entrypoint.sh] Waiting for database..."
poetry run python app/wait_for_db.py

# Run migrations
echo "[entrypoint.sh] Running database migrations..."
poetry run alembic upgrade head

# Run the seeding script
echo "[entrypoint.sh] Running initial data script..."
poetry run python app/initial_data.py

# Change back to root directory before executing start.sh
echo "[entrypoint.sh] Changing back to root directory..."
cd /app

# Start the application
echo "[entrypoint.sh] Executing start.sh with args: $@"
exec "$@"
