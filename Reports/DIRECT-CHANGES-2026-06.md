# 4uPDF — Direct Changes Ledger — 2026-06

4uPDF is ACTIVE; the `web/app/split-ocr/` module is NO-TOUCH CRITIC (CLASSIFICATION §2.3 nota 1). Prod changes via propose-confirm-apply, never touching split-ocr.

---

## 2026-06-26 — Deploy browser-tool proxy fix `d376fb9` to VPS2 (4updf.com)

**Mode:** Direct, propose-confirm-apply (user "da" 2026-06-26).
**Commit:** `d376fb9` fix(4updf): route browser-side tool fetches through the proxy (remove hardcoded `localhost:3099`) — fixes 4 batch/extractor tools in prod. Lives on branch `nginx-api-deploy` (pushed to origin).

**Problem:** 5 client components fetched `http://localhost:3099/api/...` directly from the browser → on a real user's machine "localhost" is their own box → the 4 tools (batch-processing, receipt-extractor, invoice-extractor, archive-processor, batch-document-splitter) errored. Fix = relative `/api/...` URLs (routed through nginx proxy). 5 frontend files, trivial find-replace.

**split-ocr:** NOT touched.

**Pre-deploy verification (ground-truth, live):**
- VPS2 `/var/www/4updf` is git, on `master` at `9900e8f` → the prior 45 commits on the `nginx-api-deploy` line are ALREADY live; only `d376fb9` was missing.
- Deployed source still had `localhost:3099` in all 5 pages → tools broken in prod.
- Run method: systemd `4updf-web.service` (`npm start` = next start :3098) + `4updf-api.service` (python :3099).

**Why file-level rsync (not merge→master):** VPS git is in a messy state (master "ahead 32" of origin, `web/package-lock.json` modified, untracked test files + a `web/C:/` artifact dir). Merging would entangle the fix with a separate git-reconciliation cleanup. Minimal surface = ship exactly the 5 corrected files. Source-of-truth fix preserved in `d376fb9` on origin/nginx-api-deploy.

**Apply:**
1. Backup the 5 files on VPS as `*.bak-2026-06-26` (also git-tracked → double rollback path).
2. `rsync` (per-file) the 5 fixed `.tsx` local → VPS.
3. Verify on VPS: 0 `localhost:3099` occurrences in the 5 pages.
4. `cd /var/www/4updf/web && npm run build` (NO `npm install` — deps untouched). Build exit 0.
5. `systemctl restart 4updf-web` → active.

**Post-deploy smoke:**
- `systemctl is-active 4updf-web` → active; local `127.0.0.1:3098/batch-processing` → 200.
- Public: `4updf.com/batch-processing` + `/tools/receipt-extractor` + `/tools/invoice-extractor` → 200.
- Served HTML of `/batch-processing` → **0** occurrences of `localhost:3099` (fix confirmed live).
- L41 VPS2 neighbors: blocx.ro 200, procuchain.com/api/health 200, contakt.knowbest.ro/api/health 200.

**Rollback (if needed):** restore `*.bak-2026-06-26` (or `git checkout -- <5 files>`) → `npm run build` → `systemctl restart 4updf-web`.

**Follow-up (deferred, separate session):** reconcile the VPS git state (master ahead-32 vs origin, modified package-lock, `web/C:/` artifact, untracked test files) + decide nginx-api-deploy → master merge strategy for the other 45 commits' provenance.
