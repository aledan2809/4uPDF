"""
API Routes for 4uPDF Tools
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from typing import List, Optional
import os
import uuid
import time
from pathlib import Path
import io
import zipfile

from .services.pdf_processor import (
    merge_pdfs,
    split_pdf,
    compress_pdf,
    pdf_to_word,
    word_to_pdf,
    jpg_to_pdf,
    pdf_to_jpg
)
from .services.ocr_splitter import ocr_split_pdf, get_split_status
from .models.responses import (
    JobResponse,
    StatusResponse,
    MergeResponse,
    SplitResponse,
    CompressResponse,
    ConvertResponse
)

router = APIRouter(prefix="/api", tags=["tools"])

UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("output")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

jobs = {}


@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "timestamp": time.time()}


@router.post("/merge", response_model=MergeResponse)
async def merge_pdf_files(
    files: List[UploadFile] = File(...),
    output_name: str = Form("merged.pdf")
):
    """Merge multiple PDF files into one."""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 files required")

    for file in files:
        if not file.filename:
            raise HTTPException(status_code=400, detail="File has no filename")
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail=f"Invalid file type: {file.filename}")

    job_id = str(uuid.uuid4())[:8]
    saved_files = []

    try:
        for file in files:
            content = await file.read()
            if len(content) == 0:
                raise HTTPException(status_code=400, detail=f"Empty file: {file.filename}")
            if len(content) > 50 * 1024 * 1024:
                raise HTTPException(status_code=413, detail=f"File too large: {file.filename}. Maximum 50MB per file")

            temp_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
            with open(temp_path, "wb") as f:
                f.write(content)
            saved_files.append(temp_path)

        output_path = OUTPUT_DIR / f"{job_id}_{output_name}"
        merge_pdfs(saved_files, output_path)

        file_size = output_path.stat().st_size

        for temp_file in saved_files:
            temp_file.unlink()

        return MergeResponse(
            job_id=job_id,
            status="completed",
            output_file=output_path.name,
            file_size=file_size,
            download_url=f"/api/download/{output_path.name}"
        )

    except HTTPException:
        raise
    except Exception as e:
        for temp_file in saved_files:
            if temp_file.exists():
                temp_file.unlink()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/split", response_model=SplitResponse)
async def split_pdf_file(
    file: UploadFile = File(...),
    ranges: str = Form("all"),
    mode: str = Form("pages")
):
    """Split PDF file by pages or ranges."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type")

    if mode not in ["pages", "ranges"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Must be 'pages' or 'ranges'")

    job_id = str(uuid.uuid4())[:8]
    input_path = UPLOAD_DIR / f"{job_id}_{file.filename}"

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty PDF file")
        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum 50MB")

        with open(input_path, "wb") as f:
            f.write(content)

        output_files = split_pdf(input_path, OUTPUT_DIR, job_id, ranges, mode)

        input_path.unlink()

        return SplitResponse(
            job_id=job_id,
            status="completed",
            output_files=[f.name for f in output_files],
            file_count=len(output_files),
            download_url=f"/api/download-zip/{job_id}"
        )

    except HTTPException:
        raise
    except Exception as e:
        if input_path.exists():
            input_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/split-ocr", response_model=JobResponse)
async def split_pdf_by_order(
    file: UploadFile = File(...),
    pattern: str = Form(r"(?:Order\s*(?:No\.?|#|:)?\s*)(\d{8})"),
    crop_left: float = Form(0.5),
    crop_top: float = Form(0.0),
    crop_right: float = Form(1.0),
    crop_bottom: float = Form(0.2),
    dpi: int = Form(150),
    filename_template: str = Form("{order}")
):
    """Split PDF by order number using OCR (async job)."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type")

    if dpi < 72 or dpi > 600:
        raise HTTPException(status_code=400, detail="DPI must be between 72 and 600")

    if crop_left < 0 or crop_left > 1 or crop_right < 0 or crop_right > 1:
        raise HTTPException(status_code=400, detail="Crop horizontal values must be between 0 and 1")

    if crop_top < 0 or crop_top > 1 or crop_bottom < 0 or crop_bottom > 1:
        raise HTTPException(status_code=400, detail="Crop vertical values must be between 0 and 1")

    if crop_left >= crop_right:
        raise HTTPException(status_code=400, detail="crop_left must be less than crop_right")

    if crop_top >= crop_bottom:
        raise HTTPException(status_code=400, detail="crop_top must be less than crop_bottom")

    job_id = str(uuid.uuid4())[:8]
    input_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
    output_dir = OUTPUT_DIR / job_id

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty PDF file")
        if len(content) > 100 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum 100MB")

        with open(input_path, "wb") as f:
            f.write(content)

        crop_config = {
            "left": crop_left,
            "top": crop_top,
            "right": crop_right,
            "bottom": crop_bottom
        }

        ocr_split_pdf(
            job_id=job_id,
            input_path=str(input_path),
            output_dir=str(output_dir),
            pattern=pattern,
            crop_config=crop_config,
            dpi=dpi,
            filename_template=filename_template,
            jobs_dict=jobs
        )

        return JobResponse(job_id=job_id, status="started")

    except HTTPException:
        raise
    except Exception as e:
        if input_path.exists():
            input_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{job_id}", response_model=StatusResponse)
def get_job_status(job_id: str):
    """Get status of an async job (OCR split)."""
    status = get_split_status(job_id, jobs)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    return StatusResponse(**status)


@router.post("/compress", response_model=CompressResponse)
async def compress_pdf_file(
    file: UploadFile = File(...),
    quality: str = Form("medium")
):
    """Compress PDF file."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type")

    if quality not in ["low", "medium", "high"]:
        raise HTTPException(status_code=400, detail="Invalid quality. Must be 'low', 'medium', or 'high'")

    job_id = str(uuid.uuid4())[:8]
    input_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
    output_path = OUTPUT_DIR / f"{job_id}_compressed.pdf"

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty PDF file")
        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum 50MB")

        with open(input_path, "wb") as f:
            f.write(content)

        original_size = input_path.stat().st_size
        compress_pdf(input_path, output_path, quality)
        compressed_size = output_path.stat().st_size

        input_path.unlink()

        return CompressResponse(
            job_id=job_id,
            status="completed",
            output_file=output_path.name,
            original_size=original_size,
            compressed_size=compressed_size,
            compression_ratio=round((1 - compressed_size / original_size) * 100, 1),
            download_url=f"/api/download/{output_path.name}"
        )

    except HTTPException:
        raise
    except Exception as e:
        if input_path.exists():
            input_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pdf-to-word", response_model=ConvertResponse)
async def convert_pdf_to_word(file: UploadFile = File(...)):
    """Convert PDF to Word document."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type")

    job_id = str(uuid.uuid4())[:8]
    input_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
    output_path = OUTPUT_DIR / f"{job_id}_{Path(file.filename).stem}.docx"

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty PDF file")
        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum 50MB")

        with open(input_path, "wb") as f:
            f.write(content)

        pdf_to_word(input_path, output_path)

        input_path.unlink()

        return ConvertResponse(
            job_id=job_id,
            status="completed",
            output_file=output_path.name,
            file_size=output_path.stat().st_size,
            download_url=f"/api/download/{output_path.name}"
        )

    except HTTPException:
        raise
    except Exception as e:
        if input_path.exists():
            input_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/word-to-pdf", response_model=ConvertResponse)
async def convert_word_to_pdf(file: UploadFile = File(...)):
    """Convert Word document to PDF."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    valid_extensions = ['.doc', '.docx']
    if not any(file.filename.lower().endswith(ext) for ext in valid_extensions):
        raise HTTPException(status_code=400, detail="Invalid file type")

    job_id = str(uuid.uuid4())[:8]
    input_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
    output_path = OUTPUT_DIR / f"{job_id}_{Path(file.filename).stem}.pdf"

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum 50MB")

        with open(input_path, "wb") as f:
            f.write(content)

        word_to_pdf(input_path, output_path)

        input_path.unlink()

        return ConvertResponse(
            job_id=job_id,
            status="completed",
            output_file=output_path.name,
            file_size=output_path.stat().st_size,
            download_url=f"/api/download/{output_path.name}"
        )

    except HTTPException:
        raise
    except Exception as e:
        if input_path.exists():
            input_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/jpg-to-pdf", response_model=ConvertResponse)
async def convert_jpg_to_pdf(
    files: List[UploadFile] = File(...),
    output_name: str = Form("images.pdf")
):
    """Convert JPG/PNG images to PDF."""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    if len(files) < 1:
        raise HTTPException(status_code=400, detail="At least 1 image required")

    job_id = str(uuid.uuid4())[:8]
    saved_files = []

    try:
        for file in files:
            if not file.filename:
                raise HTTPException(status_code=400, detail="File has no filename")

            ext = Path(file.filename).suffix.lower()
            if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.bmp']:
                raise HTTPException(status_code=400, detail=f"Invalid file type: {file.filename}")

            content = await file.read()
            if len(content) == 0:
                raise HTTPException(status_code=400, detail=f"Empty file: {file.filename}")
            if len(content) > 50 * 1024 * 1024:
                raise HTTPException(status_code=413, detail=f"File too large: {file.filename}. Maximum 50MB per file")

            temp_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
            with open(temp_path, "wb") as f:
                f.write(content)
            saved_files.append(temp_path)

        output_path = OUTPUT_DIR / f"{job_id}_{output_name}"
        jpg_to_pdf(saved_files, output_path)

        for temp_file in saved_files:
            temp_file.unlink()

        return ConvertResponse(
            job_id=job_id,
            status="completed",
            output_file=output_path.name,
            file_size=output_path.stat().st_size,
            download_url=f"/api/download/{output_path.name}"
        )

    except HTTPException:
        raise
    except Exception as e:
        for temp_file in saved_files:
            if temp_file.exists():
                temp_file.unlink()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pdf-to-jpg", response_model=SplitResponse)
async def convert_pdf_to_jpg(
    file: UploadFile = File(...),
    dpi: int = Form(150),
    pages: str = Form("all")
):
    """Convert PDF pages to JPG images."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file type")

    if dpi < 72 or dpi > 600:
        raise HTTPException(status_code=400, detail="DPI must be between 72 and 600")

    job_id = str(uuid.uuid4())[:8]
    input_path = UPLOAD_DIR / f"{job_id}_{file.filename}"

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty PDF file")
        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum 50MB")

        with open(input_path, "wb") as f:
            f.write(content)

        output_files = pdf_to_jpg(input_path, OUTPUT_DIR, job_id, dpi, pages)

        input_path.unlink()

        return SplitResponse(
            job_id=job_id,
            status="completed",
            output_files=[f.name for f in output_files],
            file_count=len(output_files),
            download_url=f"/api/download-zip/{job_id}"
        )

    except HTTPException:
        raise
    except Exception as e:
        if input_path.exists():
            input_path.unlink()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{filename}")
def download_file(filename: str):
    """Download a processed file."""
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/octet-stream"
    )


@router.get("/download-zip/{job_id}")
def download_zip(job_id: str):
    """Download multiple files as ZIP."""
    job_files = list(OUTPUT_DIR.glob(f"{job_id}_*"))

    if not job_files:
        job_dir = OUTPUT_DIR / job_id
        if job_dir.exists():
            job_files = list(job_dir.glob("*.pdf"))

    if not job_files:
        raise HTTPException(status_code=404, detail="No files found for this job")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in job_files:
            zf.write(file_path, file_path.name)

    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={job_id}.zip"}
    )


@router.get("/jobs")
def list_jobs():
    """List all jobs."""
    return [
        {
            "id": j["id"],
            "status": j["status"],
            "started_at": j["started_at"],
            "total_pages": j.get("total_pages", 0),
            "orders_found": j.get("orders_found", 0)
        }
        for j in jobs.values()
    ]
