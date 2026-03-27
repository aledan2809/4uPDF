"""
Initialize the superadmin user in the database.
Run once during deploy: python -m scripts.init_superadmin
"""

import sys
import uuid
import sqlite3
from pathlib import Path

import bcrypt

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "4updf.db"

SUPERADMIN_EMAIL = "admin@4updf.com"
SUPERADMIN_PASSWORD = "Admin4uPDF2026!"


def init_superadmin():
    if not DB_PATH.exists():
        print(f"[ERROR] Database not found at {DB_PATH}. Start the server first to create it.")
        sys.exit(1)

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Check if superadmin already exists
    cursor.execute("SELECT id, role FROM users WHERE email = ?", (SUPERADMIN_EMAIL,))
    existing = cursor.fetchone()

    password_hash = bcrypt.hashpw(SUPERADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    if existing:
        # Update existing user to superadmin
        cursor.execute(
            "UPDATE users SET password_hash = ?, role = 'superadmin' WHERE email = ?",
            (password_hash, SUPERADMIN_EMAIL),
        )
        print(f"[OK] Updated existing user {SUPERADMIN_EMAIL} to superadmin with new password.")
    else:
        # Create new superadmin user
        user_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO users (id, email, password_hash, plan, role) VALUES (?, ?, ?, 'free', 'superadmin')",
            (user_id, SUPERADMIN_EMAIL, password_hash),
        )
        print(f"[OK] Created superadmin user: {SUPERADMIN_EMAIL} (id: {user_id})")

    conn.commit()
    conn.close()
    print(f"[OK] SuperAdmin ready. Login at /superadmin/login with email: {SUPERADMIN_EMAIL}")


if __name__ == "__main__":
    init_superadmin()
