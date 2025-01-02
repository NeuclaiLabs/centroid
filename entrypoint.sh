#!/bin/bash
# Wait for database to be ready
python wait_for_db.py

# Run migrations
alembic upgrade head

# Run the seeding script
python app/initial_data.py

# Start the application
exec "$@"
