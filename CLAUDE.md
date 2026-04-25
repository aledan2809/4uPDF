# 4uPDF — Multi-Tool PDF Processing Platform

## Overview
40+ PDF tools: split, merge, compress, convert, OCR, text extraction, repair, protection, watermark. Production at 4updf.com.

## Stack
- **Backend**: FastAPI (Python), RapidOCR (ONNX), PyMuPDF
- **Frontend**: Next.js 13+, React, TypeScript, Tailwind
- **Auth**: JWT + bcrypt, Stripe subscriptions (5 tiers)
- **Rate Limiting**: Redis (production) / in-memory (dev)
- **AI Router**: `ai_router.py` — 8 providers (HTTP raw, no SDK)
- **Deploy**: VPS2 (4updf.com), nginx + systemd, ports 3098/3099

## CRITICAL — DO NOT BREAK
- **`4updf.com/split-ocr`** — Production OCR invoice splitting. NEVER modify the `/api/split-ocr` endpoint without extensive testing.
- **`api.py` split-ocr handler** — Core revenue feature

## Build & Run
```bash
pip install -r requirements.txt
uvicorn api:app --port 3099     # Backend
cd web && npm run dev            # Frontend
```

## DO NOT MODIFY (without explicit approval)
- `/api/split-ocr` endpoint
- `web/app/split-ocr/page.tsx` — Split-OCR UI
- Rate limiting configuration
- File validation (MIME + size checks)
- nginx configuration
- systemd service files


## Governance Reference
See: `Master/knowledge/MASTER_SYSTEM.md` §1-§5. This project follows Master governance; do not duplicate rules.
NO-TOUCH CRITIC: see `AUDIT_GAPS.md` at project root for propose-confirm-apply protocol (Master `CLAUDE.md` §2d).
