# AI Skills GAP Analysis — 4uPDF
**Data**: 2026-04-10
**Proiect**: 4uPDF (Multi-Tool PDF Processing Platform)
**Stack**: FastAPI (Python) + Next.js 13 (frontend), RapidOCR, PyMuPDF, Stripe
**Deploy**: VPS2 (4updf.com), nginx + systemd
**AI**: Custom ai_router.py (8 provideri, HTTP raw, no SDK)
**CRITICAL**: 4updf.com/split-ocr NU TREBUIE STRICAT

---

## 1. AI Skills Existente

| Skill | Status | Detalii |
|-------|--------|---------|
| AI Router custom (Python) | DA — ACTIV | `ai_router.py` — 8 provideri, round-robin |
| RapidOCR (ONNX) | DA — ACTIV | OCR engine principal |
| Claude Haiku fallback | DA | Poziția 7 în chain-ul round-robin |
| Rate limiting | DA | 30 req/min sliding window |
| CLAUDE.md | NU | Lipsește |

**Total AI skills existente: 4/10**

---

## 2. AI Skills Necesare

| # | Skill AI | Prioritate | Complexitate | Impact |
|---|----------|-----------|--------------|--------|
| 1 | CLAUDE.md | **CRITICĂ** | Mică | Context + protecție split-ocr |
| 2 | Anthropic SDK (replace raw HTTP) | **ÎNALTĂ** | Medie | Robustness, retry, streaming |
| 3 | AI document classification | MEDIE | Mică | Auto-detect tip document |
| 4 | AI text extraction post-processing | MEDIE | Mică | Claude corectează OCR output |
| 5 | Cost/token tracking | OPȚIONAL | Mică | Monitorizare spend AI |

---

## 3. Scor AI Readiness

| Criteriu | Scor | Max |
|----------|------|-----|
| CLAUDE.md | 0 | 2 |
| AI Router integrat | 1.5 | 2 |
| AI features implementate | 1.5 | 3 |
| Teste | 1 | 2 |
| Documentație AI | 0 | 1 |
| **TOTAL** | **4/10** | 10 |

**Verdict**: OCR funcțional cu AI router custom. Gap: no SDK (raw HTTP), CLAUDE.md lipsă, fără post-processing LLM. ATENTIE: orice modificare trebuie să protejeze 4updf.com/split-ocr.
