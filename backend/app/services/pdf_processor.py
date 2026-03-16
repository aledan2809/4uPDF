"""
PDF processing services for all tool operations
"""

import fitz
from pathlib import Path
from typing import List
from PIL import Image
import io


def merge_pdfs(input_paths: List[Path], output_path: Path):
    """Merge multiple PDF files into one."""
    merged_doc = fitz.open()

    for pdf_path in input_paths:
        pdf = fitz.open(pdf_path)
        merged_doc.insert_pdf(pdf)
        pdf.close()

    merged_doc.save(output_path)
    merged_doc.close()


def split_pdf(input_path: Path, output_dir: Path, job_id: str, ranges: str, mode: str) -> List[Path]:
    """Split PDF by pages or ranges."""
    doc = fitz.open(input_path)
    total_pages = len(doc)
    output_files = []

    if ranges == "all" or mode == "pages":
        for i in range(total_pages):
            output_path = output_dir / f"{job_id}_page_{i + 1}.pdf"
            new_doc = fitz.open()
            new_doc.insert_pdf(doc, from_page=i, to_page=i)
            new_doc.save(output_path)
            new_doc.close()
            output_files.append(output_path)
    else:
        range_parts = ranges.split(',')
        for idx, range_str in enumerate(range_parts, 1):
            if '-' in range_str:
                start, end = map(int, range_str.split('-'))
                start = max(1, start) - 1
                end = min(total_pages, end) - 1
            else:
                start = end = int(range_str) - 1

            output_path = output_dir / f"{job_id}_part_{idx}.pdf"
            new_doc = fitz.open()
            new_doc.insert_pdf(doc, from_page=start, to_page=end)
            new_doc.save(output_path)
            new_doc.close()
            output_files.append(output_path)

    doc.close()
    return output_files


def compress_pdf(input_path: Path, output_path: Path, quality: str):
    """Compress PDF by reducing image quality."""
    doc = fitz.open(input_path)

    quality_map = {
        "low": 50,
        "medium": 75,
        "high": 90
    }
    img_quality = quality_map.get(quality, 75)

    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images()

        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]

            pil_image = Image.open(io.BytesIO(image_bytes))

            compressed_bytes = io.BytesIO()
            pil_image.save(compressed_bytes, format="JPEG", quality=img_quality, optimize=True)
            compressed_bytes.seek(0)

            doc._deleteObject(xref)
            page.insert_image(page.rect, stream=compressed_bytes.read())

    doc.save(output_path, garbage=4, deflate=True)
    doc.close()


def pdf_to_word(input_path: Path, output_path: Path):
    """Convert PDF to Word (basic text extraction)."""
    from docx import Document

    doc = fitz.open(input_path)
    word_doc = Document()

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        word_doc.add_paragraph(text)
        if page_num < len(doc) - 1:
            word_doc.add_page_break()

    doc.close()
    word_doc.save(output_path)


def word_to_pdf(input_path: Path, output_path: Path):
    """Convert Word to PDF."""
    import docx2pdf
    docx2pdf.convert(str(input_path), str(output_path))


def jpg_to_pdf(input_paths: List[Path], output_path: Path):
    """Convert JPG/PNG images to PDF."""
    doc = fitz.open()

    for img_path in input_paths:
        img = Image.open(img_path)
        img_rgb = img.convert('RGB')

        img_bytes = io.BytesIO()
        img_rgb.save(img_bytes, format='PDF')
        img_bytes.seek(0)

        img_pdf = fitz.open(stream=img_bytes, filetype="pdf")
        doc.insert_pdf(img_pdf)
        img_pdf.close()

    doc.save(output_path)
    doc.close()


def pdf_to_jpg(input_path: Path, output_dir: Path, job_id: str, dpi: int, pages: str) -> List[Path]:
    """Convert PDF pages to JPG images."""
    doc = fitz.open(input_path)
    total_pages = len(doc)
    output_files = []

    if pages == "all":
        page_indices = range(total_pages)
    else:
        page_indices = []
        for part in pages.split(','):
            if '-' in part:
                start, end = map(int, part.split('-'))
                page_indices.extend(range(start - 1, min(end, total_pages)))
            else:
                page_indices.append(int(part) - 1)

    for page_num in page_indices:
        page = doc[page_num]
        mat = fitz.Matrix(dpi / 72, dpi / 72)
        pix = page.get_pixmap(matrix=mat)

        output_path = output_dir / f"{job_id}_page_{page_num + 1}.jpg"
        pix.save(output_path)
        output_files.append(output_path)

    doc.close()
    return output_files
