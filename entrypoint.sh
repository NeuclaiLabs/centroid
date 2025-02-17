#!/bin/bash

cd /app/backend

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
