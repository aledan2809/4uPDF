# Project Status - 4uPDF

Last Updated: 2026-07-04

---

## Current State (Sesiunea 2026-07-04) — True E2E + SUMMER 2026 plan restructure

**Continuare directă a sesiunii 2026-07-03 (editor + Legal + broker).** Toate LIVE + committed + pushed.

### Livrat
- **Subscribe funnel fix** (`c2b98f6`) — 3 rupturi (Pricing auto-resume, login carries plan, signup Sign-in carries plan). Verificat vizual la Stripe checkout (TechBiz Hub).
- **True E2E Full Audit** (report `Reports/TRUE-E2E-FULL-2026-07-03.md`): 3 useri de rol + 13 fixture docs create; 37 tool-uri exersate (35 pass); **2 bug-uri reale reparate** — invoice/receipt-extractor 500 (shadowed function, `8d7de5b`) + **split-invoices revenue leak gated** (`b342bb7`); concurrency/stress pass; a11y nav-toggle fix (`094f6fb`).
- **SUMMER 2026 plan restructure** — Free/PRO/Business + SUMMER HOT strike-through (`39dc095` PLAN_LIMITS + server-side free-daily-task-cap middleware; `231855a` Pricing UI). PRO(silver) €4.99/49.90, Business(gold) €12.99/129.90; Free 30MB + **3 tasks/day enforced** (was never enforced). `/api/split-ocr` (NO-TOUCH) excluded from the cap. Verified: free 3→429, gold unlimited, checkout €4.99→Stripe.
- Test users in `Master/credentials/4updf.env` (`E2E_*`). Broker mapping `4updf→techbiz-uae` (live) + Legal AppEntityMapping `4updf→TechBiz Hub` (id `cmr52062o…`).

### Pending (NEXT SESSION — B+C+D, all approved)
- **B** — MA conversion campaign: 20% coupon on PRO (€3.99/mo, €39.90/yr) for the 8 real users (registered ≤ 4 Jul 2026), EN, "early-supporter" framing (NO per-user op counts — 0/8 have logged ops), valid until 31 Jul 2026. Deliver DRAFT → send only on explicit OK.
- **C** — per-function reels, EN-first, via MA REEL/VIDEO pipeline (real-operation footage + blur, Edit tool first; RO 2nd language later). No competitor comparison (L291).
- **D** — proactive "approaching daily limit" upgrade nudge in tools + fix the per-user usage-tracking gap (logged-in ops not attributed to `user_id`).

### Lessons Learned (sesiunea 2026-07-04)
- **L290** — "heavy infra" is not a valid reason to skip E2E phases (provisioning users + generating fixtures IS the audit).
- **L291** — never publicly compare our products vs named competitors (⚠️ number collides with a concurrent session's L291 "export .docx diacritics" — reconcile numbering later).
- **L292** — standard ecosystem pricing scheme: annual = monthly ×10, promo = struck regular price (AVE strike-through), display-name ≠ internal-tier-key.

---

## Current State (Sesiunea 2026-07-03) — Real in-place PDF text editor

**Shipped LIVE to 4updf.com** (VPS2, systemd `4updf-api` + `4updf-web`). Branch `nginx-api-deploy`, commits `f282c63` (editor) → `a4c5675` (nav) → `cb48096` (save UX) → `83f5489` (live-sync). Deployed **surgically** (rsync 2 files + rebuild + restart; NO `git pull` — VPS working tree is dirty, see follow-ups).

### What was wrong
- `/tools/edit-pdf` was NOT an editor — a coordinate-blind "add text" stamper (old `edit_pdf` in `api.py` + a form-only page). It never read the PDF's text, so users couldn't click existing text to edit it (the exact complaint).
- Not linked in any nav dropdown.

### What shipped
- **Backend** `POST /api/edit-pdf-text` (`api.py`): matches each edit (page + click-fraction + old text) to its fitz span, redacts it (detected bg fill; borders preserved via `PDF_REDACT_LINE_ART_NONE`), redraws corrected text using the PDF's **own embedded font** (extracted by xref) at the same baseline/size/colour. Groups multi-edits per span (unmatched substrings skipped — never destroys the run). Encrypted/non-PDF → 400; no-match → 422. Unicode-font fallback. New `_detect_bg_color` helper.
- **Frontend** `edit-pdf/page.tsx`: real editor — pdf.js renders the page + a clickable text layer from `getTextContent()`; click a word → inline input → **edits save LIVE as you type** (onChange) so the green Save button lights up on the first keystroke; live yellow preview; pending panel with prominent "Save & download PDF"; Esc reverts.
- **Navbar**: Edit dropdown lists "Edit PDF" first (desktop + mobile).

### Verified (real browser, prod)
Click-to-edit opens the input; typing enables Save instantly (no Enter); Save → "PDF edited successfully!" → downloaded PDF has the change applied, rest intact. Backend E2E on the user's real doc (Monza Order Form FM.3 date fix) — pixel-perfect, Calibri-Light matched, signatures/borders intact.

### Side deliverable
Corrected the user's Monza Order Form → `~/Downloads/Centrele Monza-Ares - comanda 3 - CORECTAT FM3.pdf` (FM.3 period `22-Iul-2026 – 21-Iul-2027` + invoice `22-Iun-2026`). Digital signature invalidated by the edit — needs re-signing.

### Open / follow-ups
- **User's Chrome download engine is hung** (Chrome up 22 days since Jun 11; zero downloads recorded since Jun 24) → downloads silently fail on ALL sites (WhatsApp + 4uPDF). Fix = quit Chrome fully (Cmd+Q) + reopen. NOT a 4uPDF bug.
- **VPS git cleanup (separate session)**: `/var/www/4updf` working tree dirty (uncommitted proxy fixes + `.bak` files + junk `web/C:/`, `test_ocr.py`); `nginx-api-deploy` is 2 ahead of `master`, origin/master 1 ahead of the VPS. Reconcile so future `git pull` deploys are clean.

### Lessons Learned (sesiunea 2026-07-03)
- A tool named "Edit PDF" that only stamps text at coordinates ≠ an editor. "It can't find the text" was a MISSING FEATURE, not a bug — read the actual tool code before assuming a small fix.
- Verify interactive UI in a REAL browser, not just tsc/build. "Click-to-edit works but Save stays disabled" was invisible to typecheck + backend tests; only real typing exposed that edits must commit live (a disabled Save button doesn't commit the open editor, and users won't press Enter).
- React `onChange` does NOT fire from a programmatic `el.value = x` — use the native value setter + an `input` event to simulate typing in tests; in the app, live-sync on onChange so the UI reacts without Enter/blur.
- A long-running Chrome (weeks of uptime) can silently break its download subsystem — clean settings/policies but zero downloads → check process uptime + download-history date; restart Chrome.
- Surgical rsync-deploy (2 files + rebuild + restart) is the safe path when a prod repo's working tree is dirty — avoids a `git pull` clobbering uncommitted live fixes.

---

## Current State

### Deployed & Working on VPS2 (72.62.155.74)
- **Backend**: FastAPI (Python) port 3099 — auth, Stripe webhook, rate limiting, OCR split, all tools
- **Frontend**: Next.js port 3098 — 50+ pages, SEO optimized, blog, pricing, login/signup
- **Domain**: 4updf.com (nginx, unlimited file size)
- **All 4 Phases** implemented and tested (27/27 tests)

### What Works
- Split-OCR with live order counter, progress bar, stop button
- Default: "Nr. comanda (RO) + 8 cifre", OCR zone "Top (full width)"
- User registration/login (JWT + bcrypt 4.0.1)
- All PDF tools (merge, split, compress, convert, rotate, watermark, sign, protect, unlock, OCR, barcode, archive)
- SEO: meta tags, OpenGraph, JSON-LD, canonical URLs on all 21 tool pages
- Blog: 5 SEO articles with Article schema
- Pricing page with Stripe checkout flow (frontend ready)

### Recent Fixes (2026-03-18)
- Fixed passlib/bcrypt compatibility (downgraded bcrypt to 4.0.1)
- Fixed split-ocr 404 (frontend was calling /api/split-ocr instead of /api/split)
- Fixed split-ocr 422 (broken rate_limit Depends removed)
- Fixed regex escaping (single \d → double \\d in JS string)
- Changed default preset to "nr_comanda_ro" with pattern (\\d{8})
- Changed default OCR zone to "Top (full width)"
- Added live order counter during scanning
- Added Stop Processing button (backend /api/cancel/{job_id} + frontend)
- Fixed filename _1 _2 suffix (clean output dir before splitting)
- Nginx set to unlimited file size (client_max_body_size 0)
- Split-invoice has plan-based size limit, split-ocr has no limit

## TODO — In Progress
- [ ] **Stripe setup (IN PROGRESS)**: Webhook destination being created in Stripe Dashboard
  - Events to select: checkout.session.completed, customer.subscription.deleted, customer.subscription.updated
  - Endpoint URL: https://4updf.com/api/stripe/webhook
  - After webhook: create Product "4uPDF Pro" at 5 EUR/month recurring
  - Then configure VPS with: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID
- [ ] Submit sitemap to Google Search Console (https://4updf.com/sitemap.xml)
- [ ] PostgreSQL migration (optional, SQLite works fine for now)

## Technical Notes
- **Stack**: Python FastAPI + PyMuPDF + RapidOCR (backend), Next.js (frontend)
- **Ports**: 3098 (frontend), 3099 (backend)
- **VPS**: 72.62.155.74 (VPS2)
- **Auth**: JWT (PyJWT + bcrypt 4.0.1), 24h token expiry
- **Stripe account**: Class RDA Impex SRL sandbox (acct_1TCKjHAJZnzv9xfg)
- **DB**: SQLite at data/4updf.db (sync backend, not async)
- **Backend file**: /var/www/4updf/api.py (5800+ lines, monolith)
- **Frontend**: /var/www/4updf/web/ (Next.js, PM2 managed)
- **New deps installed on VPS**: bcrypt 4.0.1, passlib, pyjwt, stripe, python-magic, slowapi
