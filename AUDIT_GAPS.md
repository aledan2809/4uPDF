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
| G-4UPDF-CSP-001 | P2 | Security | Missing `Content-Security-Policy` header (all other security headers present: HSTS/X-Frame/X-Content-Type/Referrer/Permissions). Defense-in-depth vs XSS, not a breach. Verified live 2026-06-03 via `curl -I`. Source: [7] CODE audit 2026-06-03. | OPEN | Add CSP in nginx vhost (**DO-NOT-MODIFY → propose-confirm-apply**); use `Content-Security-Policy-Report-Only` first (app has inline scripts in layout.tsx) before enforce. |
| G-4UPDF-DASH-001 | P3 | Auth hygiene | `/dashboard` returns 200 shell without auth. PARTIAL false-positive — client-rendered; data fetched with `Authorization: Bearer`, no server-side leak. Scanner flags on 200 status alone. Verified live 2026-06-03. | OPEN | Optional: server-side redirect to `/login` when unauthenticated (hygiene; no data exposure). |
| G-4UPDF-JOURNEY-FP-001 | P3 | Tooling | [8] journey-audit classifies all 20 tool pages `GATED/ONBOARDING_WALL` though they render fine (correct h1/content/buttons). False-positive: `emptyStateMarkers` matches expected upload dropzone + `onboardingMarkers` matches global header "Sign up/Upgrade" CTA. Source: [8] journey 2026-06-03 (authed regular user). | OPEN | Tune `.journey-audit.json` — scope markers to main-content, add tool-page dropzone exception (cf. Tester 0.3.0 `formHeroException`). Config-only, no app change. |

---

## Eliminated Gaps

| Gap ID | Severity | Area | Description | Status | Commit | Date |
|--------|----------|------|-------------|--------|--------|------|
| G-PDF-SEC-001 | HIGH | Security | Missing 3 security headers: Strict-Transport-Security (HSTS), X-XSS-Protection, Permissions-Policy. Reported by security-scanner plugin. | Eliminated | `afb9593` | 2026-05-17 |
| G-PDF-A11Y-001 | HIGH | Accessibility | Color contrast violations (WCAG 1.4.3): `text-gray-500` in Footer on `bg-gray-900` background (3.5:1, fails AA 4.5:1). `placeholder-gray-500` on form inputs. Affects all pages via Footer component. Fixed: Footer → `text-gray-400`, login/contact placeholders → `placeholder-gray-400`. | Eliminated | `5eef14e` | 2026-05-17 |
| G-PDF-A11Y-002 | HIGH | Accessibility | Link distinguishability violations (WCAG 1.4.1): inline links on /login, /about, /contact, /dashboard only used color to distinguish from surrounding text (no persistent underline). Fixed: added `underline` class to Sign up link (login), email links (about, contact), pricing link (dashboard). | Eliminated | `5eef14e` | 2026-05-17 |

---

## Reports index

- `Reports/AUDIT_E2E_2026-05-17.md` — ML2 Wave 3 audit
- `Reports/DIRECT-CHANGES-2026-05.md` — monthly Direct-session change log
