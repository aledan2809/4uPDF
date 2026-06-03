# 4uPDF Audit Fix Summary

**Initial Audit:** 2026-04-16
**Re-Audit:** 2026-04-18
**Scope:** All modules except OCR-split (NO-TOUCH)
**Files modified:** `api.py`, `routes.py`

---

## Round 1 Critical Fixes (4) — 2026-04-16

### VULN-001: Path Traversal in `/api/download/{filename}` (first endpoint)
- **Before:** Filename passed directly to `os.path.join()` without validation
- **Fix:** Added filename sanitization via `Path(filename).name`, path resolution, and directory containment check
- **Lines changed:** 2366-2378

### VULN-002: Path Traversal in `/api/browse`
- **Before:** Any filesystem path could be browsed
- **Fix:** Restricted browsing to application root directory

### VULN-003: Path Traversal in `/api/download-all`
- **Before:** `output_dir` parameter could point to any directory
- **Fix:** Added path containment check against application root

### VULN-004: Unvalidated Integer Parsing in Split Operations
- **Before:** `int()` conversions without validation
- **Fix:** Added try/except ValueError, positive integer checks, range validation

---

## Round 2 Critical Fix (1) — 2026-04-18

### VULN-005: Path Traversal in `/api/download/{filename}` (SECOND endpoint — download_output)
- **Before:** The duplicate download endpoint at `download_output()` function (line ~3972) was missed in round 1. It directly joined user-supplied filename with OUTPUT_DIR without path traversal prevention
- **Fix:** Added identical path traversal prevention: `Path(filename).name` sanitization, `..` rejection, `resolve()` + `startswith()` containment check. Also added missing MIME types (xlsx, json, csv, pptx) and made the old output directory fallback safe
- **Lines changed:** 3972-4002

---

## Round 1 High Fixes (6) — 2026-04-16

### VULN-006: Negative Index in Merge Order
- **Fix:** Changed to `if 0 <= i < len(saved_files)` at 2 locations

### VULN-007: Bare `except:` Clauses
- **Fix:** Replaced all 53 instances with `except Exception:`

### VULN-008: Error Messages Exposing Internal Details
- **Fix:** All 43 instances now log via `logger.exception()` and return generic message

### VULN-009: Overly Permissive CORS
- **Fix:** Explicit header list replaces wildcard `["*"]`

### VULN-010: Missing Auth on Job Status (ACCEPTED)
- **Status:** Accepted — job IDs are random hex, endpoints expose only status

### VULN-011: Filename Injection in FileResponse
- **Fix:** Resolved as part of VULN-001

---

## Round 2 High Fixes (3) — 2026-04-18

### VULN-012: doc.page_count after doc.close()
- **Before:** In `process_single_pdf_for_archive()` and `extract_invoice_data()`, `doc.page_count` was accessed after `doc.close()`
- **Fix:** Stored `page_count = doc.page_count` before `doc.close()` in both functions

### VULN-013: Sign PDF Endpoint Error Leak
- **Before:** `/api/sign-pdf` raised `HTTPException(detail=f"Signature failed: {str(e)}")`
- **Fix:** Replaced with `logger.exception("Processing error")` + generic error message

### VULN-014: Banned Users Can Access API
- **Before:** `is_banned` flag existed in users table but was never checked
- **Fix:** Added ban check in `get_current_user_required()`

---

## Round 3 High Fixes (2) — 2026-04-18

### VULN-015: Error Messages Exposing Internals in routes.py
- **Before:** 20 instances of `detail=f"...{str(e)}"` in routes.py leaking file paths, library versions, and stack traces to clients. The previous audit rounds only fixed api.py but missed routes.py entirely
- **Fix:** Added `logging` import and logger to routes.py. All 20 instances now use `logger.exception()` + generic error message
- **Lines changed:** 20 error handlers + 2 lines for import/logger setup

### VULN-016: Missing File Size Validation in save_upload_file()
- **Before:** `save_upload_file()` used `shutil.copyfileobj()` with no size limit, allowing arbitrarily large files to fill disk
- **Fix:** Replaced with streaming chunk-based write (1MB chunks) with 500MB hard limit. If exceeded, partially written file is deleted and HTTP 413 returned
- **Lines changed:** api.py save_upload_file (replaced 7 lines with 16 lines)

---

## Round 2 Medium Fixes (2) — 2026-04-18

### VULN-023: Unbounded Job Dict Memory Growth
- **Before:** Global `jobs`, `batch_jobs`, and `batch_processing_jobs` dicts grew indefinitely
- **Fix:** Added job eviction to `cleanup_old_files()` — removes completed/errored jobs older than 24 hours

### VULN-027: Duplicate Imports
- **Fix:** Removed duplicate import block

---

## Round 3 Medium Fixes (3) — 2026-04-18

### VULN-024: Resource Leak in detect-type Endpoint (routes.py)
- **Before:** `len(fitz.open(stream=io.BytesIO(content), filetype="pdf"))` called inline — leaked file descriptor per request
- **Fix:** Store document in variable, get page count, close document properly
- **Lines changed:** routes.py:1084 (1 line replaced with 3 lines)

### VULN-025: Flatten PDF Not Actually Flattening
- **Before:** `annot.set_flags(fitz.PDF_ANNOT_IS_HIDDEN)` only hid annotations (reversible)
- **Fix:** Uses redaction-based approach to render annotations into page content permanently via `page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)`
- **Lines changed:** api.py:4957-4962 (4 lines replaced with 7 lines)

### VULN-026: Import Error Detail Leak in PowerPoint Endpoint
- **Before:** `detail=f"python-pptx and Pillow are required: {e}"` leaked ImportError details
- **Fix:** Changed to static message: `"python-pptx and Pillow are required for PowerPoint conversion"`

---

## Medium Issues — Documented, Not Fixed

| ID | Issue | Justification |
|----|-------|---------------|
| VULN-017 | SQL f-string interpolation | Hardcoded values, not user input |
| VULN-018 | SQLite check_same_thread=False | db_session() creates per-operation connections |
| VULN-019 | JWT secret random fallback | Production uses .env |
| VULN-020 | X-Forwarded-For spoofing | Behind nginx in production |
| VULN-021 | Dual admin auth path | Handles empty string safely |
| VULN-022 | No batch total size limit | Individual file size limited |

---

## Low Issues — Documented, Not Fixed

| ID | Issue | Justification |
|----|-------|---------------|
| VULN-028 | Generic JSON exception handling | Valid fallback behavior |
| VULN-029 | No HSTS headers in app | Configured at nginx level |
| VULN-030 | Stripe webhook secret dependency | Fails closed |
| VULN-031 | Missing rate limiting on some endpoints | nginx baseline protection |

---

## Round 4 Critical Fixes (2) — 2026-04-18

### VULN-032: ZIP Extraction Path Traversal in Batch Split-Invoices
- **Before:** `zf.extractall(str(extract_dir))` called without validating member paths — malicious ZIP entries like `../../../etc/passwd` could write files outside the extraction directory
- **Fix:** Added pre-extraction validation: each ZIP member path is resolved and verified to stay within the extraction directory. If path traversal detected, HTTP 400 returned
- **Lines changed:** api.py:5929 (1 line replaced with 5 lines)

### VULN-033: ZIP Extraction Path Traversal in Archive Processor
- **Before:** `zip_ref.extractall(temp_dir)` called without path validation in the `/api/batch/archive-processor` endpoint
- **Fix:** Added identical pre-extraction validation with `Path.resolve()` + `startswith()` containment check. Sets job status to error if traversal detected
- **Lines changed:** api.py:6924 (1 line replaced with 7 lines)

---

## Round 4 High Fixes (3) — 2026-04-18

### VULN-034: Unsanitized file.filename in Batch Document Splitter
- **Before:** `file.filename` used directly in temp file path: `OUTPUT_DIR / f"temp_{uuid}_{file.filename}"` — filenames containing `../` could escape the output directory
- **Fix:** Applied `sanitize_filename(Path(file.filename).name)` to strip path components before constructing temp path
- **Lines changed:** api.py:7024 (1 line replaced with 2 lines)

### VULN-035: Unsanitized file.filename in Batch Invoice Extractor
- **Before:** Same vulnerability as VULN-034 in the batch invoice extraction endpoint
- **Fix:** Applied identical `sanitize_filename()` fix
- **Lines changed:** api.py:7168 (1 line replaced with 2 lines)

### VULN-036: Unsanitized file.filename in Batch Receipt Extractor
- **Before:** Same vulnerability as VULN-034 in the batch receipt extraction endpoint
- **Fix:** Applied identical `sanitize_filename()` fix
- **Lines changed:** api.py:7290 (1 line replaced with 2 lines)

---

## Impact Assessment

- **Total lines modified:** ~185 lines in api.py, ~25 lines in routes.py (across 4 audit rounds)
- **No breaking changes** to public API endpoints
- **No new dependencies** introduced
- **Performance impact:** Negligible (ZIP member validation and filename sanitization add minimal overhead)
- **OCR-split module:** NOT TOUCHED (as required)
- **All Critical/High issues:** Either FIXED or ACCEPTED_TEMPORARY with justification
