#!/bin/bash
# Generate Alembic migration after modifying models

if [ -z "$1" ]; then
    echo "Usage: ./generate_migration.sh \"migration message\""
    exit 1
fi

cd "$(dirname "$0")/.."

echo "Generating migration: $1"
alembic revision --autogenerate -m "$1"

echo ""
echo "Review the generated migration in alembic/versions/"
echo "Then run: alembic upgrade head"
