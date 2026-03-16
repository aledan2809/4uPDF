import fitz, numpy as np, re, time
from rapidocr_onnxruntime import RapidOCR

start = time.time()
doc = fitz.open('input/1 (2).pdf')
print(f'PDF loaded: {len(doc)} pages ({time.time()-start:.1f}s)')

ocr = RapidOCR()
print(f'OCR engine ready ({time.time()-start:.1f}s)')

pattern = r'(?:Nr\.?\s*comanda:?\s*)(\d{8})'

print('\nScanning first 10 pages...')
for i in range(min(10, len(doc))):
    page = doc[i]
    pw, ph = page.rect.width, page.rect.height

    # Only render top-right corner at 150 DPI
    clip = fitz.Rect(pw * 0.5, 0, pw, ph * 0.2)
    mat = fitz.Matrix(150/72, 150/72)
    pix = page.get_pixmap(matrix=mat, clip=clip)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)

    result, _ = ocr(img)
    texts = [r[1] for r in result] if result else []
    full_text = ' '.join(texts)

    match = re.search(pattern, full_text, re.IGNORECASE)
    order_num = match.group(1) if match else None

    elapsed = time.time() - start
    marker = '>>>' if order_num else '   '
    print(f'{marker} Page {i+1} ({elapsed:.1f}s): order={order_num} | {full_text[:120]}')

doc.close()
total = time.time() - start
pages_done = min(10, len(doc))
print(f'\nDone in {total:.0f}s ({total/pages_done:.1f}s per page)')
print(f'Estimated for 767 pages: {total/pages_done * 767 / 60:.0f} minutes')
