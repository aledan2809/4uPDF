"""
Deploy database migrations to production
Runs Alembic upgrade with error handling
"""

import subprocess
import sys
from pathlib import Path

def run_command(cmd, cwd=None):
    """Run shell command and capture output"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            check=True
        )
        print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}", file=sys.stderr)
        print(f"stdout: {e.stdout}", file=sys.stderr)
        print(f"stderr: {e.stderr}", file=sys.stderr)
        return False

def main():
    backend_dir = Path(__file__).parent

    print("=" * 60)
    print("4uPDF Database Migration Deployment")
    print("=" * 60)
    print()

    print("Step 1: Installing dependencies...")
    if not run_command("pip install -r requirements.txt", cwd=backend_dir):
        print("Failed to install dependencies")
        return 1
    print("✓ Dependencies installed")
    print()

    print("Step 2: Checking current migration status...")
    if not run_command("alembic current", cwd=backend_dir):
        print("Warning: Could not check migration status")
    print()

    print("Step 3: Running migrations...")
    if not run_command("alembic upgrade head", cwd=backend_dir):
        print("Failed to run migrations")
        return 1
    print("✓ Migrations applied successfully")
    print()

    print("Step 4: Verifying database schema...")
    verify_script = """
import asyncio
from app.database import engine
from sqlalchemy import text

async def verify():
    async with engine.begin() as conn:
        result = await conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ))
        tables = [row[0] for row in result]
        print("Tables found:", ", ".join(tables))

        expected = ["users", "processing_jobs", "usage_logs", "file_cleanup_logs", "analytics_events", "alembic_version"]
        missing = [t for t in expected if t not in tables]

        if missing:
            print(f"Warning: Missing tables: {missing}")
            return False
        else:
            print("✓ All expected tables present")
            return True

asyncio.run(verify())
"""

    with open(backend_dir / "verify_db.py", "w") as f:
        f.write(verify_script)

    if not run_command("python verify_db.py", cwd=backend_dir):
        print("Warning: Could not verify database schema")
    print()

    print("=" * 60)
    print("Migration deployment completed successfully!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Test the API: python -m app.main")
    print("2. Check database: sqlite3 4updf.db '.tables'")
    print("3. Set up file cleanup cron job")
    print()

    return 0

if __name__ == "__main__":
    sys.exit(main())
