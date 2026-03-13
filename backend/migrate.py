"""Database migration utility script"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import init_db, drop_db


async def create_tables():
    """Create all tables based on models"""
    print("Creating database tables...")
    await init_db()
    print("✓ Tables created successfully")


async def drop_tables():
    """Drop all tables - use with caution"""
    confirm = input("Are you sure you want to drop all tables? (yes/no): ")
    if confirm.lower() == "yes":
        print("Dropping all tables...")
        await drop_db()
        print("✓ Tables dropped successfully")
    else:
        print("Operation cancelled")


def main():
    if len(sys.argv) < 2:
        print("Usage: python migrate.py [create|drop]")
        print("  create - Create all database tables")
        print("  drop   - Drop all database tables")
        sys.exit(1)

    command = sys.argv[1]

    if command == "create":
        asyncio.run(create_tables())
    elif command == "drop":
        asyncio.run(drop_tables())
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
