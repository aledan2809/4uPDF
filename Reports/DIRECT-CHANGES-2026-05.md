# Direct Changes — 4uPDF — May 2026

> Format per Master §2d: propose-confirm-apply + commit hash + evidence.

---

## 2026-05-17 — ML2 Wave 3 Audit + Fixes (Direct mode, propose-confirm-apply)

### G-PDF-SEC-001 — Security Headers (HSTS, X-XSS, Permissions-Policy)

**Commit**: `afb9593`
**Files**: `web/next.config.mjs`
**Change**: Added 3 missing security headers to Next.js `headers()` function.
**Verification**: `curl -I https://4updf.com` confirmed all 3 headers present in response.

### G-PDF-A11Y-001 — Color Contrast WCAG 1.4.3

**Commit**: `5eef14e`
**Files**: `web/app/components/Footer.tsx`, `web/app/login/page.tsx`, `web/app/contact/page.tsx`
**Change**: 
- Footer: `text-gray-500` → `text-gray-400` (3.5:1 → 6.2:1 contrast on gray-900 bg)
- Login/Contact: `placeholder-gray-500` → `placeholder-gray-400` (2.5:1 → 6.2:1 on gray-800 bg)
**Verification**: Build pass + systemctl restart 4updf-web + HTTP 200 confirmed.

### G-PDF-A11Y-002 — Link Distinguishability WCAG 1.4.1

**Commit**: `5eef14e`
**Files**: `web/app/login/page.tsx`, `web/app/about/page.tsx`, `web/app/contact/page.tsx`, `web/app/dashboard/page.tsx`
**Change**: Added persistent `underline` class to all inline links that were color-only distinguishable.
**Verification**: Build pass confirmed.

### G-PDF-VCS-001 — VCS Dev-on-Server (OPEN — no fix applied)

911 lines of uncommitted work detected on VPS2 (`api.py` +468, `layout.tsx` +46, `superadmin/analytics/page.tsx` +429). Work documented in AUDIT_GAPS.md as OPEN gap. No automated fix applied — requires manual intervention per governance rules.
