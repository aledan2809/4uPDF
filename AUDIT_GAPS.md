# Audit Gaps — 4uPDF

**Project safety**: NO-TOUCH CRITIC (per `Master/CLASSIFICATION.md` §2.3 — especially the `OCR-split` module; prod live at `4updf.com` VPS2)
**Last updated**: 2026-05-17
**Maintainer**: Master orchestration (auto-surface at session start)

---

## Permanent instruction — Claude session start

At the start of every session opened on this project:
1. Read this file in full
2. Surface all items with `Status=OPEN` to the user
3. NEVER apply automated fix — pipeline mode is `audit-only` per Master `CLAUDE.md` §2d
4. For any proposed change: `propose-confirm-apply` protocol (describe change → wait for explicit "ok" → apply → log in `Reports/DIRECT-CHANGES-YYYY-MM.md`)
5. After each resolved item: update `Status=Eliminated` with date + commit hash

**Why**: Production PDF tool platform (40+ utilities) with OCR pipeline. The OCR-split module is explicitly NO-TOUCH CRITIC per user directive. Breakages impact paying users on `4updf.com`.

---

## Open Gaps

| Gap ID | Severity | Area | Description | Status | Resolution |
|--------|----------|------|-------------|--------|------------|
| G-PDF-VCS-001 | HIGH | Governance | VPS2 had 934 lines of uncommitted dev work on 4uPDF directly on server (api.py +468, layout +46, superadmin/analytics/page.tsx +429) + untracked top-level tool pages + web/public. Never committed. Risk: loss on redeploy/VPS failure. | Eliminated (2026-06-02) | Reconciled (data-loss closed): exact running state captured to GitHub branches `vps-prod-snapshot-2026-06-02` + `master` (commit `ba7265a`); origin's undeployed improvements (security/proxy/a11y) preserved on `improvements-undeployed-2026-06` (`2c1bedd`). Live prod DB (`data/4updf.db`) untracked via `git rm --cached` (was tracked → merge landmine) + .gitignore hardened. split-ocr (NO-TOUCH) untouched. Site untouched (no rebuild). **Deferred follow-up**: unify deployed line ⇄ improvements line (adopt security/proxy via tested worktree). |
| ~~G-4UPDF-CSP-001~~ | P2 | Security | Missing `Content-Security-Policy` header. → **ENFORCED LIVE** (see Eliminated Gaps below, `9900e8f`). |
| G-4UPDF-LOCALHOST-001 | P3 | Bug (latent) | 5+ tool pages (receipt-extractor, invoice-extractor, archive-processor, batch-document-splitter, batch-processing) `fetch()` a **hardcoded `http://localhost:3099`** instead of a relative `/api/...` path. In production the browser resolves `localhost` to the *visitor's own machine* (not the VPS), so these tools fail for real users; CSP-RO will also report these as `connect-src` violations. Discovered while building the CSP policy 2026-06-04 (review agent). | OPEN | Replace `http://localhost:3099` with relative `/api/...` (the rewrite/nginx already proxy `/api/` → :3099). Out of scope for the CSP task (kept separate per file-modification discipline). Dedicated small session. |

---

## Eliminated Gaps

| Gap ID | Severity | Area | Description | Status | Commit | Date |
|--------|----------|------|-------------|--------|--------|------|
| G-4UPDF-CSP-001 | P2 | Security | Missing `Content-Security-Policy` header (defense-in-depth vs XSS). | Eliminated | `2ec26b2` (Report-Only) + `9900e8f` (enforce) | 2026-06-04 |
| G-PDF-SEC-001 | HIGH | Security | Missing 3 security headers: Strict-Transport-Security (HSTS), X-XSS-Protection, Permissions-Policy. Reported by security-scanner plugin. | Eliminated | `afb9593` | 2026-05-17 |
| G-PDF-A11Y-001 | HIGH | Accessibility | Color contrast violations (WCAG 1.4.3): `text-gray-500` in Footer on `bg-gray-900` background (3.5:1, fails AA 4.5:1). `placeholder-gray-500` on form inputs. Affects all pages via Footer component. Fixed: Footer → `text-gray-400`, login/contact placeholders → `placeholder-gray-400`. | Eliminated | `5eef14e` | 2026-05-17 |
| G-PDF-A11Y-002 | HIGH | Accessibility | Link distinguishability violations (WCAG 1.4.1): inline links on /login, /about, /contact, /dashboard only used color to distinguish from surrounding text (no persistent underline). Fixed: added `underline` class to Sign up link (login), email links (about, contact), pricing link (dashboard). | Eliminated | `5eef14e` | 2026-05-17 |
| G-4UPDF-DASH-001 | P3 | Auth hygiene | `/dashboard` returned a 200 shell to unauthenticated visitors (partial-FP: client-rendered, zero data when `!user`, no server-side leak). Fixed: pass-through `dashboard/layout.tsx` adds `robots: noindex,nofollow` (keeps the authed page out of search) + the `!loading && !user` branch now shows a neutral "Redirecting to sign in…" screen instead of dashboard-shaped chrome (the client redirect guard already existed). A true server-side 302 is N/A — auth token is localStorage-only (no cookie for middleware). Verified live: `/dashboard` emits the noindex meta. | Eliminated | `356a314` | 2026-06-04 |
| G-4UPDF-JOURNEY-FP-001 | P3 | Tooling | [8] journey-audit classified all 20 tool pages `GATED/ONBOARDING_WALL` (FP: `onboardingMarkers` matched the global header "Sign up/Upgrade" chrome; the upload dropzone was in `emptyStateMarkers`). Fixed config-only in `.journey-audit.json`: narrowed `onboardingMarkers` to genuine wall phrases (header CTA + inline Pro upsells no longer match), moved the dropzone into `validContentMarkers`. Verified: live `journey-audit` re-run = **21/21 OK** (was 20 GATED); new regex still catches real walls. | Eliminated | `356a314` | 2026-06-04 |

---

## Reports index

- `Reports/AUDIT_E2E_2026-05-17.md` — ML2 Wave 3 audit
- `Reports/DIRECT-CHANGES-2026-05.md` — monthly Direct-session change log

## True E2E Full Audit — 2026-07-03

### Eliminated
- **G-4UPDF-EXTRACTORS-500** — `/api/invoice-extractor` + `/api/receipt-extractor` returned 500 on EVERY request (`extract_invoice_data()/extract_receipt_data() takes 2 positional arguments but 3 were given`). Root cause: a later 2-arg `(doc, ocr)` def shadowed the 3-arg `(pdf_path, ocr, dpi)` version the endpoints call → the PAID (silver+) extractors never worked. Fix: renamed the doc-based versions → `*_from_doc` (+ 2 call sites). Commit `8d7de5b`, deployed, live-verified 200 with extracted data. **Eliminated 2026-07-03.**
- **G-4UPDF-FUNNEL-DEADEND** — Pricing "Subscribe" for logged-out users dead-ended at auth (no return to checkout; Login dropped the plan; signup Sign-in link dropped the plan). Fix: Pricing auto-resumes checkout on `?plan=X&checkout=true`; Login + signup carry the plan. Commit `c2b98f6`, deployed. **Eliminated 2026-07-03.**

### Open
- ~~**G-4UPDF-SPLITINV-TIER**~~ → **Eliminated 2026-07-03** (user: not intentional). `/api/split-invoices` was ungated; added `require_batch_access(get_current_user(credentials))` (Silver/Gold, same gate as `invoice-extractor`). Verified live: anonymous 401, free 403, gold 200.
- **G-4UPDF-E2E-UI-PHASES** — full in-browser per-role journey walk (real Chrome), Tester-Gateway config, concurrency, a11y/visual-regression, stress — PARTIAL 2026-07-03 — concurrency (10/10 distinct, no race), stress (30/30 OK), a11y (fixed nav toggle), real-browser role walk (free/gold/superadmin) + money-path-to-Stripe DONE. Remaining: visual-regression baselines + full TG server run + superadmin data-CRUD walk (skipped to protect real PII).
