"""
File validation and security checks for uploads
"""

try:
    import magic
    HAS_MAGIC = True
except (ImportError, OSError):
    HAS_MAGIC = False
import os
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException

ALLOWED_MIME_TYPES = {
    'pdf': ['application/pdf'],
    'image': [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp',
        'image/tiff',
        'image/bmp'
    ],
    'word': [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ],
    'excel': [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ],
    'powerpoint': [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint'
    ],
    'text': ['text/plain']
}

MAX_FILE_SIZE = {
    'free': 10 * 1024 * 1024,      # 10 MB
    'bronze': 50 * 1024 * 1024,    # 50 MB
    'silver': 100 * 1024 * 1024,   # 100 MB
    'gold': 500 * 1024 * 1024      # 500 MB
}

def get_file_mime_type(file_content: bytes) -> str:
    """Detect actual MIME type from file content using libmagic."""
    if not HAS_MAGIC:
        import mimetypes
        # Fallback: check PDF magic bytes
        if file_content[:5] == b'%PDF-':
            return 'application/pdf'
        if file_content[:4] == b'\x89PNG':
            return 'image/png'
        if file_content[:3] in (b'\xff\xd8\xff',):
            return 'image/jpeg'
        if file_content[:4] == b'PK\x03\x04':
            return 'application/zip'
        return "application/octet-stream"
    try:
        mime = magic.Magic(mime=True)
        return mime.from_buffer(file_content)
    except Exception:
        return "application/octet-stream"

def validate_file_type(
    file_content: bytes,
    allowed_types: list,
    filename: str
) -> Tuple[bool, Optional[str]]:
    """
    Validate file type matches allowed types.

    Args:
        file_content: File bytes
        allowed_types: List of allowed MIME types
        filename: Original filename

    Returns:
        Tuple of (is_valid, error_message)
    """
    actual_mime = get_file_mime_type(file_content)

    if actual_mime not in allowed_types:
        extension = os.path.splitext(filename)[1].lower()
        return False, f"Invalid file type. Expected one of {allowed_types}, got {actual_mime} for {extension} file"

    return True, None

def validate_file_size(
    file_size: int,
    user_plan: str = "free"
) -> Tuple[bool, Optional[str]]:
    """
    Validate file size is within plan limits.

    Args:
        file_size: Size of file in bytes
        user_plan: User's subscription plan

    Returns:
        Tuple of (is_valid, error_message)
    """
    max_size = MAX_FILE_SIZE.get(user_plan.lower(), MAX_FILE_SIZE['free'])

    if file_size > max_size:
        max_mb = max_size / (1024 * 1024)
        actual_mb = file_size / (1024 * 1024)
        return False, f"File size ({actual_mb:.1f}MB) exceeds plan limit ({max_mb:.0f}MB)"

    return True, None

def sanitize_filename(filename: str) -> str:
    """Remove potentially dangerous characters from filename."""
    import re

    name = os.path.basename(filename)

    name = re.sub(r'[^\w\s\-\.]', '', name)
    name = re.sub(r'\.{2,}', '.', name)
    name = name.strip('. ')

    if not name:
        name = "file.pdf"

    return name

async def validate_upload(
    file: UploadFile,
    file_type: str,
    user_plan: str = "free",
    max_size: Optional[int] = None
) -> bytes:
    """
    Validate uploaded file for security and compliance.

    Args:
        file: FastAPI UploadFile object
        file_type: Expected file type category (pdf, image, word, etc)
        user_plan: User's subscription plan
        max_size: Optional custom max size override

    Returns:
        File content as bytes

    Raises:
        HTTPException: If validation fails
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="Empty file provided")

    if max_size:
        size_limit = max_size
    else:
        size_limit = MAX_FILE_SIZE.get(user_plan.lower(), MAX_FILE_SIZE['free'])

    valid_size, size_error = validate_file_size(len(content), user_plan)
    if not valid_size:
        raise HTTPException(status_code=413, detail=size_error)

    allowed_types = ALLOWED_MIME_TYPES.get(file_type, [])
    if allowed_types:
        valid_type, type_error = validate_file_type(
            content,
            allowed_types,
            file.filename or "unknown"
        )
        if not valid_type:
            raise HTTPException(status_code=400, detail=type_error)

    return content
