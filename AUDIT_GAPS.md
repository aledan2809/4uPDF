# Audit Gaps — 4uPDF

**Project safety**: NO-TOUCH CRITIC (per `Master/CLASSIFICATION.md` §2.3 — especially the `OCR-split` module; prod live at `4updf.com` VPS2)
**Last updated**: 2026-04-24
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

_No gaps identified yet. This ledger was scaffolded on 2026-04-24 to comply with Master `CLAUDE.md` §2d. Populate via the next E2E Audit run (`Optimise run` / ML2 wave)._

| Gap ID | Severity | Area | Description | Status | Resolution |
|--------|----------|------|-------------|--------|------------|
| — | — | — | — | — | — |

---

## Reports index

- `Reports/AUDIT-<date>.md` — individual audit reports
- `Reports/DIRECT-CHANGES-YYYY-MM.md` — monthly Direct-session change log
