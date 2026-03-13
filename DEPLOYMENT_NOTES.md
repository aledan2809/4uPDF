# 4uPDF Database Deployment Notes

## What Was Created

### Database Schema Files

1. **backend/app/database.py** - SQLAlchemy async engine and session management
2. **backend/app/models/database.py** - Complete data models:
   - `User` - User accounts with tier management (Free/Pro/Enterprise)
   - `ProcessingJob` - PDF processing job tracking
   - `UsageLog` - Rate limiting and analytics
   - `FileCleanupLog` - Security compliance tracking
   - `AnalyticsEvent` - General analytics

3. **backend/alembic.ini** - Alembic configuration
4. **backend/alembic/env.py** - Migration environment with async support
5. **backend/alembic/versions/001_initial_schema.py** - Initial migration

### Utility Scripts

1. **backend/migrate.py** - Simple DB creation/drop tool
2. **backend/scripts/cleanup_files.py** - Automated file cleanup
3. **backend/scripts/cleanup_cron.sh** - Cron job wrapper
4. **backend/scripts/generate_migration.sh** - Migration generation helper

### Configuration

1. **backend/.env.example** - Environment variables template
2. **backend/README_DATABASE.md** - Complete documentation

### Updated Files

1. **backend/requirements.txt** - Added SQLAlchemy, Alembic, aiosqlite, asyncpg
2. **backend/app/main.py** - Added database initialization on startup

## Deployment Steps

### Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

For SQLite (development):
```
DATABASE_URL=sqlite+aiosqlite:///./4updf.db
```

For PostgreSQL (production):
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost/4updf
```

### Step 3: Run Migrations

**Option A: Using Alembic (recommended)**

```bash
cd backend
alembic upgrade head
```

**Option B: Direct table creation**

```bash
cd backend
python migrate.py create
```

### Step 4: Verify Database

```bash
# For SQLite
sqlite3 4updf.db ".tables"

# For PostgreSQL
psql 4updf -c "\dt"
```

Expected tables:
- users
- processing_jobs
- usage_logs
- file_cleanup_logs
- analytics_events
- alembic_version

### Step 5: Test API

```bash
cd backend
python -m app.main
```

Visit http://localhost:8000 - should see API info with database initialized.

### Step 6: Set Up File Cleanup (Production)

Add to crontab:
```bash
crontab -e

# Add this line to run cleanup every hour
0 * * * * /path/to/4uPDF/backend/scripts/cleanup_cron.sh
```

Or for Windows Task Scheduler:
```powershell
# Create scheduled task
schtasks /create /tn "4uPDF File Cleanup" /tr "python D:\Projects\4uPDF\backend\scripts\cleanup_files.py" /sc hourly
```

## VPS Deployment with systemd

### 1. Create systemd service file

```bash
sudo nano /etc/systemd/system/4updf.service
```

```ini
[Unit]
Description=4uPDF FastAPI Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/4updf/backend
Environment="PATH=/var/www/4updf/backend/venv/bin"
Environment="DATABASE_URL=postgresql+asyncpg://4updf:password@localhost/4updf"
ExecStart=/var/www/4updf/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### 2. Start service

```bash
sudo systemctl daemon-reload
sudo systemctl enable 4updf
sudo systemctl start 4updf
sudo systemctl status 4updf
```

### 3. Configure nginx

```nginx
server {
    listen 80;
    server_name api.4updf.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## PostgreSQL Setup (Production)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql

CREATE DATABASE 4updf;
CREATE USER 4updf_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE 4updf TO 4updf_user;
\q

# Run migrations
cd /var/www/4updf/backend
source venv/bin/activate
alembic upgrade head
```

## Backup Strategy

### Daily backups

```bash
#!/bin/bash
# /var/www/4updf/scripts/backup_db.sh

BACKUP_DIR=/var/backups/4updf
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# PostgreSQL backup
pg_dump -U 4updf_user -h localhost 4updf > $BACKUP_DIR/4updf_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "4updf_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/4updf_$DATE.sql"
```

Add to crontab:
```bash
0 2 * * * /var/www/4updf/scripts/backup_db.sh
```

## Monitoring

### Check database size

```sql
-- PostgreSQL
SELECT pg_size_pretty(pg_database_size('4updf'));

-- SQLite
.dbinfo
```

### Check table row counts

```sql
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'processing_jobs', COUNT(*) FROM processing_jobs
UNION ALL
SELECT 'usage_logs', COUNT(*) FROM usage_logs
UNION ALL
SELECT 'file_cleanup_logs', COUNT(*) FROM file_cleanup_logs
UNION ALL
SELECT 'analytics_events', COUNT(*) FROM analytics_events;
```

### Monitor cleanup logs

```bash
tail -f backend/logs/cleanup.log
```

## Troubleshooting

### Migration fails

```bash
# Check current revision
alembic current

# Reset and reapply
alembic downgrade base
alembic upgrade head
```

### Connection pool exhausted

Edit `backend/app/database.py`:
```python
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,  # Increase from 5
    max_overflow=30  # Increase from 10
)
```

### Database locked (SQLite)

SQLite doesn't support concurrent writes. For production with multiple workers, use PostgreSQL.

## Security Checklist

- [ ] Change SECRET_KEY in .env
- [ ] Use strong database password
- [ ] Enable PostgreSQL SSL in production
- [ ] Restrict database access to localhost only
- [ ] Set up firewall rules (only port 80/443 public)
- [ ] Enable automated backups
- [ ] Set up file cleanup cron job
- [ ] Monitor disk usage
- [ ] Configure rate limiting
- [ ] Set up error logging (Sentry)

## Next Steps

1. Implement authentication endpoints using User model
2. Add rate limiting middleware using UsageLog
3. Integrate job tracking into existing PDF endpoints
4. Add analytics tracking for SEO metrics
5. Set up Stripe webhook handler for subscriptions
6. Implement admin dashboard for analytics

## Notes

- Database is automatically initialized on app startup
- Migration 001 creates all tables with proper indexes
- File cleanup runs via cron, logs to file_cleanup_logs table
- Rate limiting uses usage_logs with daily/monthly aggregation
- All timestamps are timezone-aware (UTC)
- JSON columns support flexible metadata storage
