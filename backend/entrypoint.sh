#!/bin/bash

# DATABASE_URL should be set via environment (SSM in production)
echo "Waiting for database connection..."

python -c "
import time
import psycopg2
import os
import sys

db_url = os.getenv('DATABASE_URL')
if not db_url:
    print('Error: DATABASE_URL environment variable is not set.')
    sys.exit(1)

# Robust retry loop (max 60 seconds)
retries = 0
while retries < 60:
    try:
        conn = psycopg2.connect(db_url)
        conn.close()
        print('Database connection established!')
        sys.exit(0)
    except Exception as e:
        retries += 1
        time.sleep(1)
print(f'Error: Could not connect to database after 60 seconds. {e}')
sys.exit(1)
"

if [ $? -ne 0 ]; then
    echo "Database connection failed. Exiting."
    exit 1
fi

# Run Alembic migrations
echo "Running database migrations..."
alembic upgrade head

echo "Database setup complete!"

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port 8000