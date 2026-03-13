"""
PDF Splitter by Order Number (OCR)
Splits a large scanned PDF into individual files based on order numbers
found in the top-right corner of each page.

Usage:
    python split_pdf.py input/scan.pdf
    python split_pdf.py input/scan.pdf --output output/
    python split_pdf.py input/scan.pdf --pattern "\d{4,10}"
    python split_pdf.py input/scan.pdf --dry-run
"""

import sys
import os
import re
import argparse
import fitz  # PyMuPDF
import easyocr
import numpy as np
from PIL import Image

def extract_order_number(page, reader, pattern, crop_ratio=(0.5, 0.0, 1.0, 0.2)):
    """
    OCR the top-right region of a PDF page and extract order number.

    crop_ratio: (left%, top%, right%, bottom%) - default is right half, top 20%
    """
    # Render page to image at 300 DPI for good OCR quality
    mat = fitz.Matrix(300/72, 300/72)
    pix = page.get_pixmap(matrix=mat)

    # Convert to PIL Image
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

    # Crop to top-right region
    w, h = img.size
    left = int(w * crop_ratio[0])
    top = int(h * crop_ratio[1])
    right = int(w * crop_ratio[2])
    bottom = int(h * crop_ratio[3])
    cropped = img.crop((left, top, right, bottom))

    # OCR the cropped region
    img_array = np.array(cropped)
    results = reader.readtext(img_array, detail=0)

    # Join all detected text and search for order number pattern
    full_text = " ".join(results)
    match = re.search(pattern, full_text)

    if match:
        return match.group(0), full_text

    return None, full_text


def split_pdf(input_path, output_dir, pattern, dry_run=False, crop_ratio=(0.5, 0.0, 1.0, 0.2)):
    """Split PDF into files grouped by order number."""

    if not os.path.exists(input_path):
        print(f"ERROR: File not found: {input_path}")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    print(f"Loading PDF: {input_path}")
    doc = fitz.open(input_path)
    total_pages = len(doc)
    print(f"Total pages: {total_pages}")

    print("Initializing OCR engine (first run downloads model ~100MB)...")
    reader = easyocr.Reader(['en', 'ro'], gpu=False)

    # Phase 1: Scan all pages and detect order numbers
    print("\n--- Phase 1: Scanning pages for order numbers ---")
    page_orders = []  # list of (page_index, order_number_or_None)

    for i in range(total_pages):
        page = doc[i]
        order_num, raw_text = extract_order_number(page, reader, pattern, crop_ratio)

        status = f"  Page {i+1}/{total_pages}: "
        if order_num:
            status += f"Order #{order_num}"
        else:
            status += f"No order number found (text: {raw_text[:80]}...)" if raw_text else "No text detected"
        print(status)

        page_orders.append((i, order_num))

    # Phase 2: Group pages by order number
    # Logic: when a new order number is found, start a new group.
    # Pages without an order number are appended to the previous group.
    print("\n--- Phase 2: Grouping pages ---")
    groups = {}  # order_number -> [page_indices]
    current_order = None
    orphan_pages = []

    for page_idx, order_num in page_orders:
        if order_num:
            current_order = order_num
            if current_order not in groups:
                groups[current_order] = []
            groups[current_order].append(page_idx)
        elif current_order:
            # Page without order number - belongs to current order
            groups[current_order].append(page_idx)
        else:
            # No order found yet - orphan page
            orphan_pages.append(page_idx)

    print(f"\nFound {len(groups)} orders:")
    for order, pages in groups.items():
        print(f"  Order #{order}: {len(pages)} page(s) - pages {[p+1 for p in pages]}")

    if orphan_pages:
        print(f"  Orphan pages (no order detected): {[p+1 for p in orphan_pages]}")

    if dry_run:
        print("\n[DRY RUN] No files created.")
        doc.close()
        return

    # Phase 3: Create split PDFs
    print("\n--- Phase 3: Creating split PDFs ---")
    created_files = []

    for order, pages in groups.items():
        output_path = os.path.join(output_dir, f"{order}.pdf")

        # Handle duplicate filenames
        counter = 1
        while os.path.exists(output_path):
            output_path = os.path.join(output_dir, f"{order}_{counter}.pdf")
            counter += 1

        new_doc = fitz.open()
        for page_idx in pages:
            new_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)

        new_doc.save(output_path)
        new_doc.close()
        created_files.append(output_path)
        print(f"  Created: {output_path} ({len(pages)} pages)")

    # Save orphan pages if any
    if orphan_pages:
        orphan_path = os.path.join(output_dir, "_no_order_detected.pdf")
        new_doc = fitz.open()
        for page_idx in orphan_pages:
            new_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)
        new_doc.save(orphan_path)
        new_doc.close()
        created_files.append(orphan_path)
        print(f"  Created: {orphan_path} ({len(orphan_pages)} orphan pages)")

    doc.close()
    print(f"\nDone! Created {len(created_files)} files in {output_dir}")
    return created_files


def main():
    parser = argparse.ArgumentParser(description="Split scanned PDF by order number (OCR)")
    parser.add_argument("input", help="Path to input PDF file")
    parser.add_argument("--output", "-o", default="output/", help="Output directory (default: output/)")
    parser.add_argument("--pattern", "-p", default=r"\d{4,10}",
                        help="Regex pattern for order number (default: 4-10 digit number)")
    parser.add_argument("--dry-run", "-d", action="store_true",
                        help="Scan and show results without creating files")
    parser.add_argument("--crop-left", type=float, default=0.5,
                        help="Left edge of crop region as ratio (default: 0.5 = right half)")
    parser.add_argument("--crop-top", type=float, default=0.0,
                        help="Top edge of crop region as ratio (default: 0.0)")
    parser.add_argument("--crop-right", type=float, default=1.0,
                        help="Right edge of crop region as ratio (default: 1.0)")
    parser.add_argument("--crop-bottom", type=float, default=0.2,
                        help="Bottom edge of crop region as ratio (default: 0.2 = top 20%)")

    args = parser.parse_args()

    crop_ratio = (args.crop_left, args.crop_top, args.crop_right, args.crop_bottom)

    split_pdf(args.input, args.output, args.pattern, args.dry_run, crop_ratio)


if __name__ == "__main__":
    main()
