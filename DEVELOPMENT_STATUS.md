# Project Status - 4uPDF

Last Updated: 2026-03-19

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
