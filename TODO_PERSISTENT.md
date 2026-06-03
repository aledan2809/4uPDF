# TODO Persistent — 4uPDF

> **IMPORTANT:** Read at start of EVERY session on this project. Surface OPEN items.
> Items stay here until marked DONE with date + commit hash.
> **Project safety**: ACTIVE — EXCEPT `web/app/split-ocr/` = **NO-TOUCH CRITIC**.
> **Production**: 4updf.com (VPS2, `4updf-api.service`:3099 + `4updf-web.service`:3098 `next start`).
> **Git note** (post 2026-06-02 reconcile): `master` = deployed line; `improvements-undeployed-2026-06` = origin's never-deployed security/proxy/a11y. Deploy = push master → server `git pull --ff-only git@github.com:aledan2809/4uPDF.git master` (SSH) → build-first → restart api+web. DB `data/4updf.db` is untracked (don't re-track). See memory `project_4updf_state`.

---

## [ ] 💰 Ads strategy — alternare CAS ↔ Google AdSense pe pagini (GATED: ≥100 useri/zi)

**Poartă obligatorie**: NU începe până 4updf.com NU atinge **≥100 useri/zi** susținut (verifică în analytics/`/api/analytics` sau dashboard SuperAdmin înainte de orice lucru). Sub prag = nu merită efortul + AdSense oricum cere trafic real pentru aprobare.

**Context (2026-06-03)**: pe ecranul **AI PDF Assistant** (`/tools/ai-assistant`) am scos placeholder-ele de Ad (AdsBanner top + SponsoredBanner) pentru un chat curat — păstrat doar caruselul **CAS** jos + upgrade prompt (commit `4a40935`, prop `hideAdBanners` în `ToolPageLayout`, default off pe restul). Asta a deschis discuția despre strategia de reclame.

**Stare curentă (2026-06-03, commit `da0edc7`)**: caseta goală **"Advertisement / Ad Space"** (componenta `AdsBanner`) e ascunsă **SITE-WIDE**, temporar, fiindcă nu există încă rețea de reclame → un box gol arăta rupt. Mecanism: flag `ADS_PLACEHOLDER_ENABLED = false` în `web/app/components/AdsBanner.tsx`. **Revenire la ≥100 useri**: fie flip la `true`, fie (recomandat) înlocuiește JSX-ul placeholder cu codul real Google AdSense direct în componentă. `SponsoredBanner` ("Upgrade to remove ads") + caruselul CAS + banner-ul "Create an account" rămân ACTIVE pe tot site-ul.

**Idee user (de implementat DUPĂ prag)**: monetizare mixtă — **alternare CAS ↔ Google AdSense în funcție de pagina pe care intră userul**, ca să nu fie doar cross-promo intern. Ex: pe o pagină randezi caruselul CAS actual, pe alta un carusel Google AdSense → userul care trece prin >1 pagină vede ambele tipuri (CAS pe pagina A, Google Ads pe pagina B), diversificând atât venitul cât și experiența.

**Schiță (de detaliat la implementare)**:
- Mecanism de rotație/alocare per-pagină (ex. deterministic pe slug, sau A/B) care decide: surface CAS vs surface AdSense.
- AdSense necesită cont aprobat + script `adsbygoogle` + slot IDs + consimțământ (vezi itemul **consent gate** — GDPR/CMP obligatoriu înainte de a încărca AdSense în UE).
- Generalizează prin `ToolPageLayout` (un nou slot de ad configurabil), NU special-case per pagină — păstrează `hideAdBanners` existent.
- Respectă `shouldShowAds` (paid users = fără reclame) pe ambele tipuri.

**Pre-cerințe**: (1) ≥100 useri/zi verificat; (2) consent gate / CMP live (AdSense + GDPR); (3) cont AdSense aprobat.

---

## [x] 🔧 nginx /api migration — deploy Next /api routes (AI + newsletter) — DONE 2026-06-03 (LIVE, commit `8b281f3`)

**Context**: deferat din item C (handoff Master). Cele 3 rute Next NEdeployate (`/api/ai`, `/api/newsletter`, `[...path]` catch-all) erau pe `unify-2026-06`; comitul `f0003d3 deploy-safe` le scosese intenționat ca să livreze CAS fără schimbare nginx.

**Livrat (commit `8b281f3` pe origin/master, deployed VPS2)**:
- **`/api/newsletter`** — REZOLVAT complet (era 404 silent-drop). Adăugat endpoint Python `POST /api/newsletter` + tabel `newsletter_subscribers` (INSERT OR IGNORE, idempotent pe email, lowercased+trimmed). Rămâne pe Python :3099 → **zero schimbare nginx pentru newsletter**. Verificat: 200 + rând salvat în DB.
- **`/api/ai`** — livrat pe Next :3098, **auth-gated** (doar useri logați — validează Bearer la Python `/api/auth/me`; 401 altfel; 403-banned blocați). Verificat: nelogat→401, logat→200 `{"content":"PONG","provider":"cohere"}`. Chei AI alimentate în `/var/www/4updf/web/.env.local` (7 providere, fără atingere systemd).
- **`[...path]`** catch-all proxy + `ai-router` lib + tarball vendored — livrate (dormante sub nginx selectiv; folosite doar în dev).
- **nginx**: schimbare SELECTIVĂ — DOAR `location = /api/ai → :3098` adăugat în `/etc/nginx/sites-enabled/4updf`. `location /api/ → :3099` (split-ocr NO-TOUCH + toate uneltele PDF + downloads) **neatins**. Backup la `/root/nginx-backups/`.
- Reconciliat pe linia LIVE (origin/master) → CAS + security/a11y intacte, doar adăugiri, zero ștergeri. L41 vecini toți 200.

**Follow-up-uri descoperite (non-blocker)**:
1. **nginx hygiene**: `sites-enabled/4updf` e **fișier real, NU symlink** spre `sites-available/4updf` — cele două au divergat (sites-available are 2 blocuri-server, sites-enabled 1). Backup-urile NU trebuie puse în `sites-enabled/` (nginx le încarcă prin `include sites-enabled/*` → conflict server_name). De consolidat cândva.
2. **ai-router lib nu sare peste provider fără cheie**: a aruncat `Missing API key: COHERE_API_KEY` în loc să treacă la gemini/groq. Cu cheile prezente e moot, dar dacă cheia Cohere expiră, `/api/ai` dă 500 în loc de fallback. Concern AIRouter (shared lib) — de raportat acolo.
3. ~~**`/api/ai` n-are încă consumator UI**~~ — **DONE 2026-06-03 (LIVE, commit `8062c7a`)**. Ecran nou **AI PDF Assistant** la `/tools/ai-assistant` (chat text-only, login-gated, Bearer→`/api/ai`, system-prompt ghidează spre uneltele 4uPDF, istoric plafonat 12 msg + input cap 2000, a11y `role=log`/`aria-live`, guard atomic anti-double-submit din `/review` high). Discoverability: Navbar Smart Tools + homepage tools grid. Verificat prod: pagina 200, split-ocr+core 200, `/api/ai` nelogat→401, **round-trip real logat→200** (`Compress PDF` recommended, provider cohere). Zero atingere split-ocr/nginx/systemd/Python. Build VPS exit 0, `4updf-web` restart only (api neatins).
4. **git local**: `master` local (`6b77a17`) a divergat de origin/master (`8b281f3`); deploy-ul s-a făcut prin `git push origin nginx-api-deploy:master`. De reconciliat ramura locală cândva.

---

## [x] 💰 CAS ad carousel — monetize 4uPDF pageviews — DONE 2026-06-03 (LIVE pe 4updf.com, commit `822114e`)

**STATUS 2026-06-03 — LIVE + ACTIV**: deployat pe prod via split-deploy (master `822114e`). Caruselul randează **HTML-ul real al MA** (pattern identic cu TeInformez — `format=html` + DOMPurify + inject), NU widget re-construit. Proxy server-side în **Python api.py** (`GET /api/cas/render`, nginx /api→:3099) cu cheia din **settings table DB** (`cas_api_key`, ca Stripe — **fără systemd/env**). Verificat pe prod: `/api/cas/render` → 200 + 1886B markup MA cu link-uri `/api/cas/click/`. Hidden pentru paid (shouldShowAds), lazy, fail-soft (204→collapse). Mount pe ToolPageLayout + landing. split-ocr + nginx neatinse. Cheie/salt în DB (rotate: `sqlite3 data/4updf.db "UPDATE settings SET value=... WHERE key='cas_api_key'"`). Vezi `Master/credentials/4updf.env`.

**[~]→[x] note**: inițial dezvoltat ca rută Next + JSON custom carousel; pivotat la pattern-ul TeInformez (verificat la cererea user) — HTML MA + proxy Python + cheie-în-DB, ceea ce a rezolvat și activarea fără systemd.

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

## [x] 🎯 Identifică vizitatorul recurent + convertește-l în cont — DONE 2026-06-03 (LIVE, commit `822114e`)

**STATUS 2026-06-03**: cod livrat + verificat (build/tsc + SQL unit-test); **deploy deferat** la sesiunea de unify git (item C), care va face deploy + True E2E [10].

**Constatare cheie**: anonim și cont-free au **aceleași limite** (200 pag/zi, 50MB, ads — `api.py PLAN_LIMITS["free"]` se aplică și anonimilor). Deci momeala onestă NU e "mai multe pagini gratis", ci **persistență cross-device + drumul spre planuri fără reclame** (fișiere mai mari / batch vin din planuri plătite). Copy-ul reflectă asta — fără claim înșelător.

**Ce s-a livrat** (branch `deployed-work`):
- `api.py` — endpoint nou `POST /api/track/returning` (additiv): agregă `total_pages_all_time` + `MIN(first_seen)` din `anonymous_usage` pe `local_token` (stabil cross-IP) OR `composite_hash`; întoarce `days_since_first`. Logged-in → `returning:false`.
- `web/app/lib/auth.tsx` — `getReturningStatus()` (reutilizează fingerprint-ul existent) + `trackConversionEvent()` (event_type pe `/api/analytics/track`).
- `web/app/components/ReturningVisitorPrompt.tsx` — toast soft non-blocking (bottom), personalizat ("Ai procesat deja N pagini"), CTA → /signup (pasează first-touch `_4u_acq` la register, deja wired). Anti-annoyance: 1×/sesiune + cooldown escaladat la fiecare show (3→7→30 zile) + 14/60 zile la dismiss/click. **GDPR**: detecția (fingerprint) + tracking + afișare rulează DOAR dacă `cookieConsent.analytics === true` (rezolvă și coliziunea cu cookie-banner). Returning = total≥1 && (≥3 pagini SAU first_seen ≥1 zi). Suprimat pe /split-ocr + /superadmin.
- Mount: root `layout.tsx` în AuthProvider.

**Verificat**: tsc 0 erori · build exit 0 (102 pagini) · SQL unit-test (agregare local_token=8, composite-only=5, vizitator nou=0/not-returning, izolație) · `/review` correctness+quality (fix-uri aplicate: GDPR consent gate, count double-increment, race async `active`-flag, cooldown-on-show anti-nag, returning≥1, rol a11y `complementary`, copy onest).

**Măsurare**: `conversion_prompt_shown/_clicked/_dismissed` în `analytics_events` (event_type) → SuperAdmin analytics.

**⚠️ Follow-up (separat, NU blochează)**: pageview-tracker-ul global din `layout.tsx` + GA fire fără consent gate (pre-existent, nu introdus de mine). Merită un fix ecosystem-wide pe același flag `cookieConsent.analytics`. De evaluat în item C (reconcile layout) sau sesiune dedicată — posibil intenționat ca first-party legitimate-interest, de aceea NU l-am atins silent.

---

## [archive] 🎯 Identifică vizitatorul recurent — cerere originală (creat 2026-06-03)

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
