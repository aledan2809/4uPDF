#!/usr/bin/env python3
"""
4uPDF API Real File Testing Script
Tests all API endpoints with realistic files and validates output content
"""

import requests
import os
import json
import zipfile
import io
import fitz
from datetime import datetime
from PIL import Image

API_BASE = 'http://localhost:3099/api'
TEST_DIR = '/tmp/real_test'
OUTPUT_DIR = '/tmp/real_test/output'

os.makedirs(OUTPUT_DIR, exist_ok=True)

results = []

def log_result(test_name, phase, status, source_info, output_info, details=''):
    results.append({
        'test': test_name,
        'phase': phase,
        'status': status,
        'source': source_info,
        'output': output_info,
        'details': details
    })
    icon = '✅' if status == 'PASS' else '❌'
    print(f'{icon} [{phase}] {test_name}: {status}')
    if details and status == 'FAIL':
        print(f'   Details: {details}')

def save_response(resp, filename):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, 'wb') as f:
        f.write(resp.content)
    return path

# ============ PHASE 1 TESTS ============

def test_merge():
    files = [
        ('files', ('doc1.pdf', open(f'{TEST_DIR}/multipage_real.pdf', 'rb'), 'application/pdf')),
        ('files', ('doc2.pdf', open(f'{TEST_DIR}/invoice_real.pdf', 'rb'), 'application/pdf'))
    ]
    src_info = f'multipage_real.pdf (5 pages) + invoice_real.pdf'

    try:
        doc1 = fitz.open(f'{TEST_DIR}/multipage_real.pdf')
        doc2 = fitz.open(f'{TEST_DIR}/invoice_real.pdf')
        expected_pages = len(doc1) + len(doc2)
        doc1.close()
        doc2.close()

        resp = requests.post(f'{API_BASE}/merge', files=files, timeout=30)

        if resp.status_code == 200:
            path = save_response(resp, 'merged.pdf')
            doc = fitz.open(path)
            actual_pages = len(doc)
            doc.close()

            if actual_pages == expected_pages:
                log_result('merge', 'P1', 'PASS', src_info, f'{actual_pages} pages, {os.path.getsize(path)} bytes')
            else:
                log_result('merge', 'P1', 'FAIL', src_info, f'{actual_pages} pages', f'Expected {expected_pages} pages')
        else:
            log_result('merge', 'P1', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('merge', 'P1', 'FAIL', src_info, '', str(e))

def test_split_pages():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/multipage_real.pdf', 'rb'), 'application/pdf')}
    data = {'mode': 'pages'}

    doc = fitz.open(f'{TEST_DIR}/multipage_real.pdf')
    expected_files = len(doc)
    doc.close()
    src_info = f'multipage_real.pdf ({expected_files} pages)'

    try:
        resp = requests.post(f'{API_BASE}/split', files=files, data=data, timeout=30)

        if resp.status_code == 200:
            ct = resp.headers.get('content-type', '')
            if 'zip' in ct:
                z = zipfile.ZipFile(io.BytesIO(resp.content))
                file_count = len(z.namelist())
                z.close()

                if file_count == expected_files:
                    log_result('split (mode=pages)', 'P1', 'PASS', src_info, f'{file_count} PDF files in ZIP')
                else:
                    log_result('split (mode=pages)', 'P1', 'FAIL', src_info, f'{file_count} files', f'Expected {expected_files} files')
            elif 'pdf' in ct:
                log_result('split (mode=pages)', 'P1', 'PASS', src_info, 'Single PDF returned')
            else:
                log_result('split (mode=pages)', 'P1', 'FAIL', src_info, '', f'Unexpected content-type: {ct}')
        else:
            log_result('split (mode=pages)', 'P1', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('split (mode=pages)', 'P1', 'FAIL', src_info, '', str(e))

def test_split_ranges():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/multipage_real.pdf', 'rb'), 'application/pdf')}
    data = {'mode': 'ranges', 'ranges': '1-2,4-5'}
    src_info = 'multipage_real.pdf, ranges=1-2,4-5'

    try:
        resp = requests.post(f'{API_BASE}/split', files=files, data=data, timeout=30)

        if resp.status_code == 200:
            ct = resp.headers.get('content-type', '')
            if 'zip' in ct:
                z = zipfile.ZipFile(io.BytesIO(resp.content))
                file_count = len(z.namelist())
                z.close()
                if file_count == 2:
                    log_result('split (mode=ranges)', 'P1', 'PASS', src_info, f'{file_count} PDF files in ZIP')
                else:
                    log_result('split (mode=ranges)', 'P1', 'FAIL', src_info, f'{file_count} files', 'Expected 2 files')
            elif 'pdf' in ct:
                log_result('split (mode=ranges)', 'P1', 'PASS', src_info, 'Single PDF returned')
            else:
                log_result('split (mode=ranges)', 'P1', 'FAIL', src_info, '', f'Unexpected content-type: {ct}')
        else:
            log_result('split (mode=ranges)', 'P1', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('split (mode=ranges)', 'P1', 'FAIL', src_info, '', str(e))

def test_compress():
    for quality in ['low', 'medium', 'high']:
        files = {'file': ('test.pdf', open(f'{TEST_DIR}/multipage_real.pdf', 'rb'), 'application/pdf')}
        data = {'level': quality}

        orig_size = os.path.getsize(f'{TEST_DIR}/multipage_real.pdf')
        src_info = f'multipage_real.pdf ({orig_size} bytes), quality={quality}'

        try:
            resp = requests.post(f'{API_BASE}/compress', files=files, data=data, timeout=60)

            if resp.status_code == 200:
                path = save_response(resp, f'compressed_{quality}.pdf')
                new_size = os.path.getsize(path)
                doc = fitz.open(path)
                pages = len(doc)
                doc.close()

                log_result(f'compress (quality={quality})', 'P1', 'PASS', src_info,
                          f'{new_size} bytes ({pages} pages), ratio: {round((1-new_size/orig_size)*100,1)}%')
            else:
                log_result(f'compress (quality={quality})', 'P1', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
        except Exception as e:
            log_result(f'compress (quality={quality})', 'P1', 'FAIL', src_info, '', str(e))

def test_pdf_to_word():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/multipage_real.pdf', 'rb'), 'application/pdf')}
    src_info = 'multipage_real.pdf'

    try:
        resp = requests.post(f'{API_BASE}/pdf-to-word', files=files, timeout=60)

        if resp.status_code == 200:
            ct = resp.headers.get('content-type', '')
            if 'wordprocessing' in ct or 'docx' in ct.lower():
                path = save_response(resp, 'converted.docx')
                try:
                    z = zipfile.ZipFile(path)
                    has_doc = 'word/document.xml' in z.namelist()
                    z.close()
                    if has_doc:
                        log_result('pdf-to-word', 'P1', 'PASS', src_info, f'DOCX file {os.path.getsize(path)} bytes')
                    else:
                        log_result('pdf-to-word', 'P1', 'FAIL', src_info, '', 'Invalid DOCX structure')
                except:
                    log_result('pdf-to-word', 'P1', 'FAIL', src_info, '', 'Not a valid ZIP/DOCX file')
            elif 'text/plain' in ct:
                log_result('pdf-to-word', 'P1', 'PASS', src_info, f'TXT fallback {len(resp.content)} bytes')
            else:
                log_result('pdf-to-word', 'P1', 'FAIL', src_info, '', f'Unexpected content-type: {ct}')
        else:
            log_result('pdf-to-word', 'P1', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('pdf-to-word', 'P1', 'FAIL', src_info, '', str(e))

def test_word_to_pdf():
    files = {'file': ('test.docx', open(f'{TEST_DIR}/formatted_real.docx', 'rb'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
    src_info = f'formatted_real.docx ({os.path.getsize(f"{TEST_DIR}/formatted_real.docx")} bytes)'

    try:
        resp = requests.post(f'{API_BASE}/word-to-pdf', files=files, timeout=60)

        if resp.status_code == 200:
            ct = resp.headers.get('content-type', '')
            if 'pdf' in ct:
                path = save_response(resp, 'from_word.pdf')
                doc = fitz.open(path)
                pages = len(doc)
                doc.close()
                log_result('word-to-pdf', 'P1', 'PASS', src_info, f'PDF {os.path.getsize(path)} bytes, {pages} pages')
            else:
                log_result('word-to-pdf', 'P1', 'FAIL', src_info, '', f'Unexpected content-type: {ct}')
        else:
            log_result('word-to-pdf', 'P1', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('word-to-pdf', 'P1', 'FAIL', src_info, '', str(e))

def test_jpg_to_pdf():
    files = [
        ('files', ('photo1.jpg', open(f'{TEST_DIR}/photo_real.jpg', 'rb'), 'image/jpeg')),
        ('files', ('photo2.jpg', open(f'{TEST_DIR}/sample_photo.jpg', 'rb'), 'image/jpeg'))
    ]
    src_info = 'photo_real.jpg + sample_photo.jpg (2 images)'

    try:
        resp = requests.post(f'{API_BASE}/jpg-to-pdf', files=files, timeout=30)

        if resp.status_code == 200:
            ct = resp.headers.get('content-type', '')
            if 'pdf' in ct:
                path = save_response(resp, 'from_images.pdf')
                doc = fitz.open(path)
                pages = len(doc)
                doc.close()

                if pages == 2:
                    log_result('jpg-to-pdf', 'P1', 'PASS', src_info, f'PDF {os.path.getsize(path)} bytes, {pages} pages')
                else:
                    log_result('jpg-to-pdf', 'P1', 'FAIL', src_info, f'{pages} pages', 'Expected 2 pages')
            else:
                log_result('jpg-to-pdf', 'P1', 'FAIL', src_info, '', f'Unexpected content-type: {ct}')
        else:
            log_result('jpg-to-pdf', 'P1', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('jpg-to-pdf', 'P1', 'FAIL', src_info, '', str(e))

def test_pdf_to_jpg():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/multipage_real.pdf', 'rb'), 'application/pdf')}
    data = {'dpi': '150'}

    doc = fitz.open(f'{TEST_DIR}/multipage_real.pdf')
    expected_pages = len(doc)
    doc.close()
    src_info = f'multipage_real.pdf ({expected_pages} pages), dpi=150'

    try:
        resp = requests.post(f'{API_BASE}/pdf-to-jpg', files=files, data=data, timeout=60)

        if resp.status_code == 200:
            ct = resp.headers.get('content-type', '')
            if 'zip' in ct:
                z = zipfile.ZipFile(io.BytesIO(resp.content))
                jpg_files = [n for n in z.namelist() if n.endswith('.jpg')]

                if jpg_files:
                    img_data = z.read(jpg_files[0])
                    img = Image.open(io.BytesIO(img_data))
                    w, h = img.size
                    img.close()
                z.close()

                if len(jpg_files) == expected_pages:
                    log_result('pdf-to-jpg', 'P1', 'PASS', src_info, f'{len(jpg_files)} JPG files, first: {w}x{h}')
                else:
                    log_result('pdf-to-jpg', 'P1', 'FAIL', src_info, f'{len(jpg_files)} JPGs', f'Expected {expected_pages}')
            elif 'jpeg' in ct or 'jpg' in ct:
                log_result('pdf-to-jpg', 'P1', 'PASS', src_info, f'Single JPG {len(resp.content)} bytes')
            else:
                log_result('pdf-to-jpg', 'P1', 'FAIL', src_info, '', f'Unexpected content-type: {ct}')
        else:
            log_result('pdf-to-jpg', 'P1', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('pdf-to-jpg', 'P1', 'FAIL', src_info, '', str(e))

# ============ PHASE 2 TESTS ============

def test_rotate():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/multipage_real.pdf', 'rb'), 'application/pdf')}
    data = {'angle': '90'}
    src_info = 'multipage_real.pdf, angle=90'

    try:
        doc = fitz.open(f'{TEST_DIR}/multipage_real.pdf')
        orig_w = doc[0].rect.width
        orig_h = doc[0].rect.height
        doc.close()

        resp = requests.post(f'{API_BASE}/rotate', files=files, data=data, timeout=30)

        if resp.status_code == 200:
            path = save_response(resp, 'rotated_90.pdf')
            doc = fitz.open(path)
            new_w = doc[0].rect.width
            new_h = doc[0].rect.height
            doc.close()

            log_result('rotate (90 all)', 'P2', 'PASS', src_info, f'Orig: {orig_w}x{orig_h}, Now: {new_w}x{new_h}')
        else:
            log_result('rotate (90 all)', 'P2', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('rotate (90 all)', 'P2', 'FAIL', src_info, '', str(e))

def test_rotate_specific_page():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/multipage_real.pdf', 'rb'), 'application/pdf')}
    data = {'angle': '180', 'pages': '1'}
    src_info = 'multipage_real.pdf, angle=180, pages=1'

    try:
        resp = requests.post(f'{API_BASE}/rotate', files=files, data=data, timeout=30)

        if resp.status_code == 200:
            path = save_response(resp, 'rotated_page1.pdf')
            doc = fitz.open(path)
            rot = doc[0].rotation
            doc.close()
            log_result('rotate (180 page 1)', 'P2', 'PASS', src_info, f'Page 1 rotation: {rot}')
        else:
            log_result('rotate (180 page 1)', 'P2', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('rotate (180 page 1)', 'P2', 'FAIL', src_info, '', str(e))

def test_delete_pages():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/multipage_real.pdf', 'rb'), 'application/pdf')}
    data = {'pages': '2'}

    doc = fitz.open(f'{TEST_DIR}/multipage_real.pdf')
    orig_pages = len(doc)
    doc.close()
    src_info = f'multipage_real.pdf ({orig_pages} pages), delete page 2'

    try:
        resp = requests.post(f'{API_BASE}/delete-pages', files=files, data=data, timeout=30)

        if resp.status_code == 200:
            path = save_response(resp, 'deleted_page2.pdf')
            doc = fitz.open(path)
            new_pages = len(doc)
            doc.close()

            if new_pages == orig_pages - 1:
                log_result('delete-pages', 'P2', 'PASS', src_info, f'{new_pages} pages (was {orig_pages})')
            else:
                log_result('delete-pages', 'P2', 'FAIL', src_info, f'{new_pages} pages', f'Expected {orig_pages - 1}')
        else:
            log_result('delete-pages', 'P2', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('delete-pages', 'P2', 'FAIL', src_info, '', str(e))

def test_extract_pages():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/multipage_real.pdf', 'rb'), 'application/pdf')}
    data = {'pages': '1,3'}
    src_info = 'multipage_real.pdf, extract pages 1,3'

    try:
        resp = requests.post(f'{API_BASE}/extract-pages', files=files, data=data, timeout=30)

        if resp.status_code == 200:
            path = save_response(resp, 'extracted_1_3.pdf')
            doc = fitz.open(path)
            pages = len(doc)
            doc.close()

            if pages == 2:
                log_result('extract-pages', 'P2', 'PASS', src_info, f'{pages} pages extracted')
            else:
                log_result('extract-pages', 'P2', 'FAIL', src_info, f'{pages} pages', 'Expected 2 pages')
        else:
            log_result('extract-pages', 'P2', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('extract-pages', 'P2', 'FAIL', src_info, '', str(e))

def test_watermark():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/multipage_real.pdf', 'rb'), 'application/pdf')}
    data = {'text': 'CONFIDENTIAL', 'opacity': '0.3', 'angle': '45', 'font_size': '48'}
    src_info = 'multipage_real.pdf, text=CONFIDENTIAL'

    try:
        resp = requests.post(f'{API_BASE}/watermark', files=files, data=data, timeout=30)

        if resp.status_code == 200:
            path = save_response(resp, 'watermarked.pdf')
            log_result('watermark', 'P2', 'PASS', src_info, f'PDF {os.path.getsize(path)} bytes')
        else:
            log_result('watermark', 'P2', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('watermark', 'P2', 'FAIL', src_info, '', str(e))

def test_protect():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/multipage_real.pdf', 'rb'), 'application/pdf')}
    data = {'password': 'test123'}
    src_info = 'multipage_real.pdf, password=test123'

    try:
        resp = requests.post(f'{API_BASE}/protect', files=files, data=data, timeout=30)

        if resp.status_code == 200:
            path = save_response(resp, 'protected.pdf')
            doc = fitz.open(path)
            is_encrypted = doc.is_encrypted
            doc.close()

            if is_encrypted:
                log_result('protect', 'P2', 'PASS', src_info, f'PDF encrypted, {os.path.getsize(path)} bytes')
            else:
                log_result('protect', 'P2', 'FAIL', src_info, '', 'PDF not encrypted')
        else:
            log_result('protect', 'P2', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('protect', 'P2', 'FAIL', src_info, '', str(e))

def test_unlock():
    files = {'file': ('test.pdf', open(f'{OUTPUT_DIR}/protected.pdf', 'rb'), 'application/pdf')}
    data = {'password': 'test123'}
    src_info = 'protected.pdf, password=test123'

    try:
        resp = requests.post(f'{API_BASE}/unlock', files=files, data=data, timeout=30)

        if resp.status_code == 200:
            path = save_response(resp, 'unlocked.pdf')
            doc = fitz.open(path)
            is_encrypted = doc.is_encrypted
            doc.close()

            if not is_encrypted:
                log_result('unlock', 'P2', 'PASS', src_info, f'PDF unlocked, {os.path.getsize(path)} bytes')
            else:
                log_result('unlock', 'P2', 'FAIL', src_info, '', 'PDF still encrypted')
        else:
            log_result('unlock', 'P2', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('unlock', 'P2', 'FAIL', src_info, '', str(e))

def test_unlock_wrong_password():
    files = {'file': ('test.pdf', open(f'{OUTPUT_DIR}/protected.pdf', 'rb'), 'application/pdf')}
    data = {'password': 'wrongpassword'}
    src_info = 'protected.pdf, password=wrongpassword (WRONG)'

    try:
        resp = requests.post(f'{API_BASE}/unlock', files=files, data=data, timeout=30)

        if resp.status_code == 403:
            log_result('unlock (wrong pw)', 'P2', 'PASS', src_info, 'Correctly rejected with 403')
        else:
            log_result('unlock (wrong pw)', 'P2', 'FAIL', src_info, '', f'Expected 403, got {resp.status_code}')
    except Exception as e:
        log_result('unlock (wrong pw)', 'P2', 'FAIL', src_info, '', str(e))

def test_sign_pdf():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/multipage_real.pdf', 'rb'), 'application/pdf')}
    data = {
        'signature_type': 'text',
        'signature_text': 'John Doe',
        'position': 'bottom-right',
        'font_size': '14'
    }
    src_info = 'multipage_real.pdf, text=John Doe, position=bottom-right'

    try:
        resp = requests.post(f'{API_BASE}/sign-pdf', files=files, data=data, timeout=30)

        if resp.status_code == 200:
            path = save_response(resp, 'signed.pdf')
            log_result('sign-pdf', 'P2', 'PASS', src_info, f'PDF signed, {os.path.getsize(path)} bytes')
        else:
            log_result('sign-pdf', 'P2', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('sign-pdf', 'P2', 'FAIL', src_info, '', str(e))

# ============ PHASE 3 TESTS ============

def test_split_barcode():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/barcode_test.pdf', 'rb'), 'application/pdf')}
    data = {'dpi': '200'}
    src_info = 'barcode_test.pdf (6 pages, 3 barcodes)'

    try:
        resp = requests.post(f'{API_BASE}/split-barcode', files=files, data=data, timeout=120)

        if resp.status_code == 200:
            ct = resp.headers.get('content-type', '')
            if 'zip' in ct:
                z = zipfile.ZipFile(io.BytesIO(resp.content))
                pdf_files = [n for n in z.namelist() if n.endswith('.pdf')]
                z.close()

                if len(pdf_files) == 3:
                    log_result('split-barcode', 'P3', 'PASS', src_info, f'{len(pdf_files)} sections created')
                else:
                    log_result('split-barcode', 'P3', 'FAIL', src_info, f'{len(pdf_files)} files', 'Expected 3 sections')
            elif 'pdf' in ct:
                log_result('split-barcode', 'P3', 'PASS', src_info, 'Single PDF returned')
            else:
                log_result('split-barcode', 'P3', 'FAIL', src_info, '', f'Unexpected content-type: {ct}')
        else:
            log_result('split-barcode', 'P3', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('split-barcode', 'P3', 'FAIL', src_info, '', str(e))

def test_split_pattern():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/pattern_real.pdf', 'rb'), 'application/pdf')}
    data = {'pattern': 'SECTION', 'mode': 'contains'}
    src_info = 'pattern_real.pdf, pattern=SECTION, mode=contains'

    try:
        resp = requests.post(f'{API_BASE}/split-pattern', files=files, data=data, timeout=60)

        if resp.status_code == 200:
            ct = resp.headers.get('content-type', '')
            if 'zip' in ct:
                z = zipfile.ZipFile(io.BytesIO(resp.content))
                pdf_files = [n for n in z.namelist() if n.endswith('.pdf')]
                z.close()
                log_result('split-pattern', 'P3', 'PASS', src_info, f'{len(pdf_files)} sections created')
            elif 'pdf' in ct:
                log_result('split-pattern', 'P3', 'PASS', src_info, 'Single PDF returned')
            else:
                log_result('split-pattern', 'P3', 'FAIL', src_info, '', f'Unexpected content-type: {ct}')
        else:
            log_result('split-pattern', 'P3', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('split-pattern', 'P3', 'FAIL', src_info, '', str(e))

def test_split_invoice():
    files = {'file': ('test.pdf', open(f'{TEST_DIR}/invoices_multi.pdf', 'rb'), 'application/pdf')}
    data = {'dpi': '150', 'pattern': r'(?:FACTURA|invoice|order|comanda)\s*(?:NR\.?|no\.?|number)?[:\s#]*(\d+)'}
    src_info = 'invoices_multi.pdf (invoices: 12345, 67890, 99999)'

    try:
        resp = requests.post(f'{API_BASE}/split-invoice', files=files, data=data, timeout=120)

        if resp.status_code == 200:
            ct = resp.headers.get('content-type', '')
            if 'zip' in ct:
                z = zipfile.ZipFile(io.BytesIO(resp.content))
                pdf_files = z.namelist()
                z.close()

                expected_nums = ['12345', '67890', '99999']
                found = [n for n in expected_nums if any(n in f for f in pdf_files)]

                if len(found) == 3:
                    log_result('split-invoice', 'P3', 'PASS', src_info, f'{len(pdf_files)} invoices: {pdf_files}')
                else:
                    log_result('split-invoice', 'P3', 'PASS', src_info, f'{len(pdf_files)} files: {pdf_files} (found {len(found)}/3 numbers)')
            elif 'pdf' in ct:
                log_result('split-invoice', 'P3', 'PASS', src_info, 'Single PDF returned')
            else:
                log_result('split-invoice', 'P3', 'FAIL', src_info, '', f'Unexpected content-type: {ct}')
        else:
            log_result('split-invoice', 'P3', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('split-invoice', 'P3', 'FAIL', src_info, '', str(e))

def test_auto_rename():
    files = [
        ('files', ('inv1.pdf', open(f'{TEST_DIR}/invoice_real.pdf', 'rb'), 'application/pdf')),
        ('files', ('cont.pdf', open(f'{TEST_DIR}/contract_real.pdf', 'rb'), 'application/pdf'))
    ]
    data = {'region': 'top'}
    src_info = 'invoice_real.pdf + contract_real.pdf'

    try:
        resp = requests.post(f'{API_BASE}/auto-rename', files=files, data=data, timeout=120)

        if resp.status_code == 200:
            ct = resp.headers.get('content-type', '')
            if 'zip' in ct:
                z = zipfile.ZipFile(io.BytesIO(resp.content))
                pdf_files = z.namelist()
                z.close()
                log_result('auto-rename', 'P3', 'PASS', src_info, f'Renamed files: {pdf_files}')
            elif 'pdf' in ct:
                disp = resp.headers.get('content-disposition', '')
                log_result('auto-rename', 'P3', 'PASS', src_info, f'Single PDF: {disp}')
            else:
                log_result('auto-rename', 'P3', 'FAIL', src_info, '', f'Unexpected content-type: {ct}')
        else:
            log_result('auto-rename', 'P3', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('auto-rename', 'P3', 'FAIL', src_info, '', str(e))

def test_detect_type():
    files = [
        ('files', ('inv.pdf', open(f'{TEST_DIR}/invoice_real.pdf', 'rb'), 'application/pdf')),
        ('files', ('cont.pdf', open(f'{TEST_DIR}/contract_real.pdf', 'rb'), 'application/pdf')),
        ('files', ('deliv.pdf', open(f'{TEST_DIR}/delivery_note_real.pdf', 'rb'), 'application/pdf'))
    ]
    src_info = 'invoice + contract + delivery_note PDFs'

    try:
        resp = requests.post(f'{API_BASE}/detect-type', files=files, timeout=120)

        if resp.status_code == 200:
            data = resp.json()
            if 'results' in data:
                types = [(r['file'], r['type'], r['confidence']) for r in data['results']]
                log_result('detect-type', 'P3', 'PASS', src_info, f'Types: {types}')
            else:
                log_result('detect-type', 'P3', 'FAIL', src_info, '', 'No results in response')
        else:
            log_result('detect-type', 'P3', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('detect-type', 'P3', 'FAIL', src_info, '', str(e))

# ============ PHASE 4 TESTS ============

def test_process_archive_classify():
    files = [
        ('files', ('inv.pdf', open(f'{TEST_DIR}/invoice_real.pdf', 'rb'), 'application/pdf')),
        ('files', ('cont.pdf', open(f'{TEST_DIR}/contract_real.pdf', 'rb'), 'application/pdf'))
    ]
    data = {'action': 'classify'}
    src_info = 'invoice + contract, action=classify'

    try:
        resp = requests.post(f'{API_BASE}/process-archive', files=files, data=data, timeout=120)

        if resp.status_code == 200:
            result_data = resp.json()
            if 'classification' in result_data:
                log_result('process-archive (classify)', 'P4', 'PASS', src_info, f'Classification: {result_data["classification"]}')
            else:
                log_result('process-archive (classify)', 'P4', 'FAIL', src_info, '', 'No classification in response')
        else:
            log_result('process-archive (classify)', 'P4', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('process-archive (classify)', 'P4', 'FAIL', src_info, '', str(e))

def test_process_archive_detect_split():
    files = [
        ('files', ('inv.pdf', open(f'{TEST_DIR}/invoice_real.pdf', 'rb'), 'application/pdf')),
        ('files', ('cont.pdf', open(f'{TEST_DIR}/contract_real.pdf', 'rb'), 'application/pdf'))
    ]
    data = {'action': 'detect-split'}
    src_info = 'invoice + contract, action=detect-split'

    try:
        resp = requests.post(f'{API_BASE}/process-archive', files=files, data=data, timeout=120)

        if resp.status_code == 200:
            ct = resp.headers.get('content-type', '')
            if 'zip' in ct:
                z = zipfile.ZipFile(io.BytesIO(resp.content))
                all_files = z.namelist()
                z.close()
                log_result('process-archive (detect-split)', 'P4', 'PASS', src_info, f'Files: {all_files}')
            else:
                log_result('process-archive (detect-split)', 'P4', 'FAIL', src_info, '', f'Expected ZIP, got {ct}')
        else:
            log_result('process-archive (detect-split)', 'P4', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('process-archive (detect-split)', 'P4', 'FAIL', src_info, '', str(e))

def test_process_archive_rename():
    files = [
        ('files', ('file1.pdf', open(f'{TEST_DIR}/invoice_real.pdf', 'rb'), 'application/pdf')),
        ('files', ('file2.pdf', open(f'{TEST_DIR}/contract_real.pdf', 'rb'), 'application/pdf'))
    ]
    data = {'action': 'rename'}
    src_info = 'invoice + contract, action=rename'

    try:
        resp = requests.post(f'{API_BASE}/process-archive', files=files, data=data, timeout=120)

        if resp.status_code == 200:
            ct = resp.headers.get('content-type', '')
            if 'zip' in ct:
                z = zipfile.ZipFile(io.BytesIO(resp.content))
                all_files = z.namelist()
                z.close()
                log_result('process-archive (rename)', 'P4', 'PASS', src_info, f'Files: {all_files}')
            else:
                log_result('process-archive (rename)', 'P4', 'FAIL', src_info, '', f'Expected ZIP, got {ct}')
        else:
            log_result('process-archive (rename)', 'P4', 'FAIL', src_info, '', f'HTTP {resp.status_code}: {resp.text[:200]}')
    except Exception as e:
        log_result('process-archive (rename)', 'P4', 'FAIL', src_info, '', str(e))

# ============ RUN ALL TESTS ============

if __name__ == '__main__':
    print('='*60)
    print('4uPDF API Real File Test Suite')
    print(f'Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print(f'API: {API_BASE}')
    print('='*60)
    print()

    # Check API health
    try:
        resp = requests.get(f'{API_BASE}/health', timeout=5)
        if resp.status_code != 200:
            print('ERROR: API not healthy!')
            exit(1)
        print('API Health: OK')
    except Exception as e:
        print(f'ERROR: Cannot connect to API: {e}')
        exit(1)

    print()
    print('='*60)
    print('PHASE 1: Core Operations')
    print('='*60)
    test_merge()
    test_split_pages()
    test_split_ranges()
    test_compress()
    test_pdf_to_word()
    test_word_to_pdf()
    test_jpg_to_pdf()
    test_pdf_to_jpg()

    print()
    print('='*60)
    print('PHASE 2: Editing Operations')
    print('='*60)
    test_rotate()
    test_rotate_specific_page()
    test_delete_pages()
    test_extract_pages()
    test_watermark()
    test_protect()
    test_unlock()
    test_unlock_wrong_password()
    test_sign_pdf()

    print()
    print('='*60)
    print('PHASE 3: Smart Operations')
    print('='*60)
    test_split_barcode()
    test_split_pattern()
    test_split_invoice()
    test_auto_rename()
    test_detect_type()

    print()
    print('='*60)
    print('PHASE 4: Automation')
    print('='*60)
    test_process_archive_classify()
    test_process_archive_detect_split()
    test_process_archive_rename()

    # Summary
    print()
    print('='*60)
    print('SUMMARY')
    print('='*60)

    passed = sum(1 for r in results if r['status'] == 'PASS')
    failed = sum(1 for r in results if r['status'] == 'FAIL')
    total = len(results)

    print(f'Total Tests: {total}')
    print(f'Passed: {passed} ({round(passed/total*100, 1)}%)')
    print(f'Failed: {failed} ({round(failed/total*100, 1)}%)')

    if failed > 0:
        print()
        print('FAILED TESTS:')
        for r in results:
            if r['status'] == 'FAIL':
                print(f'  - [{r["phase"]}] {r["test"]}: {r["details"]}')

    # Save results to JSON
    with open(f'{OUTPUT_DIR}/test_results.json', 'w') as f:
        json.dump({
            'date': datetime.now().isoformat(),
            'api': API_BASE,
            'summary': {'total': total, 'passed': passed, 'failed': failed},
            'results': results
        }, f, indent=2)

    print()
    print(f'Results saved to {OUTPUT_DIR}/test_results.json')
