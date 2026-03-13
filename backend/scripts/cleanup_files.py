"""
Automated file cleanup script for 4uPDF
Deletes files older than FILE_RETENTION_HOURS and logs cleanup activity
"""

import asyncio
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from app.database import async_session_maker
from app.models.database import FileCleanupLog


async def cleanup_files():
    """Clean up old files from upload and output directories"""

    retention_hours = int(os.getenv("FILE_RETENTION_HOURS", "24"))
    upload_dir = Path(os.getenv("UPLOAD_DIR", "./uploads"))
    output_dir = Path(os.getenv("OUTPUT_DIR", "./output"))

    cutoff_time = datetime.now() - timedelta(hours=retention_hours)
    deleted_count = 0
    deleted_size = 0

    async with async_session_maker() as db:
        for directory in [upload_dir, output_dir]:
            if not directory.exists():
                continue

            for file_path in directory.rglob("*"):
                if not file_path.is_file():
                    continue

                stat = file_path.stat()
                created_time = datetime.fromtimestamp(stat.st_ctime)

                if created_time < cutoff_time:
                    try:
                        file_size = stat.st_size

                        cleanup_log = FileCleanupLog(
                            file_path=str(file_path),
                            file_size_bytes=file_size,
                            created_at=created_time,
                            reason=f"TTL expired ({retention_hours}h)"
                        )
                        db.add(cleanup_log)

                        file_path.unlink()

                        deleted_count += 1
                        deleted_size += file_size

                        print(f"✓ Deleted: {file_path.name} ({file_size / 1024:.1f} KB)")

                    except Exception as e:
                        print(f"✗ Failed to delete {file_path.name}: {e}")

        await db.commit()

    print(f"\nCleanup Summary:")
    print(f"  Files deleted: {deleted_count}")
    print(f"  Space freed: {deleted_size / (1024 * 1024):.2f} MB")
    print(f"  Cutoff time: {cutoff_time.isoformat()}")


if __name__ == "__main__":
    asyncio.run(cleanup_files())
