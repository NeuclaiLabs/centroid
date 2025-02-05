#!/bin/bash
# Wait for database to be ready
poetry run python app/wait_for_db.py

# Run migrations
poetry run alembic upgrade head

# Run the seeding script
poetry run python app/initial_data.py

# Start the application
exec "$@"
