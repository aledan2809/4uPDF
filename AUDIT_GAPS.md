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
| G-4UPDF-CSP-001 | P2 | Security | Missing `Content-Security-Policy` header (all other security headers present: HSTS/X-Frame/X-Content-Type/Referrer/Permissions). Defense-in-depth vs XSS, not a breach. Verified live 2026-06-03 via `curl -I`. Source: [7] CODE audit 2026-06-03. | **Report-Only LIVE 2026-06-04 (`2ec26b2`); enforce pending observation** | Shipped `Content-Security-Policy-Report-Only` via **`next.config.mjs` headers()** (where the other 6 headers live) → **nginx NOT touched** (sidesteps DO-NOT-MODIFY). Policy covers: inline GA/heartbeat/pageview (`'unsafe-inline'`), gtag, Chart.js (`cdn.jsdelivr.net`), pdf.js worker (`blob:`), CAS beacons (`ma.techbiz.ae`); `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'`, `form-action 'self'`. **Next step (user)**: browse the live site (incl. superadmin + tools + extract-figure), open DevTools console, collect CSP-RO violations, tighten policy, then flip `Report-Only` → `Content-Security-Policy` (enforce). Verified live: header present, enforce header absent (blocks nothing), all pages 200. |
| G-4UPDF-LOCALHOST-001 | P3 | Bug (latent) | 5+ tool pages (receipt-extractor, invoice-extractor, archive-processor, batch-document-splitter, batch-processing) `fetch()` a **hardcoded `http://localhost:3099`** instead of a relative `/api/...` path. In production the browser resolves `localhost` to the *visitor's own machine* (not the VPS), so these tools fail for real users; CSP-RO will also report these as `connect-src` violations. Discovered while building the CSP policy 2026-06-04 (review agent). | OPEN | Replace `http://localhost:3099` with relative `/api/...` (the rewrite/nginx already proxy `/api/` → :3099). Out of scope for the CSP task (kept separate per file-modification discipline). Dedicated small session. |

---

## Eliminated Gaps

| Gap ID | Severity | Area | Description | Status | Commit | Date |
|--------|----------|------|-------------|--------|--------|------|
| G-PDF-SEC-001 | HIGH | Security | Missing 3 security headers: Strict-Transport-Security (HSTS), X-XSS-Protection, Permissions-Policy. Reported by security-scanner plugin. | Eliminated | `afb9593` | 2026-05-17 |
| G-PDF-A11Y-001 | HIGH | Accessibility | Color contrast violations (WCAG 1.4.3): `text-gray-500` in Footer on `bg-gray-900` background (3.5:1, fails AA 4.5:1). `placeholder-gray-500` on form inputs. Affects all pages via Footer component. Fixed: Footer → `text-gray-400`, login/contact placeholders → `placeholder-gray-400`. | Eliminated | `5eef14e` | 2026-05-17 |
| G-PDF-A11Y-002 | HIGH | Accessibility | Link distinguishability violations (WCAG 1.4.1): inline links on /login, /about, /contact, /dashboard only used color to distinguish from surrounding text (no persistent underline). Fixed: added `underline` class to Sign up link (login), email links (about, contact), pricing link (dashboard). | Eliminated | `5eef14e` | 2026-05-17 |
| G-4UPDF-DASH-001 | P3 | Auth hygiene | `/dashboard` returned a 200 shell to unauthenticated visitors (partial-FP: client-rendered, zero data when `!user`, no server-side leak). Fixed: pass-through `dashboard/layout.tsx` adds `robots: noindex,nofollow` (keeps the authed page out of search) + the `!loading && !user` branch now shows a neutral "Redirecting to sign in…" screen instead of dashboard-shaped chrome (the client redirect guard already existed). A true server-side 302 is N/A — auth token is localStorage-only (no cookie for middleware). Verified live: `/dashboard` emits the noindex meta. | Eliminated | `356a314` | 2026-06-04 |
| G-4UPDF-JOURNEY-FP-001 | P3 | Tooling | [8] journey-audit classified all 20 tool pages `GATED/ONBOARDING_WALL` (FP: `onboardingMarkers` matched the global header "Sign up/Upgrade" chrome; the upload dropzone was in `emptyStateMarkers`). Fixed config-only in `.journey-audit.json`: narrowed `onboardingMarkers` to genuine wall phrases (header CTA + inline Pro upsells no longer match), moved the dropzone into `validContentMarkers`. Verified: live `journey-audit` re-run = **21/21 OK** (was 20 GATED); new regex still catches real walls. | Eliminated | `356a314` | 2026-06-04 |

---

## Reports index

- `Reports/AUDIT_E2E_2026-05-17.md` — ML2 Wave 3 audit
- `Reports/DIRECT-CHANGES-2026-05.md` — monthly Direct-session change log
