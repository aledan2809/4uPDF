"""Verify: create split PDFs in output2/ and compare with output/"""
import fitz
import numpy as np
import re
import os
import time
import hashlib
from rapidocr_onnxruntime import RapidOCR

start = time.time()
doc = fitz.open('input/1 (2).pdf')
total = len(doc)
print(f'PDF: {total} pages')

ocr = RapidOCR()
print(f'OCR ready ({time.time()-start:.1f}s)')

pattern = r'(?:Nr\.?\s*comanda:?\s*)(\d{8})'

# Scan first 30 pages
orders_found = []
current_order = None
current_pages = []

print('\n--- Scanning first 30 pages ---')
for i in range(min(30, total)):
    page = doc[i]
    pw, ph = page.rect.width, page.rect.height
    clip = fitz.Rect(pw * 0.5, 0, pw, ph * 0.2)
    mat = fitz.Matrix(150 / 72, 150 / 72)
    pix = page.get_pixmap(matrix=mat, clip=clip)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)

    result, _ = ocr(img)
    texts = [r[1] for r in result] if result else []
    full_text = ' '.join(texts)
    match = re.search(pattern, full_text, re.IGNORECASE)
    order_num = match.group(1) if match else None

    marker = '>>>' if order_num else '   '
    print(f'{marker} Page {i+1} ({time.time()-start:.0f}s): order={order_num}')

    if order_num and order_num != current_order:
        if current_order is not None:
            orders_found.append((current_order, current_pages))
        current_order = order_num
        current_pages = [i]
    else:
        current_pages.append(i)

if current_order:
    orders_found.append((current_order, current_pages))

print(f'\n--- Found {len(orders_found)} orders ---')
for order, pages in orders_found:
    print(f'  #{order}: pages {[p+1 for p in pages]}')

# Create in output2/
os.makedirs('output2', exist_ok=True)
for order, pages in orders_found[:3]:
    path = f'output2/{order}.pdf'
    new_doc = fitz.open()
    for idx in pages:
        new_doc.insert_pdf(doc, from_page=idx, to_page=idx)
    new_doc.save(path)
    new_doc.close()
    print(f'  Created: {path} ({len(pages)} pages)')

doc.close()

# Compare output/ vs output2/
print('\n--- Comparison: output/ vs output2/ ---')
for f in sorted(os.listdir('output2')):
    if not f.endswith('.pdf'):
        continue
    path1 = f'output/{f}'
    path2 = f'output2/{f}'

    if not os.path.exists(path1):
        print(f'  {f}: MISSING in output/')
        continue

    size1 = os.path.getsize(path1)
    size2 = os.path.getsize(path2)

    with open(path1, 'rb') as fh:
        hash1 = hashlib.md5(fh.read()).hexdigest()
    with open(path2, 'rb') as fh:
        hash2 = hashlib.md5(fh.read()).hexdigest()

    # Compare page counts
    doc1 = fitz.open(path1)
    doc2 = fitz.open(path2)
    pages1 = len(doc1)
    pages2 = len(doc2)
    doc1.close()
    doc2.close()

    match_str = 'MATCH' if pages1 == pages2 else 'MISMATCH'
    print(f'  {f}: output={pages1}p/{size1}B  output2={pages2}p/{size2}B  pages={match_str}  md5={"SAME" if hash1 == hash2 else "DIFF"}')

print(f'\nDone in {time.time()-start:.0f}s')
