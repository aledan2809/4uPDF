"""
4uPDF API - FastAPI backend
Splits scanned PDFs by order number using OCR (RapidOCR)
"""

import fitz
import numpy as np
import re
import os
import json
import time
import uuid
import threading
import zipfile
import io
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from rapidocr_onnxruntime import RapidOCR

app = FastAPI(title="4uPDF")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Global state for jobs
jobs = {}
ocr_engine = None

def get_ocr():
    global ocr_engine
    if ocr_engine is None:
        ocr_engine = RapidOCR()
    return ocr_engine


def extract_order_from_page(page, ocr, pattern, crop_left=0.5, crop_top=0.0, crop_right=1.0, crop_bottom=0.2, dpi=150):
    """OCR the specified region of a PDF page and extract order number."""
    pw, ph = page.rect.width, page.rect.height
    clip = fitz.Rect(pw * crop_left, ph * crop_top, pw * crop_right, ph * crop_bottom)
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    pix = page.get_pixmap(matrix=mat, clip=clip)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)

    result, _ = ocr(img)
    texts = [r[1] for r in result] if result else []
    full_text = ' '.join(texts)

    match = re.search(pattern, full_text, re.IGNORECASE)
    order_num = match.group(1) if match else None

    return order_num, full_text


def process_pdf_job(job_id, input_path, output_dir, pattern, crop_config, dpi, filename_template="{order}"):
    """Background job to process a PDF."""
    job = jobs[job_id]
    try:
        ocr = get_ocr()
        doc = fitz.open(input_path)
        total_pages = len(doc)
        job["total_pages"] = total_pages
        job["status"] = "scanning"

        # Phase 1: Scan all pages
        page_orders = []
        for i in range(total_pages):
            page = doc[i]
            order_num, raw_text = extract_order_from_page(
                page, ocr, pattern,
                crop_config["left"], crop_config["top"],
                crop_config["right"], crop_config["bottom"],
                dpi
            )
            page_orders.append((i, order_num))
            job["current_page"] = i + 1
            job["log"].append({
                "page": i + 1,
                "order": order_num,
                "text": raw_text[:150]
            })

        # Phase 2: Group pages
        job["status"] = "grouping"
        groups = {}
        current_order = None
        orphan_pages = []

        for page_idx, order_num in page_orders:
            if order_num and order_num != current_order:
                current_order = order_num
                if current_order not in groups:
                    groups[current_order] = []
                groups[current_order].append(page_idx)
            elif current_order:
                groups[current_order].append(page_idx)
            else:
                orphan_pages.append(page_idx)

        job["orders_found"] = len(groups)
        job["groups"] = {k: [p + 1 for p in v] for k, v in groups.items()}

        # Phase 3: Create split PDFs
        job["status"] = "splitting"
        os.makedirs(output_dir, exist_ok=True)
        created = []

        for idx, (order, pages) in enumerate(groups.items(), 1):
            fname = filename_template.replace("{order}", order).replace("{pages}", str(len(pages))).replace("{index}", str(idx))
            output_path = os.path.join(output_dir, f"{fname}.pdf")
            counter = 1
            while os.path.exists(output_path):
                output_path = os.path.join(output_dir, f"{fname}_{counter}.pdf")
                counter += 1

            new_doc = fitz.open()
            for page_idx in pages:
                new_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)
            new_doc.save(output_path)
            new_doc.close()

            file_info = {
                "name": os.path.basename(output_path),
                "path": output_path,
                "order": order,
                "pages": len(pages),
                "size_mb": round(os.path.getsize(output_path) / (1024 * 1024), 2)
            }
            created.append(file_info)

        if orphan_pages:
            orphan_path = os.path.join(output_dir, "_no_order_detected.pdf")
            new_doc = fitz.open()
            for page_idx in orphan_pages:
                new_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)
            new_doc.save(orphan_path)
            new_doc.close()
            created.append({
                "name": "_no_order_detected.pdf",
                "path": orphan_path,
                "order": "N/A",
                "pages": len(orphan_pages),
                "size_mb": round(os.path.getsize(orphan_path) / (1024 * 1024), 2)
            })

        doc.close()
        job["status"] = "done"
        job["files"] = created
        job["finished_at"] = time.time()

    except Exception as e:
        job["status"] = "error"
        job["error"] = str(e)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/split-ocr")
async def start_split(
    file: UploadFile = File(None),
    input_path: str = Form(None),
    output_dir: str = Form("output"),
    pattern: str = Form(r"(?:Nr\.?\s*comanda:?\s*)(\d{8})"),
    crop_left: float = Form(0.5),
    crop_top: float = Form(0.0),
    crop_right: float = Form(1.0),
    crop_bottom: float = Form(0.2),
    dpi: int = Form(150),
    filename_template: str = Form("{order}")
):
    """Start a PDF split job."""
    # Handle file upload or path
    if file and file.filename:
        os.makedirs("uploads", exist_ok=True)
        save_path = os.path.join("uploads", file.filename)
        with open(save_path, "wb") as f:
            content = await file.read()
            f.write(content)
        input_path = save_path
    elif not input_path:
        return JSONResponse({"error": "No file or input_path provided"}, status_code=400)

    if not os.path.exists(input_path):
        return JSONResponse({"error": f"File not found: {input_path}"}, status_code=404)

    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "id": job_id,
        "status": "starting",
        "input": input_path,
        "output_dir": output_dir,
        "total_pages": 0,
        "current_page": 0,
        "orders_found": 0,
        "groups": {},
        "files": [],
        "log": [],
        "started_at": time.time(),
        "finished_at": None,
        "error": None
    }

    crop_config = {
        "left": crop_left,
        "top": crop_top,
        "right": crop_right,
        "bottom": crop_bottom
    }

    thread = threading.Thread(
        target=process_pdf_job,
        args=(job_id, input_path, output_dir, pattern, crop_config, dpi, filename_template),
        daemon=True
    )
    thread.start()

    return {"job_id": job_id, "status": "started"}


@app.get("/api/status/{job_id}")
def get_status(job_id: str):
    """Get job status and progress."""
    if job_id not in jobs:
        return JSONResponse({"error": "Job not found"}, status_code=404)

    job = jobs[job_id]
    progress = 0
    if job["total_pages"] > 0:
        progress = round(job["current_page"] / job["total_pages"] * 100, 1)

    elapsed = time.time() - job["started_at"]
    eta = 0
    if job["current_page"] > 0 and job["status"] == "scanning":
        per_page = elapsed / job["current_page"]
        remaining = job["total_pages"] - job["current_page"]
        eta = round(per_page * remaining)

    return {
        "id": job["id"],
        "status": job["status"],
        "progress": progress,
        "current_page": job["current_page"],
        "total_pages": job["total_pages"],
        "orders_found": job["orders_found"],
        "elapsed_seconds": round(elapsed),
        "eta_seconds": eta,
        "files": job["files"],
        "groups": job["groups"],
        "error": job["error"],
        "recent_log": job["log"][-5:] if job["log"] else []
    }


@app.get("/api/jobs")
def list_jobs():
    """List all jobs."""
    return [
        {
            "id": j["id"],
            "status": j["status"],
            "input": j["input"],
            "total_pages": j["total_pages"],
            "orders_found": j["orders_found"],
            "started_at": j["started_at"]
        }
        for j in jobs.values()
    ]


@app.get("/api/download/{filename}")
def download_file(filename: str, output_dir: str = "output"):
    """Download a split PDF file."""
    path = os.path.join(output_dir, filename)
    if not os.path.exists(path):
        return JSONResponse({"error": "File not found"}, status_code=404)
    return FileResponse(path, filename=filename, media_type="application/pdf")


@app.get("/api/browse")
def browse_folder(path: str = "."):
    """Browse filesystem for input/output folder selection."""
    try:
        p = Path(path).resolve()
        if not p.exists():
            return JSONResponse({"error": "Path not found"}, status_code=404)

        items = []
        if p.parent != p:
            items.append({"name": "..", "type": "dir", "path": str(p.parent)})

        for item in sorted(p.iterdir()):
            try:
                if item.is_dir():
                    items.append({"name": item.name, "type": "dir", "path": str(item)})
                elif item.suffix.lower() == '.pdf':
                    size_mb = round(item.stat().st_size / (1024 * 1024), 2)
                    items.append({"name": item.name, "type": "pdf", "path": str(item), "size_mb": size_mb})
            except PermissionError:
                continue

        return {"current": str(p), "items": items}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/download-all")
def download_all(output_dir: str = "output"):
    """Download all split PDFs as a ZIP file."""
    p = Path(output_dir)
    if not p.exists():
        return JSONResponse({"error": "Output directory not found"}, status_code=404)

    pdfs = list(p.glob("*.pdf"))
    if not pdfs:
        return JSONResponse({"error": "No PDF files found"}, status_code=404)

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for pdf in pdfs:
            zf.write(pdf, pdf.name)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=split-pdfs.zip"}
    )


@app.get("/api/defaults")
def get_defaults():
    """Return server-appropriate default paths."""
    base = Path(__file__).parent.resolve()
    input_dir = base / "input"
    output_dir = base / "output"
    input_dir.mkdir(exist_ok=True)
    output_dir.mkdir(exist_ok=True)
    return {
        "inputPath": str(input_dir),
        "outputDir": str(output_dir),
    }


# Include Phase 1 tool routes (merge, split, compress, convert)
from routes import router as tools_router
app.include_router(tools_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    print("Starting 4uPDF API on http://localhost:3099")
    uvicorn.run(app, host="0.0.0.0", port=3099)
