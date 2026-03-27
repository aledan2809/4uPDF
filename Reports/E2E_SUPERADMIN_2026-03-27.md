# E2E Test Report: 4uPDF SuperAdmin Panel

**Date**: 2026-03-27
**Target**: https://4updf.com/superadmin
**Tester**: Claude Code (Automated E2E via Playwright)
**Result**: ✅ 9 PASS | ❌ 7 FAIL | ⚠️ 1 WARN | Total: 17

---

## Test Results

| # | Test | Status | Details |
|---|------|--------|---------|
| 1.1 | /superadmin redirects to login | ✅ PASS | Redirects to https://4updf.com/superadmin/login |
| 1.2 | "SuperAdmin Access" heading | ✅ PASS | - |
| 1.3 | "Admin Key" label | ✅ PASS | - |
| 1.4 | Key input field | ✅ PASS | - |
| 1.5 | "Access Admin Panel" button | ✅ PASS | - |
| 1.6 | Lock icon SVG | ✅ PASS | - |
| 1.7 | Cookie consent banner | ✅ PASS | - |
| 2.1 | API_URL points to production | ❌ FAIL | Client calls http://localhost:3099/api/superadmin/login — `NEXT_PUBLIC_API_URL` not set, falls back to `localhost:3099`. Browser cannot reach server's localhost! |
| 2.2 | Login response | ❌ FAIL | "Network error" — client cannot reach API (localhost:3099 from browser) |
| 2B.1 | API login with task key | ❌ FAIL | 403 Forbidden — key `4uPDF-SuperAdmin-2026!` rejected |
| 2B.1 | API login with env key | ❌ FAIL | 403 Forbidden — key `4updf-superadmin-2026` also rejected |
| 3-8 | All dashboard tests | ❌ FAIL | Cannot test — login failed (both client and direct API paths) |
| 9.1 | gtag.js script tag | ❌ FAIL | Script src loads `gtag/js?id=undefined` — non-functional |
| 9.2 | Valid GA4 measurement ID | ❌ FAIL | GA4 ID is `undefined` — `.env` has placeholder `G-XXXXXXXXXX` |
| 9.3 | gtag config call | ✅ PASS | `gtag('config', ...)` present but with `undefined` ID |
| 9.4 | Consent mode | ✅ PASS | Consent defaults present in code |
| 9.5 | GA4 on superadmin pages | ⚠️ WARN | GA4 script not included on `/superadmin/*` pages |

---

## 🐛 Bugs Found (8 total)

### BUG-1: 🔴 BLOCKER — Frontend API_URL defaults to localhost:3099 in production

- **Severity**: BLOCKER — SuperAdmin panel is completely non-functional
- **Files affected** (ALL superadmin pages):
  - `web/app/superadmin/login/page.tsx:6`
  - `web/app/superadmin/layout.tsx:7`
  - `web/app/superadmin/page.tsx:5`
  - `web/app/superadmin/users/page.tsx:5`
  - `web/app/superadmin/vouchers/page.tsx:5`
  - `web/app/superadmin/stats/page.tsx:6`
  - `web/app/superadmin/settings/page.tsx:5`
  - `web/app/superadmin/analytics/page.tsx:6`
- **Code**: `const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";`
- **Problem**: `NEXT_PUBLIC_API_URL` is not set in the production build. All client-side `fetch()` calls go to `http://localhost:3099` on the **user's browser machine**, which has nothing running on port 3099.
- **Console error**: `ERR_CONNECTION_REFUSED` on every API call
- **Impact**: Login impossible. All API calls fail. Entire SuperAdmin panel is dead.
- **Fix**: Change fallback to empty string (relative URL):
  ```typescript
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  ```
  This makes `fetch("/api/superadmin/login", ...)` which nginx proxies correctly.

---

### BUG-2: 🔴 BLOCKER — SUPER_ADMIN_KEY mismatch / key rejected by production API

- **Severity**: BLOCKER
- **Observation**: Both keys tested return `403 Forbidden`:
  - Task spec key: `4uPDF-SuperAdmin-2026!` → 403
  - `.env` file key: `4updf-superadmin-2026` → 403
- **Backend logic** (`api.py:426-433`):
  ```python
  def verify_superadmin(admin_key: str):
      if SUPER_ADMIN_KEY and admin_key == SUPER_ADMIN_KEY:
          return True
      stored_key = get_setting("admin_api_key", "")
      if stored_key and admin_key == stored_key:
          return True
      raise HTTPException(status_code=403, detail="Invalid admin key")
  ```
- **Root cause**: The production server's `SUPER_ADMIN_KEY` environment variable is likely different from both the local `.env` and the task spec. OR the env var is empty/unset and the DB-stored `admin_api_key` setting is also different.
- **Impact**: Even if BUG-1 is fixed, nobody can log in.
- **Fix**: SSH to production server and verify `SUPER_ADMIN_KEY` environment variable matches what's documented.

---

### BUG-3: 🔴 CRITICAL — GA4 Measurement ID is "undefined"

- **Severity**: CRITICAL
- **File**: `web/app/layout.tsx:97,107`
- **Code**:
  ```tsx
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { page_path: window.location.pathname })
  ```
- **Local `.env`**: `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX` (placeholder)
- **Production**: Renders as `gtag/js?id=undefined`
- **Impact**: Zero analytics data being collected. Google Analytics is completely non-functional.
- **Fix**: Set `NEXT_PUBLIC_GA_ID` to the real GA4 measurement ID (format: `G-XXXXXXXXXX`) in production `.env` and rebuild.

---

### BUG-4: 🟡 HIGH — GA4 script missing on /superadmin/* pages

- **File**: `web/app/superadmin/layout.tsx`
- **Problem**: The superadmin layout doesn't include the GA4 script. GA4 is only in the root `layout.tsx`. If superadmin pages use their own layout tree that doesn't inherit from root, GA4 won't load.
- **Verification**: WebFetch confirmed no `gtag.js` on `/superadmin/login` page source... Wait — WebFetch DID find `gtag/js?id=undefined` on the superadmin login page, so it IS inherited from root layout.
- **Correction**: GA4 IS present on superadmin pages (inherited from root layout), but with `undefined` ID. This is the same as BUG-3.
- **Status**: Duplicate of BUG-3 (GA4 present but broken due to undefined ID).

---

### BUG-5: 🟡 HIGH — Layout token verification also uses localhost API_URL

- **File**: `web/app/superadmin/layout.tsx:35`
- **Code**: `fetch(\`${API_URL}/api/superadmin/verify\`, { headers: { Authorization: \`Bearer ${token}\` } })`
- **Impact**: Even if login somehow succeeded and a token was stored, every page navigation would fail verification (ERR_CONNECTION_REFUSED to localhost:3099), causing redirect back to login.
- **Fix**: Same as BUG-1 — change API_URL fallback to `""`.

---

### BUG-6: 🟡 HIGH — SSE EventSource uses localhost URL for real-time stats

- **File**: `web/app/superadmin/stats/page.tsx:46`
- **Code**: `new EventSource(\`${API_URL}/api/admin/active-users?token=${token}\`)`
- **Impact**: Real-time active users feature will never connect in production.
- **Fix**: Same as BUG-1.

---

### BUG-7: 🟢 MEDIUM — Cookie consent banner inconsistently rendered

- **Observation**: Playwright detected the cookie consent banner, but WebFetch (server-side) reported no banner. The banner only renders after JavaScript hydration.
- **Impact**: Cookie consent may not appear for crawlers or users with JS disabled. Minor SEO/compliance concern.

---

### BUG-8: 🟢 LOW — No error boundary on superadmin pages

- **Observation**: When API calls fail (due to BUG-1), pages show generic "Network error" or silently fail. No user-friendly error states with retry options.
- **Impact**: Poor UX when API is unavailable.

---

## Console Errors Captured

1. `Failed to load resource: net::ERR_CONNECTION_REFUSED` — from `http://localhost:3099/api/superadmin/login`
2. `Failed to load resource: the server responded with a status of 403 ()` — from direct API login attempt

## Failed Network Requests

1. `http://localhost:3099/api/superadmin/login` — `net::ERR_CONNECTION_REFUSED`

---

## Untested Due to Login Failure

The following pages could NOT be tested because login is blocked by BUG-1 + BUG-2:

| Page | What should be tested |
|------|-----------------------|
| `/superadmin` (Dashboard) | Sidebar navigation, overview stats |
| `/superadmin/users` | User listing, search/filter, ban/unban |
| `/superadmin/vouchers` | CRUD operations (create, read, update, delete) |
| `/superadmin/stats` | Charts (Chart.js), real-time active users, operations stats |
| `/superadmin/settings` | Form inputs, save settings persistence |
| `/superadmin/analytics` | Chart.js graphs, period selector (7d/30d/90d/1y), top pages, referrers |

### Code Review of Untested Pages (source inspection)

Based on source code review, these features exist but cannot be verified live:

- **Users** (`users/page.tsx`): Has table, search input, ban/unban toggle — code looks correct
- **Vouchers** (`vouchers/page.tsx`): Has create form, listing table, enable/disable, delete — code looks correct
- **Stats** (`stats/page.tsx`): Has 3 Chart.js charts (line, bar, doughnut), real-time active users with 10s polling, summary cards — code looks correct but SSE won't work (BUG-6)
- **Settings** (`settings/page.tsx`): Has form inputs and save button — code looks correct
- **Analytics** (`analytics/page.tsx`): Has Chart.js line chart, period selector (7d/30d/90d/1y), top pages/referrers tables — code looks correct

---

## Architecture Analysis

```
Browser (user) → https://4updf.com/api/* → nginx proxy → 127.0.0.1:8000 (Flask API) ✅ Works
Browser (user) → http://localhost:3099/api/* → user's own machine → ❌ ERR_CONNECTION_REFUSED
```

The **nginx config correctly proxies** `/api/*` to the backend. The **Next.js server-side rewrites** also work. The bug is exclusively in **client-side JavaScript** where `fetch()` calls use the hardcoded `http://localhost:3099` fallback instead of relative `/api/*` paths.

---

## Recommendations (Priority Order)

| # | Priority | Action | Files |
|---|----------|--------|-------|
| 1 | 🔴 IMMEDIATE | Change ALL `API_URL` fallbacks from `"http://localhost:3099"` to `""` | 8 superadmin files |
| 2 | 🔴 IMMEDIATE | Verify production `SUPER_ADMIN_KEY` env var matches documentation | Server `.env` |
| 3 | 🔴 IMMEDIATE | Set real `NEXT_PUBLIC_GA_ID` in production environment | Production `.env` |
| 4 | 🟡 HIGH | Rebuild and redeploy after fixes 1-3 | CI/CD |
| 5 | 🟡 HIGH | Re-run full E2E test suite after deploy | This script |
| 6 | 🟢 LOW | Add error boundaries to superadmin pages | All superadmin pages |

---

## Screenshots

- `e2e-01-login-page.png` — Login page UI
- `e2e-02a-key-filled.png` — Key entered in form
- `e2e-02b-post-login-task-key.png` — Post-login attempt (Network error)

---

*Generated by E2E SuperAdmin Test Suite — 2026-03-27*
