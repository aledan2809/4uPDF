#!/bin/bash
# Cron job script for automated file cleanup
# Add to crontab: 0 * * * * /path/to/cleanup_cron.sh

cd "$(dirname "$0")/.."

source venv/bin/activate 2>/dev/null || true

python scripts/cleanup_files.py >> logs/cleanup.log 2>&1

echo "Cleanup completed at $(date)" >> logs/cleanup.log
