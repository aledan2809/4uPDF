import fitz, easyocr, numpy as np, re, os, time
from PIL import Image

start = time.time()
doc = fitz.open('input/1 (2).pdf')
print(f'PDF loaded: {len(doc)} pages')

reader = easyocr.Reader(['en', 'ro'], gpu=False, verbose=False)
print(f'OCR ready ({time.time()-start:.1f}s)')

# Pattern: 'Nr. comanda:' followed by 8-digit number
pattern = r'(?:Nr\.?\s*comanda:?\s*)(\d{8})'

orders_found = []
current_order = None
current_pages = []

print('Scanning pages (pattern: Nr. comanda + 8 digits)...')
for i in range(min(30, len(doc))):
    page = doc[i]
    pw, ph = page.rect.width, page.rect.height

    # OPTIMIZATION: Only render top-right corner (right 50%, top 20%)
    clip = fitz.Rect(pw * 0.5, 0, pw, ph * 0.2)
    mat = fitz.Matrix(200/72, 200/72)  # 200 DPI is enough for numbers
    pix = page.get_pixmap(matrix=mat, clip=clip)

    img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    results = reader.readtext(img_array, detail=0)
    full_text = ' '.join(results)
    match = re.search(pattern, full_text, re.IGNORECASE)
    order_num = match.group(1) if match else None

    elapsed = time.time() - start
    marker = '>>>' if order_num else '   '
    print(f'{marker} Page {i+1} ({elapsed:.0f}s): order={order_num} | {full_text[:100]}')

    if order_num and order_num != current_order:
        if current_order is not None:
            orders_found.append((current_order, current_pages))
        current_order = order_num
        current_pages = [i]
    else:
        current_pages.append(i)

if current_order:
    orders_found.append((current_order, current_pages))

print(f'\nFound {len(orders_found)} orders in first 30 pages:')
for order, pages in orders_found:
    print(f'  Order #{order}: pages {[p+1 for p in pages]} ({len(pages)} pages)')

# Create split PDFs for first 3
os.makedirs('output', exist_ok=True)
for f in os.listdir('output'):
    if f.endswith('.pdf'):
        os.remove(f'output/{f}')

for order, pages in orders_found[:3]:
    output_path = f'output/{order}.pdf'
    new_doc = fitz.open()
    for page_idx in pages:
        new_doc.insert_pdf(doc, from_page=page_idx, to_page=page_idx)
    new_doc.save(output_path)
    new_doc.close()
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f'  Created: {output_path} ({len(pages)} pages, {size_mb:.1f} MB)')

doc.close()
total = time.time() - start
print(f'\nDone in {total:.0f}s ({total/30:.1f}s per page)')
