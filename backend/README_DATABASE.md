# 4uPDF Database Schema

## Overview

The 4uPDF platform uses SQLAlchemy 2.0+ with async support for database operations. The schema is designed to support:

- User authentication and tier management (Free/Pro/Enterprise)
- PDF processing job tracking
- Usage analytics and rate limiting
- File cleanup logging for security compliance
- General analytics events

## Database Support

- **Development**: SQLite with aiosqlite (default)
- **Production**: PostgreSQL with asyncpg (recommended)

## Schema Models

### Users (`users`)

Stores user accounts with tier-based access control.

**Fields:**
- `id`: Primary key
- `email`: Unique user email (indexed)
- `hashed_password`: Bcrypt hashed password
- `tier`: FREE | PRO | ENTERPRISE
- `is_active`: Account active status
- `is_verified`: Email verification status
- `usage_limit_daily`: Daily operation limit
- `usage_limit_monthly`: Monthly operation limit
- `stripe_customer_id`: Stripe integration
- `stripe_subscription_id`: Active subscription
- `created_at`, `updated_at`, `last_login_at`: Timestamps

**Relationships:**
- One-to-many with `ProcessingJob`
- One-to-many with `UsageLog`

### Processing Jobs (`processing_jobs`)

Tracks all PDF processing operations.

**Fields:**
- `id`: Primary key
- `job_id`: UUID for API tracking (indexed)
- `user_id`: Foreign key to users (nullable for anonymous)
- `tool_type`: MERGE | SPLIT | SPLIT_OCR | COMPRESS | PDF_TO_WORD | WORD_TO_PDF | JPG_TO_PDF | PDF_TO_JPG
- `status`: PENDING | PROCESSING | COMPLETED | FAILED | CANCELLED
- `input_filename`, `input_size_bytes`, `input_pages`: Input file metadata
- `output_filenames`, `output_size_bytes`, `output_count`: Output metadata (JSON array)
- `processing_time_seconds`: Performance tracking
- `error_message`: Failure details
- `config`: Tool-specific configuration (JSON)
- `metadata`: Additional metadata (JSON)
- `ip_address`, `user_agent`: Request context
- `created_at`, `started_at`, `completed_at`: Lifecycle timestamps

**Indexes:**
- `job_id` (unique)
- `user_id`
- `created_at`

### Usage Logs (`usage_logs`)

Daily usage tracking for rate limiting.

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key to users (nullable)
- `tool_type`: Tool used
- `date`: Date of usage (indexed)
- `pages_processed`: Page count
- `files_processed`: File count
- `ip_address`: Client IP (for anonymous rate limiting)
- `session_id`: Session identifier

**Indexes:**
- `user_id`
- `date`
- `ip_address`
- `session_id`

### File Cleanup Logs (`file_cleanup_logs`)

Tracks file deletion for security compliance.

**Fields:**
- `id`: Primary key
- `file_path`: Deleted file path
- `file_size_bytes`: File size
- `created_at`: When file was created
- `deleted_at`: When file was deleted
- `reason`: Cleanup reason (TTL, user request, etc.)

### Analytics Events (`analytics_events`)

General purpose analytics tracking.

**Fields:**
- `id`: Primary key
- `event_type`: Event category (indexed)
- `event_data`: JSON payload
- `user_id`: Associated user (nullable)
- `session_id`: Session identifier
- `ip_address`: Client IP
- `page_url`: Page where event occurred
- `referrer`: HTTP referrer
- `user_agent`: Client user agent
- `created_at`: Timestamp (indexed)

**Indexes:**
- `event_type`
- `created_at`
- `session_id`

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Database

Copy `.env.example` to `.env` and configure:

```bash
# SQLite (default)
DATABASE_URL=sqlite+aiosqlite:///./4updf.db

# PostgreSQL (production)
DATABASE_URL=postgresql+asyncpg://user:password@localhost/4updf
```

### 3. Create Tables

**Option A: Direct SQLAlchemy (recommended for dev)**

```bash
python migrate.py create
```

**Option B: Alembic Migrations (recommended for production)**

```bash
# Generate initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

### 4. Verify Schema

```bash
# Check database tables were created
sqlite3 4updf.db ".tables"

# Or for PostgreSQL
psql 4updf -c "\dt"
```

## Migration Workflow

### Creating New Migrations

```bash
# After modifying models in app/models/database.py
alembic revision --autogenerate -m "Add new field to users table"

# Review the generated migration in alembic/versions/
# Edit if needed

# Apply migration
alembic upgrade head
```

### Rolling Back

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>

# Rollback all migrations
alembic downgrade base
```

## Integration with FastAPI

### Using Database Sessions

```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.database import User, ProcessingJob

@app.get("/jobs/{job_id}")
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProcessingJob).where(ProcessingJob.job_id == job_id)
    )
    job = result.scalar_one_or_none()
    return job
```

### Example Queries

```python
from sqlalchemy import select, func
from app.models.database import UsageLog, ToolType

# Count today's usage for a user
today = datetime.now().date()
result = await db.execute(
    select(func.count(UsageLog.id))
    .where(UsageLog.user_id == user_id)
    .where(func.date(UsageLog.date) == today)
)
usage_count = result.scalar()

# Get completed jobs for a tool type
result = await db.execute(
    select(ProcessingJob)
    .where(ProcessingJob.tool_type == ToolType.SPLIT_OCR)
    .where(ProcessingJob.status == JobStatus.COMPLETED)
    .order_by(ProcessingJob.created_at.desc())
    .limit(10)
)
jobs = result.scalars().all()
```

## Rate Limiting Strategy

The schema supports rate limiting via `UsageLog`:

1. Anonymous users: Rate limit by IP + session_id
2. Free tier users: Daily limit (10) + monthly limit (100)
3. Pro tier users: Daily limit (1000) + monthly limit (10000)

Implementation:
- Log every operation in `usage_logs`
- Query count for current day/month
- Reject if limit exceeded

## File Cleanup Strategy

The schema supports automatic file cleanup:

1. Create cron job to run cleanup script every hour
2. Query `processing_jobs` for files older than 24 hours
3. Delete files from disk
4. Log deletion in `file_cleanup_logs`

## Security Considerations

- **Passwords**: Always use bcrypt with salt (never store plaintext)
- **SQL Injection**: SQLAlchemy ORM protects against this
- **Rate Limiting**: Enforce at API level using `usage_logs`
- **File Access**: Validate job ownership before serving downloads
- **Anonymous Users**: Track by IP to prevent abuse

## Performance Optimization

### Indexes

All frequently queried fields have indexes:
- `users.email` (unique)
- `processing_jobs.job_id` (unique)
- `processing_jobs.user_id`
- `usage_logs.date`
- `usage_logs.ip_address`
- `analytics_events.event_type`
- `analytics_events.created_at`

### Connection Pooling

Configured in `app/database.py`:
- Pool size: 5 connections
- Max overflow: 10 connections
- Pre-ping: Enabled (check connection health)

### Query Optimization

- Use `select()` with specific columns instead of `SELECT *`
- Use `limit()` for paginated results
- Use `func.count()` for counting instead of loading all rows
- Use indexes for `WHERE` and `ORDER BY` clauses

## Testing

```bash
# Run tests with in-memory SQLite
DATABASE_URL=sqlite+aiosqlite:///:memory: pytest tests/

# Test migrations
alembic upgrade head
alembic downgrade base
alembic upgrade head
```

## Production Deployment

1. **Use PostgreSQL**: Better performance and concurrent write support
2. **Enable SSL**: Configure `DATABASE_URL` with SSL parameters
3. **Backup Strategy**: Daily automated backups of PostgreSQL database
4. **Monitor Connections**: Track pool usage with monitoring tools
5. **Run Migrations**: Always test migrations in staging first

## Troubleshooting

### "Table already exists" error
```bash
# Drop and recreate
python migrate.py drop
python migrate.py create
```

### Alembic out of sync
```bash
# Stamp current database state
alembic stamp head

# Generate new migration
alembic revision --autogenerate -m "Sync schema"
```

### Connection pool exhausted
- Increase `pool_size` in `app/database.py`
- Check for unclosed sessions
- Add connection timeout

## Next Steps

1. Implement authentication endpoints (`/api/auth/register`, `/api/auth/login`)
2. Add rate limiting middleware using `usage_logs`
3. Implement file cleanup cron job
4. Add Stripe webhook handler for subscription management
5. Implement analytics dashboard using `analytics_events`
