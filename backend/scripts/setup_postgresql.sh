#!/bin/bash
# PostgreSQL setup script for 4uPDF on VPS2
# Run as root or with sudo

set -e

DB_NAME="4updf"
DB_USER="4updf_user"
DB_PASS="${1:-$(openssl rand -base64 16)}"

echo "=== 4uPDF PostgreSQL Setup ==="
echo "Database: $DB_NAME"
echo "User: $DB_USER"

# Install PostgreSQL if not present
if ! command -v psql &>/dev/null; then
  echo "Installing PostgreSQL..."
  apt-get update && apt-get install -y postgresql postgresql-contrib
fi

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

echo ""
echo "=== PostgreSQL Ready ==="
echo ""
echo "Connection string:"
echo "DATABASE_URL=postgresql+asyncpg://$DB_USER:$DB_PASS@localhost/$DB_NAME"
echo ""
echo "Add this to your backend/.env file, then run:"
echo "  cd backend && alembic upgrade head"
echo ""
echo "Or for direct table creation:"
echo "  cd backend && python -c 'import asyncio; from app.database import init_db; asyncio.run(init_db())'"
