"""
OCR-based PDF splitting service
"""

import fitz
import numpy as np
import re
import os
import time
import threading
from pathlib import Path
from rapidocr_onnxruntime import RapidOCR


ocr_engine = None


def get_ocr():
    """Get or initialize OCR engine."""
    global ocr_engine
    if ocr_engine is None:
        ocr_engine = RapidOCR()
    return ocr_engine


def extract_order_from_page(page, ocr, pattern, crop_left, crop_top, crop_right, crop_bottom, dpi):
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


def process_pdf_job(job_id, input_path, output_dir, pattern, crop_config, dpi, filename_template, jobs):
    """Background job to process a PDF."""
    job = jobs[job_id]
    try:
        ocr = get_ocr()
        doc = fitz.open(input_path)
        total_pages = len(doc)
        job["total_pages"] = total_pages
        job["status"] = "scanning"

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


def ocr_split_pdf(job_id, input_path, output_dir, pattern, crop_config, dpi, filename_template, jobs_dict):
    """Start OCR split job in background thread."""
    jobs_dict[job_id] = {
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

    thread = threading.Thread(
        target=process_pdf_job,
        args=(job_id, input_path, output_dir, pattern, crop_config, dpi, filename_template, jobs_dict),
        daemon=True
    )
    thread.start()


def get_split_status(job_id, jobs):
    """Get status of OCR split job."""
    if job_id not in jobs:
        return None

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
