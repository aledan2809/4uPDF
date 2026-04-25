# Direct Changes Ledger — 4uPDF — April 2026

> Per Master `CLAUDE.md` §2d (NO-TOUCH CRITIC protocol).
> Each entry: change description + commit hash + ledger items closed (if any) + risk acknowledgement.

---

## 2026-04-25 — Initial governance baseline + Python security hardening + Next.js proxy migration + AI integration

### `ab5d56f` — docs(governance): add AUDIT_GAPS ledger + governance ref + reports
- **Type**: docs (9 files / +944 -0)
- **Risk**: zero — documentation only
- **NO-TOUCH zones touched**: none

### `4c01739` — fix(security): info-disclosure + path-traversal + CORS + auth hardening
- **Type**: security hardening (2 files: api.py + routes.py / +327 -160)
- **Why**: 5 categories of security improvements — info-disclosure (uniform), path-traversal on /api/download, CORS allow_headers tightened, is_banned check on auth, robustness on int parsing.
- **NO-TOUCH zones touched**: NONE — `/api/split-ocr` handler verified absent from diff (`grep -E split-ocr|split_ocr` returns 0 matches), `web/app/split-ocr/page.tsx` neatins (0-line diff)
- **Risk**: low — uniform pattern, no behavioural regression on existing endpoints

### `43a9c0b` — feat(web): API proxy migration + AI integration + L50 tarball pattern
- **Type**: feature + infrastructure (9 files / +253 -3 + binary tarball)
- **Five coordinated changes**:
  1. Rewrite → catch-all `web/app/api/[...path]/route.ts` (functional parity with old next.config rewrite)
  2. AI integration: `routeAI()` wrapper, `/api/ai` Next route, `/api/newsletter` Next route
  3. **L50 tarball pattern** (mandatory): `file:../../AIRouter` failed Turbopack build → switched to `file:vendor/ai-router-1.0.0.tgz`. Build now passes.
  4. Build improvements: `output:standalone`, security headers, image opts, removeConsole on prod, optimizePackageImports
  5. `.gitattributes`: `* text=auto eol=lf` (L43), `*.tgz binary`, `*.tsbuildinfo binary`
- **L41 cascade activated**: 4uPDF is now a NO-TOUCH-cascade consumer of AIRouter. Future AIRouter changes must factor 4uPDF into propose-confirm-apply.
- **NO-TOUCH zones touched**: NONE — `web/app/split-ocr/page.tsx` 0-line diff, `/api/split-ocr` continues to be proxied unchanged
- **Build verified**: `next build` (Next 16.2 + Turbopack) passes locally — all `/tools/*` prerendered, `/api/*` server-rendered on demand
- **Live impact (deferred)**: VPS2 deploy not run by this commit — `4updf.com` still serves the previous build until explicit `/var/www/deploy.sh` invocation

### `a8c29fe` — chore: gitignore *.tsbuildinfo (untrack web/tsconfig.tsbuildinfo)
- **Type**: hygiene
- **Risk**: zero — local incremental builds keep working

**CRLF/LF pollution auto-resolved**: `requirements.txt` and `web/tsconfig.json` were showing as modified due to EOL-only diff. Adding `.gitattributes` with `* text=auto eol=lf` triggered Git's normalisation on next access — pollution dropped from working tree without explicit revert.

---

*Append future entries above this line, newest first.*
