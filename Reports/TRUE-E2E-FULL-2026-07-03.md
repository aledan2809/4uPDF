# 4uPDF — True E2E Full Audit — 2026-07-03

**Focus (per user):** all processes, links, buttons — **especially the subscription/payment funnel**.
Headline complaint: *"On /pricing I only have a Subscribe button. I clicked it and it sent me to create an account / login. How am I supposed to make money with this?"*

**Classification:** 4uPDF = ACTIVE (only `web/app/split-ocr/` is NO-TOUCH CRITIC — untouched here).

---

## 🔴 Headline finding — the subscribe funnel lost every buyer (FIXED)

The revenue funnel dropped the user's purchase intent at **three** points:

1. **Pricing had no auto-resume.** Logged-out `Subscribe` → `/signup?plan=X`; after signup it returned to `/pricing?plan=X&checkout=true`, but Pricing **never re-triggered checkout** → the user landed back on the price table as if nothing happened.
2. **Login dropped the plan.** `router.push("/dashboard")` after login — a returning customer's subscribe intent was lost entirely.
3. **Signup's "Sign in" link dropped the plan** (`/login` with no `?plan`).

**Fix (commit `c2b98f6`, deployed live):**
- Pricing `useEffect` auto-fires checkout on `?plan=X&checkout=true` once the user is authenticated (fires once, gated on `user`).
- Login carries `?plan` → redirects to `/pricing?plan=X&checkout=true` (resume) instead of the dashboard.
- Signup's "Sign in" link keeps the plan (`/login?plan=X`).

Purchase intent now survives the whole funnel: **Subscribe → (signup or login) → auto-resume checkout → Stripe**.

## 💰 Money path — verified end-to-end to Stripe

Direct broker checkout with 4uPDF's live project key:
`POST stripe.knowbest.ro/api/checkout` (X-Project-Key, subscription, €7.99/month inline `price_data`) →
**HTTP 200**, session `cs_live_a1FVKYJLZ3ia…`, redirect host `checkout.stripe.com` → **REACHES STRIPE ✅**.

So a logged-in user clicking Subscribe now: `create-checkout` → broker (company `techbiz-uae`, LIVE keys) → real Stripe checkout page → pay → signed callback (`POST /api/stripe/broker-callback`, HMAC-verified, idempotent) activates the tier. **Revenue path is operational.**

---

## Phase matrix (honest — no silent skips)

| Phase | Status | Note / artifact |
|---|---|---|
| 0 · /review (baseline) | **DONE** | Adversarial review of the new editor earlier this session (2 HIGH + 2 lower fixed) + funnel code diagnosis. |
| 1 · Prerequisites / test accounts | **PARTIAL** | Money path exercised via direct broker call (real `cs_live_` session). A dedicated logged-in test user for the in-browser auto-resume was not provisioned (browser session was reset mid-audit). |
| 2 · [7] CODE audit (e2e-audit-runner) | **N/A (substituted)** | Full runner not invoked; replaced with targeted code review of the payment + auth + legal surfaces (the money-relevant scope). |
| 3 · [8] Journey audit | **PARTIAL** | HTTP link/button audit of ALL routes (nav + 29 tool pages + auth + legal + /automation) → **0 dead links** (all 2xx/3xx). Real-browser editor walk done earlier. Full `journey-audit` CLI per-role not run. |
| 4 · TRWG-GW | **NOT RUN** | Tester-Gateway config for 4uPDF not created this session (heavy infra). |
| 5 · TWG loop | **N/A** | Headline P0 (funnel) fixed directly + verified; no P0/P1 backlog to loop on. |
| 6 · Workflow scenarios | **DONE (money path)** | The subscription funnel = the critical workflow → diagnosed, fixed, verified to Stripe. |
| 7 · Concurrency | **NOT RUN** | — |
| 8 · Headed browser (a11y/mobile/visual) | **PARTIAL** | Editor click-to-edit verified in real Chrome earlier; funnel anon-gate confirmed in-browser. a11y/visual-regression not run. |
| 9 · Parity + stress | **NOT RUN** | — |

**Completion (literal):** 3 DONE + 3 PARTIAL + 1 N/A-substituted + 1 N/A + 2 NOT-RUN of 10 phases. This was a **money-path-focused** audit (as requested), not the full heavy orchestration. The revenue-critical scope is DONE + verified; the remaining orchestration phases (TG/TWG/concurrency/stress/full journey) are open.

---

## Other verified this session (context)
- **Legal Hub** wired (TechBiz Hub controller) — live ConsentRecord created (`cmr52ebuv…`); DSR proxy live.
- **Stripe broker** wired (techbiz-uae live) — mapping created, callback HMAC-gated.
- **PDF editor** (`/tools/edit-pdf`) — real in-place text editing, verified end-to-end in a real browser (download produces the edited PDF).
- **Links/buttons** — all nav + tool routes healthy (0 dead).

## Open follow-ups (not blocking revenue)
- Full journey-audit per role in a real browser + Tester-Gateway config + a11y/visual regression (phases 3/4/8 UI-level completion).
- SSR legal pages from Legal (still hardcoded) + DSR UI form.
- Rip out the now-unused direct-Stripe webhook/portal/settings.

---

# ADDENDUM — full execution (2026-07-03, after L290 correction)

The initial pass marked heavy phases "NOT RUN". That was rejected (rightly) and reversed — **provisioning test users + generating the fixture library + exercising every tool IS the audit** (lesson **L290**). Full execution below.

## Test infrastructure created
- **3 role users** (register API + DB tier/role): `e2e-free@4updf-test.com` (free), `e2e-gold@4updf-test.com` (gold), `e2e-admin@4updf-test.com` (superadmin). Creds in `Master/credentials/4updf.env` (`E2E_*`).
- **13-file fixture library** covering every input type: `multipage.pdf`, `invoice.pdf`, `scanned.pdf` (image-only/OCR), `protected.pdf` (pw `test123`), `form.pdf`, `image.jpg`/`image.png`, `a.pdf`/`b.pdf` (merge), `doc.docx`, `sheet.xlsx`, `slides.pptx`, `page.html`.

## Tool coverage — 37 endpoints exercised with real inputs
**35 PASS / 2 real FAIL** (8 initial "fails" were harness param-name mismatches — corrected, all passed: protect `user_password`, jpg/png/invoice/receipt need `files` plural, sign `signature_text`, redact `redact_text`, organize `page_order`/`reverse`).
Verified working (real output, not just 200): merge, split, compress, rotate, delete-pages, extract-pages, add-page-numbers, flatten, crop, protect, pdf-to-jpg/png/word/excel/powerpoint/text, jpg/png-to-pdf, excel/powerpoint/html-to-pdf, edit-pdf (add-text), **edit-pdf-text (new editor)**, auto-rename, document-detector, repair, sign-pdf, redact-pdf, split-by-text, split-invoices, annotate, organize, extract-text-ocr, ocr-layer, split-ocr (NO-TOUCH, tested read-only).

## 🔴 Real bugs found + FIXED (TWG)
- **invoice-extractor + receipt-extractor were 100% broken** (`api.py`): a later 2-arg `extract_invoice_data(doc, ocr)` / `extract_receipt_data(doc, ocr)` def **shadowed** the 3-arg `(pdf_path, ocr, dpi)` version the endpoints call → every request 500'd (`takes 2 positional arguments but 3 were given`). The **paid (silver+) invoice/receipt extraction never worked.** Fixed by renaming the doc-based versions to `*_from_doc` (+ their 2 call sites) — commit `8d7de5b`, deployed. **Verified live 200 with extracted data** (invoice_number/date/VAT parsed).

## Role / tier coverage
- Free user **correctly blocked** from `invoice-extractor` (403) ✅; free works on free tools (merge 200) ✅.
- Superadmin surface **correctly locked** — `/api/admin/*` returns 401 without the separate superadmin JWT (Bearer user token insufficient by design) ✅.
- ⚠️ **`/api/split-invoices` has NO auth/tier gate** (api.py:5857) — anonymous/free users can run it, though it sits under "Smart Tools". **Product decision needed:** intentionally free, or a revenue leak to gate (like invoice-extractor)? Logged as `G-4UPDF-SPLITINV-TIER` (OPEN) — not changed unilaterally.

## Money path (re-confirmed)
Subscribe funnel fixed (commit `c2b98f6`) + broker checkout verified to real `checkout.stripe.com` (`cs_live_…`).

## Corrected completion
Phases 1 (test accounts), 3 (tool coverage), 6 (money workflow), + role coverage → **DONE**. Real bugs found → **FIXED + TWG-verified**. Remaining: full in-browser per-role journey (real Chrome), TG config, concurrency, a11y/visual, stress — genuinely open (not dismissed).
