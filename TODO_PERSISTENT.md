# TODO Persistent — 4uPDF

> **IMPORTANT:** Read at start of EVERY session on this project. Surface OPEN items.
> Items stay here until marked DONE with date + commit hash.
> **Project safety**: ACTIVE — EXCEPT `web/app/split-ocr/` = **NO-TOUCH CRITIC**.
> **Production**: 4updf.com (VPS2, `4updf-api.service`:3099 + `4updf-web.service`:3098 `next start`).
> **Git note** (post 2026-06-02 reconcile): `master` = deployed line; `improvements-undeployed-2026-06` = origin's never-deployed security/proxy/a11y. Deploy = push master → server `git pull --ff-only git@github.com:aledan2809/4uPDF.git master` (SSH) → build-first → restart api+web. DB `data/4updf.db` is untracked (don't re-track). See memory `project_4updf_state`.

---

## [~] 💰 CAS ad carousel — monetize 4uPDF pageviews (creat 2026-06-03; DEV-COMPLETE 2026-06-03, deploy deferat la item C)

**STATUS 2026-06-03**: cod livrat + verificat runtime local; **deploy deferat** la sesiunea de unify git (item C din handoff Master), care va face build+deploy consolidat + True E2E [10].

**Ce s-a livrat** (branch `deployed-work`):
- `web/app/components/CasCarousel.tsx` — carusel consumer CAS: lazy (IntersectionObserver), fetch paralel pe sloturi, rotație auto cu pauză (hover/focus + buton pause/play WCAG 2.2.2 + prefers-reduced-motion), impression beacon (1×/trackingCode), click via `clickUrl`, a11y (aria-live, dots), hidden pentru paid users, fail-soft (nu crapă pagina niciodată).
- `web/app/api/cas/render/route.ts` — **proxy server-side** (NOU). Necesar fiindcă MA `/api/cas/render` e gated de `CAS_API_KEY` în producție; proxy-ul ține cheia server-side (nu în bundle) și forwardează la MA. Track + click rămân keyless (browser-direct). Fail-soft → `{ad:null}`.
- `web/app/lib/auth.tsx` — helper `shouldShowAds(user)` (single source of truth, case-insensitive) reutilizat de AdsBanner + SponsoredBanner + CasCarousel.
- Mount: `ToolPageLayout` (toate `/tools/*` + tool pages legacy, după SponsoredBanner) + landing `/` (înainte de FAQ). **NU** în split-ocr (NO-TOUCH), **NU** în SuperAdmin.

**Verificat**: tsc 0 erori reale · `next build` exit 0 (102 pagini) · runtime smoke local (proxy + cheie → 200 + ad live `AUTO-0CB6` cross-promo 4PRO; fără placement → `{ad:null}`; `/` + `/tools/merge-pdf` → 200) · `/review` high (8 findings → toate reparate).

**⚠️ DEPLOY REQUIREMENT** (item C): setează `CAS_API_KEY` în env-ul *web* 4uPDF pe VPS2 (`/var/www/4updf` consumat de `next start` :3098) + restart `4updf-web`. Fără el proxy-ul întoarce `{ad:null}` (carousel colapsează safe). Cheia e în `Master/credentials/4updf.env` (aceeași ca MA/TeInformez). Optional `CAS_BASE` (default `https://ma.techbiz.ae`).

**Note**: WEBSITE_INFEED are ad live; WEBSITE_SIDEBAR/DASHBOARD_BANNER/NEWSLETTER_TOP au întors 500 pe MA (placement-uri fără ads eligibile → MA-side, nu blochează 4uPDF care folosește INFEED).

---

## [archive] 💰 CAS ad carousel — cerere originală (creat 2026-06-03)

**Cerere user**: pune caruselul de reclame CAS (ca în MA / consumat de TeInformez) pe 4uPDF, pe **fiecare pagină unde intră userul** — măcar să monetizăm din vizualizări.

**Ce e CAS**: modulul **Carusel de Ads** trăiește în **MarketingAutomation** (`ma.techbiz.ae`). Reusable cross-promo pe 5 suprafețe: newsletter, **JS widget**, React **`<CasBanner>`**, dashboard banner, Web Push (VAPID). Endpoints publice CORS `*`: render/click/widget (`/api/cas/render`, `/api/cas/click/[trackingCode]`, widget). Metrici JSONB atomice (impressions/clicks). Ref: `MarketingAutomation/CLAUDE.md` + `MarketingAutomation/knowledge/launch-plan-module.md`.

**4uPDF = consumer** (NU se reimplementează CAS aici — golden rule ECOSYSTEM_REGISTRY):
- Integrează `<CasBanner>` (React) sau JS widget în layout-ul site-ului, pe paginile de tool + landing (NU în split-ocr NO-TOUCH fără grijă; NU în SuperAdmin).
- Plasare: slot non-intruziv (ex. sub upload zone / între rezultate / footer-area) pe fiecare `/tools/*` + `/` + paginile top-level (`/merge-pdf` etc.).
- Tracking: impression la afișare + click → CAS endpoints MA (cross-origin, CORS deja `*`). Folosește `trackingCode` per ad.
- Atenție performanță: lazy-load, fără să strice LCP/CLS pe paginile de tool (a11y/perf contează — vezi audit-uri).
- Config: ce campanii/ads se rotesc pe 4uPDF (proiect/slot) se setează în MA, nu hardcodat aici.

**Cross-impact**: e o integrare 4uPDF (ACTIVE) care consumă MA (ACTIVE). Nu atinge split-ocr. Estimat ~2-4h.
**Posibil prerequisite**: confirmă că `<CasBanner>`/widget-ul MA e gata de consum extern (a fost folosit de TeInformez?) — verifică în MA înainte.

---

## [ ] 🎯 Identifică vizitatorul recurent + convertește-l în cont (creat 2026-06-03)

**Cerere user**: cum identificăm un user care a mai fost pe site și încercăm să-l convertim cu cont?

**Ce avem deja** (de reutilizat, NU de la zero):
- Tabel `anonymous_usage` (fingerprint canvas+WebGL + `local_token` + `pages_used_today` / `total_pages_all_time` / `first_seen` / `last_seen`) — deja există tracking de vizitator anonim recurent.
- `analytics_events` (pageview + referrer + UTM de la fix-ul 2026-06-02) + `heartbeats` (real-time).
- First-touch acquisition în localStorage `_4u_acq` (de la feature-ul referral) — sursa/grupul din care a venit.

**De construit (plan de propus)**:
1. **Detecție „returning visitor"**: la load, dacă `anonymous_usage` (prin `local_token`/fingerprint) arată `total_pages_all_time > N` SAU `first_seen` mai vechi de X zile ȘI user ne-logat → marchează „recurent".
2. **Prompt de conversie** non-intruziv: după ce a folosit ≥1-2 tool-uri (sau la al 2-lea vizit), arată un modal/bară soft: „Ai mai folosit 4uPDF — fă-ți cont gratuit ca să-ți păstrezi istoricul / mărești limita". Folosește datele lui (câte pagini a procesat) ca argument personalizat.
3. **Reducere fricțiune**: pre-fill nimic sensibil; pasează first-touch `_4u_acq` la register (deja se trimite) ca să atribuim conversia la grup/campanie.
4. **Anti-annoyance**: arată prompt-ul max 1×/sesiune sau 1×/X zile (flag în localStorage); respectă dacă userul a dat dismiss.
5. **Măsurare**: log eveniment `conversion_prompt_shown` / `_clicked` în `analytics_events` (action_type) → vezi rata în SuperAdmin.
6. **Opțional avansat**: dacă userul revine după ce a abandonat la upload/limit, target-ează mesajul (ex. „Ai atins limita zilnică — cont gratuit = mai multe pagini").

**Întrebări de clarificat cu userul la start**: ce limită/beneficiu oferim la cont gratuit ca momeală? (pages/day mai mare? istoric? fără ads?) — determină copy-ul prompt-ului. Leagă-l de pricing-ul existent (`plan` free/bronze/silver/gold).

**Cross-impact**: 4uPDF-only (auth + anonymous_usage + UI). Nu atinge split-ocr. Estimat ~3-5h. Sinergie cu item-ul CAS (un „returning visitor" fără cont = și target de ad, și target de conversie).

---

*Ultima actualizare: 2026-06-03*
