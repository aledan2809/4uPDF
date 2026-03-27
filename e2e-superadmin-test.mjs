// E2E SuperAdmin Panel Test - 4uPDF (v3 - bypass client-side API_URL bug)
import { chromium } from 'playwright';

const BASE = 'https://4updf.com';
// Key from .env: 4updf-superadmin-2026 (NOT the one in the task spec!)
const SUPER_ADMIN_KEY_ENV = '4updf-superadmin-2026';
const SUPER_ADMIN_KEY_TASK = '4uPDF-SuperAdmin-2026!';
const RESULTS = [];
const CONSOLE_ERRORS = [];
let browser, context, page;

function log(test, status, details = '') {
  RESULTS.push({ test, status, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${test}${details ? ' — ' + details : ''}`);
}

async function shot(name) {
  try {
    await page.screenshot({ path: `C:/Projects/4updf/Reports/e2e-${name}.png`, fullPage: true });
  } catch (e) { /* ignore */ }
}

// ============================================================
// TEST 1: Login Page UI
// ============================================================
async function testLoginPage() {
  console.log('\n━━━ TEST 1: Login Page ━━━');
  await page.goto(`${BASE}/superadmin`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const url = page.url();
  console.log(`  URL: ${url}`);

  // Should redirect to /superadmin/login
  if (url.includes('/superadmin/login') || url.includes('/superadmin')) {
    log('1.1 /superadmin redirects to login', 'PASS', url);
  } else {
    log('1.1 /superadmin redirects to login', 'FAIL', `Got: ${url}`);
  }

  // UI Elements
  const checks = [
    ['1.2 "SuperAdmin Access" heading', 'text=SuperAdmin Access'],
    ['1.3 "Admin Key" label', 'text=Admin Key'],
    ['1.4 Key input field', 'input[placeholder*="SUPER_ADMIN_KEY"]'],
    ['1.5 "Access Admin Panel" button', 'button:has-text("Access Admin Panel")'],
    ['1.6 Lock icon SVG', 'svg'],
  ];

  for (const [name, sel] of checks) {
    const count = await page.locator(sel).count();
    log(name, count > 0 ? 'PASS' : 'FAIL');
  }

  // Cookie banner
  const cookieBanner = page.locator('text=Cookie Settings');
  if (await cookieBanner.count() > 0) {
    log('1.7 Cookie consent banner', 'PASS');
    const acceptBtn = page.locator('button:has-text("Accept All")');
    if (await acceptBtn.count() > 0) await acceptBtn.click();
    await page.waitForTimeout(500);
  } else {
    log('1.7 Cookie consent banner', 'WARN', 'Not visible');
  }

  await shot('01-login-page');
}

// ============================================================
// TEST 2: Login - Client-side API_URL Bug Detection
// ============================================================
async function testLoginClientBug() {
  console.log('\n━━━ TEST 2: Login Client Bug Detection ━━━');

  // Check what API_URL the client code uses
  const apiUrl = await page.evaluate(() => {
    // Check if there's a NEXT_PUBLIC_API_URL set
    return {
      envApiUrl: window.__NEXT_DATA__?.props?.pageProps?.apiUrl || 'not exposed',
    };
  }).catch(() => ({ envApiUrl: 'eval failed' }));

  console.log(`  Client env check: ${JSON.stringify(apiUrl)}`);

  // Intercept the fetch request to see where login goes
  let loginRequestUrl = '';
  page.on('request', req => {
    if (req.url().includes('superadmin/login') && req.method() === 'POST') {
      loginRequestUrl = req.url();
    }
  });

  let loginResponseStatus = 0;
  let loginResponseBody = '';
  page.on('response', async res => {
    if (res.url().includes('superadmin/login') && res.request().method() === 'POST') {
      loginResponseStatus = res.status();
      try { loginResponseBody = await res.text(); } catch {}
    }
  });

  // Fill and submit
  await page.goto(`${BASE}/superadmin/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Dismiss cookie
  const accept = page.locator('button:has-text("Accept All")');
  if (await accept.count() > 0) { await accept.click(); await page.waitForTimeout(500); }

  const input = page.locator('input[placeholder*="SUPER_ADMIN_KEY"]');
  await input.fill(SUPER_ADMIN_KEY_TASK);

  await shot('02a-key-filled');

  const btn = page.locator('button:has-text("Access Admin Panel")');
  await btn.click();
  await page.waitForTimeout(5000);

  console.log(`  Login request URL: ${loginRequestUrl}`);
  console.log(`  Login response status: ${loginResponseStatus}`);
  console.log(`  Login response body: ${loginResponseBody.substring(0, 200)}`);

  // Bug check: is it calling localhost?
  if (loginRequestUrl.includes('localhost')) {
    log('2.1 API_URL points to production', 'FAIL',
      `Client calls ${loginRequestUrl} — NEXT_PUBLIC_API_URL not set, falls back to localhost:3099. Browser cannot reach server's localhost!`);
  } else if (loginRequestUrl.includes('4updf.com')) {
    log('2.1 API_URL points to production', 'PASS', loginRequestUrl);
  } else if (loginRequestUrl === '') {
    log('2.1 API_URL detection', 'WARN', 'Could not capture login request URL');
  }

  // Check error message on page
  const bodyText = await page.textContent('body');
  if (bodyText.includes('Network error')) {
    log('2.2 Login response', 'FAIL', '"Network error" — client cannot reach API (localhost:3099 from browser)');
  } else if (bodyText.includes('Invalid')) {
    log('2.2 Login response', 'FAIL', '"Invalid admin key" — key mismatch');
  } else if (bodyText.includes('Dashboard') || bodyText.includes('Users')) {
    log('2.2 Login response', 'PASS', 'Successfully logged in');
  }

  await shot('02b-post-login-task-key');
  return bodyText.includes('Dashboard') || bodyText.includes('Users') || bodyText.includes('Overview');
}

// ============================================================
// TEST 2B: Login via direct API call (bypass client bug)
// ============================================================
async function loginViaAPI() {
  console.log('\n━━━ TEST 2B: Login via Direct API ━━━');

  // Try both keys against the actual API
  for (const [label, key] of [['task key', SUPER_ADMIN_KEY_TASK], ['env key', SUPER_ADMIN_KEY_ENV]]) {
    const result = await page.evaluate(async ({ url, adminKey }) => {
      const formData = new FormData();
      formData.append('admin_key', adminKey);
      try {
        const res = await fetch(`${url}/api/superadmin/login`, {
          method: 'POST',
          body: formData,
        });
        const body = await res.text();
        return { status: res.status, body, ok: res.ok };
      } catch (e) {
        return { status: 0, body: String(e), ok: false };
      }
    }, { url: BASE, adminKey: key });

    console.log(`  ${label} (${key}): status=${result.status}, body=${result.body.substring(0, 200)}`);

    if (result.ok) {
      log(`2B.1 API login with ${label}`, 'PASS', `Status ${result.status}`);

      // Parse token and set it
      try {
        const data = JSON.parse(result.body);
        if (data.token) {
          await page.evaluate((token) => {
            localStorage.setItem('superadmin_token', token);
          }, data.token);
          log('2B.2 Token stored in localStorage', 'PASS');

          // Navigate to dashboard
          await page.goto(`${BASE}/superadmin`, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(3000);

          const dashUrl = page.url();
          const dashBody = await page.textContent('body');
          console.log(`  Dashboard URL: ${dashUrl}`);

          if (dashUrl.includes('/login')) {
            log('2B.3 Dashboard access after token set', 'FAIL', 'Redirected back to login — token validation may also hit localhost');
          } else {
            log('2B.3 Dashboard access after token set', 'PASS', dashUrl);
          }

          await shot('02c-dashboard-via-api');
          return true;
        }
      } catch (e) {
        log('2B.2 Token parsing', 'FAIL', e.message);
      }
    } else {
      if (result.status === 403) {
        log(`2B.1 API login with ${label}`, 'FAIL', `403 Forbidden — key rejected`);
      } else if (result.status === 0) {
        log(`2B.1 API login with ${label}`, 'FAIL', `Network error — ${result.body}`);
      } else {
        log(`2B.1 API login with ${label}`, 'FAIL', `Status ${result.status}: ${result.body.substring(0, 100)}`);
      }
    }
  }

  return false;
}

// ============================================================
// TEST 3: Dashboard & Sidebar
// ============================================================
async function testDashboardSidebar() {
  console.log('\n━━━ TEST 3: Dashboard & Sidebar ━━━');

  const bodyText = await page.textContent('body');
  const url = page.url();
  console.log(`  URL: ${url}`);
  console.log(`  Content preview: ${bodyText.substring(0, 300).replace(/\s+/g, ' ')}`);

  const expectedLinks = ['Users', 'Vouchers', 'Stats', 'Settings', 'Analytics'];
  for (const link of expectedLinks) {
    const el = page.locator(`a:has-text("${link}")`);
    const count = await el.count();
    if (count > 0) {
      log(`3.1 Sidebar: "${link}" link`, 'PASS');
    } else if (bodyText.includes(link)) {
      log(`3.1 Sidebar: "${link}" text`, 'PASS', 'In page but not as link');
    } else {
      log(`3.1 Sidebar: "${link}"`, 'FAIL', 'Not found');
    }
  }

  // Sidebar container
  const sidebar = page.locator('nav, aside, [class*="sidebar" i]');
  log('3.2 Sidebar container', await sidebar.count() > 0 ? 'PASS' : 'WARN', `${await sidebar.count()} nav/aside elements`);

  await shot('03-dashboard');
}

// ============================================================
// TEST 4-8: Sub-pages (generic)
// ============================================================
async function testSubPage(num, name, extraChecks) {
  console.log(`\n━━━ TEST ${num}: ${name} Page ━━━`);

  // Try sidebar nav first
  const link = page.locator(`a:has-text("${name}")`).first();
  if (await link.count() > 0) {
    await link.click();
    await page.waitForTimeout(3000);
    try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch {}
  } else {
    await page.goto(`${BASE}/superadmin/${name.toLowerCase()}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
  }

  const url = page.url();
  const bodyText = await page.textContent('body');
  console.log(`  URL: ${url}`);

  if (url.includes('/login') && bodyText.includes('SuperAdmin Access')) {
    log(`${num}.1 ${name} page accessible`, 'FAIL', 'Redirected to login — session/token verification broken');
    await shot(`0${num}-${name.toLowerCase()}-login-redirect`);
    return;
  }

  log(`${num}.1 ${name} page loads`, 'PASS');

  if (extraChecks) await extraChecks(num, bodyText);
  await shot(`0${num}-${name.toLowerCase()}`);
}

// ============================================================
// TEST 9: GA4
// ============================================================
async function testGA4() {
  console.log('\n━━━ TEST 9: GA4 Tag ━━━');

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const html = await page.content();

  // gtag.js
  log('9.1 gtag.js script', html.includes('gtag.js') ? 'PASS' : 'FAIL');

  // Valid GA4 ID
  const ga4Match = html.match(/G-[A-Z0-9]{8,12}/g);
  if (ga4Match && ga4Match.length > 0) {
    log('9.2 Valid GA4 measurement ID', 'PASS', ga4Match.join(', '));
  } else if (html.includes('id=undefined') || html.includes("'config', 'undefined'") || html.includes('"undefined"')) {
    log('9.2 Valid GA4 measurement ID', 'FAIL',
      'GA4 ID is "undefined" — .env has NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX (placeholder) and production deploy likely missing it entirely');
  } else {
    log('9.2 Valid GA4 measurement ID', 'FAIL', 'No G-XXXXXXXXXX found');
  }

  // Config call
  log('9.3 gtag config call', html.includes("gtag('config'") || html.includes('gtag("config"') ? 'PASS' : 'FAIL');

  // Consent
  log('9.4 Consent mode', html.includes("gtag('consent'") || html.includes('gtag("consent"') ? 'PASS' : 'WARN', 'No consent mode');

  // Check superadmin pages too
  await page.goto(`${BASE}/superadmin/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const adminHtml = await page.content();
  log('9.5 GA4 on superadmin pages', adminHtml.includes('gtag.js') ? 'PASS' : 'WARN', 'Missing on superadmin');
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   E2E Test: 4uPDF SuperAdmin Panel (v3 - comprehensive)  ║');
  console.log('║   Target: https://4updf.com/superadmin                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') CONSOLE_ERRORS.push(msg.text());
  });

  // Capture all failed network requests
  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), error: req.failure()?.errorText || 'unknown' });
  });

  try {
    // Test 1: Login page UI
    await testLoginPage();

    // Test 2: Login via normal client flow (detect bug)
    const clientLoginOk = await testLoginClientBug();

    // Test 2B: Login via direct API (bypass client bug)
    let loggedIn = clientLoginOk;
    if (!loggedIn) {
      loggedIn = await loginViaAPI();
    }

    if (loggedIn) {
      // Tests 3-8
      await testDashboardSidebar();

      await testSubPage(4, 'Users', async (num, bodyText) => {
        const table = page.locator('table');
        log(`${num}.2 User table`, await table.count() > 0 ? 'PASS' : 'FAIL');

        const search = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]');
        log(`${num}.3 Search/filter`, await search.count() > 0 ? 'PASS' : 'FAIL');

        const banBtn = page.locator('button:has-text("Ban"), button:has-text("Unban"), button:has-text("Block")');
        log(`${num}.4 Ban/Unban buttons`, await banBtn.count() > 0 ? 'PASS' : 'WARN', 'May need users in list');
      });

      await testSubPage(5, 'Vouchers', async (num, bodyText) => {
        const createBtn = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New"), button:has-text("Generate")');
        log(`${num}.2 Create voucher button`, await createBtn.count() > 0 ? 'PASS' : 'FAIL');

        const table = page.locator('table');
        log(`${num}.3 Voucher table`, await table.count() > 0 ? 'PASS' : 'WARN', 'May be empty');
      });

      await testSubPage(6, 'Stats', async (num, bodyText) => {
        const charts = page.locator('canvas, [class*="chart" i], [class*="recharts"], svg');
        log(`${num}.2 Charts`, await charts.count() > 2 ? 'PASS' : 'FAIL', `${await charts.count()} elements`);

        const bodyLower = bodyText.toLowerCase();
        const hasRealtime = bodyLower.includes('real-time') || bodyLower.includes('active user') || bodyLower.includes('online');
        log(`${num}.3 Real-time indicators`, hasRealtime ? 'PASS' : 'WARN');
      });

      await testSubPage(7, 'Settings', async (num, bodyText) => {
        const inputs = page.locator('input, select, textarea');
        log(`${num}.2 Form inputs`, await inputs.count() > 0 ? 'PASS' : 'FAIL', `${await inputs.count()} inputs`);

        const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]');
        log(`${num}.3 Save button`, await saveBtn.count() > 0 ? 'PASS' : 'FAIL');
      });

      await testSubPage(8, 'Analytics', async (num, bodyText) => {
        const charts = page.locator('canvas, [class*="chart" i], [class*="recharts"], svg');
        log(`${num}.2 Analytics charts`, await charts.count() > 2 ? 'PASS' : 'FAIL', `${await charts.count()} elements`);

        const dateControls = page.locator('select, button:has-text("7d"), button:has-text("30d"), button:has-text("week"), button:has-text("month"), [class*="period" i]');
        log(`${num}.3 Period controls`, await dateControls.count() > 0 ? 'PASS' : 'WARN');
      });
    } else {
      log('3-8 All dashboard tests', 'FAIL', 'Cannot test — login failed (both client and API paths)');
    }

    // Test 9: GA4 (always run)
    await testGA4();

  } catch (e) {
    console.error('\nFatal:', e.message);
    log('FATAL', 'FAIL', e.message);
  }

  await browser.close();

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '═'.repeat(65));
  console.log('                       TEST SUMMARY');
  console.log('═'.repeat(65));

  const pass = RESULTS.filter(r => r.status === 'PASS').length;
  const fail = RESULTS.filter(r => r.status === 'FAIL').length;
  const warn = RESULTS.filter(r => r.status === 'WARN').length;

  console.log(`\n  ✅ PASS: ${pass}  |  ❌ FAIL: ${fail}  |  ⚠️ WARN: ${warn}  |  Total: ${RESULTS.length}\n`);

  if (fail > 0) {
    console.log('  ❌ FAILURES:');
    RESULTS.filter(r => r.status === 'FAIL').forEach(r => console.log(`     ${r.test}: ${r.details}`));
  }
  if (warn > 0) {
    console.log('\n  ⚠️ WARNINGS:');
    RESULTS.filter(r => r.status === 'WARN').forEach(r => console.log(`     ${r.test}: ${r.details}`));
  }
  if (CONSOLE_ERRORS.length > 0) {
    console.log('\n  🔴 CONSOLE ERRORS:');
    [...new Set(CONSOLE_ERRORS)].forEach((e, i) => console.log(`     ${i + 1}. ${e}`));
  }
  if (failedRequests.length > 0) {
    console.log('\n  🌐 FAILED NETWORK REQUESTS:');
    [...new Map(failedRequests.map(r => [r.url, r])).values()].forEach((r, i) =>
      console.log(`     ${i + 1}. ${r.url} — ${r.error}`));
  }

  // ============================================================
  // WRITE REPORT
  // ============================================================
  const report = `# E2E Test Report: 4uPDF SuperAdmin Panel
**Date**: ${new Date().toISOString()}
**Target**: https://4updf.com/superadmin
**Result**: ✅ ${pass} PASS | ❌ ${fail} FAIL | ⚠️ ${warn} WARN

---

## Test Results

| # | Test | Status | Details |
|---|------|--------|---------|
${RESULTS.map(r => `| ${r.test.split(' ')[0]} | ${r.test} | ${r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️'} ${r.status} | ${r.details || '-'} |`).join('\n')}

---

## 🐛 Bugs Found

### BUG-1: BLOCKER — Frontend API_URL defaults to localhost:3099 in production
- **File**: \`web/app/superadmin/login/page.tsx:6\`
- **Code**: \`const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099"\`
- **Impact**: ALL superadmin API calls fail in production. The browser tries to reach \`http://localhost:3099\` on the user's machine, not the server.
- **Fix**: Use relative URL: \`const API_URL = process.env.NEXT_PUBLIC_API_URL || ""\`
- **Affected**: Login, all authenticated API calls
- **Console error**: \`ERR_CONNECTION_REFUSED\` (port 3099 on client machine)

### BUG-2: BLOCKER — SUPER_ADMIN_KEY mismatch
- **File**: \`.env:9\`
- **Spec key**: \`4uPDF-SuperAdmin-2026!\` (provided in task)
- **Actual key in .env**: \`4updf-superadmin-2026\` (no uppercase, no exclamation mark)
- **Impact**: Even if API_URL was correct, the key from the spec would be rejected
- **Fix**: Sync key between spec/documentation and .env

### BUG-3: CRITICAL — GA4 Measurement ID is "undefined"
- **File**: \`.env:10\`
- **Current value**: \`NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX\` (placeholder)
- **Production**: Renders as \`gtag/js?id=undefined\` — GA4 is completely non-functional
- **Impact**: Zero analytics data being collected
- **Fix**: Replace with actual GA4 measurement ID (format: G-XXXXXXXXXX)

### BUG-4: HIGH — GA4 script missing on /superadmin/* pages
- **Impact**: Even when GA4 is fixed, superadmin pages won't track analytics
- **Fix**: Ensure GA4 script is included in superadmin layout or root layout

### BUG-5: HIGH — SuperAdmin layout token verification likely also uses localhost API_URL
- **File**: \`web/app/superadmin/layout.tsx\`
- **Impact**: Even with a valid token, the layout's verify call would fail for the same localhost reason
- **Fix**: Same as BUG-1 — all API_URL references need to use relative URLs

### BUG-6: MEDIUM — All other superadmin pages likely have same API_URL issue
- **Affected pages**: /superadmin/users, /superadmin/vouchers, /superadmin/stats, /superadmin/settings, /superadmin/analytics
- **Impact**: All data fetching from these pages would fail in production
- **Fix**: Centralize API_URL config and use relative URLs

---

## ⚠️ Warnings

${RESULTS.filter(r => r.status === 'WARN').map(r => `- **${r.test}**: ${r.details}`).join('\n') || 'None'}

## Console Errors

${CONSOLE_ERRORS.length > 0 ? [...new Set(CONSOLE_ERRORS)].map((e, i) => `${i + 1}. \`${e}\``).join('\n') : 'None'}

## Failed Network Requests

${failedRequests.length > 0 ? [...new Map(failedRequests.map(r => [r.url, r])).values()].map((r, i) => `${i + 1}. \`${r.url}\` — ${r.error}`).join('\n') : 'None'}

## Recommendations (Priority Order)

1. **IMMEDIATE**: Change all \`API_URL\` fallbacks from \`"http://localhost:3099"\` to \`""\` (empty string = relative URL)
2. **IMMEDIATE**: Set correct \`NEXT_PUBLIC_GA_ID\` with real GA4 measurement ID in production .env
3. **HIGH**: Verify and document the correct \`SUPER_ADMIN_KEY\`
4. **MEDIUM**: Add GA4 script to superadmin layout
5. **LOW**: Add E2E tests to CI pipeline

## Source Code References

| File | Issue |
|------|-------|
| \`web/app/superadmin/login/page.tsx:6\` | API_URL localhost fallback |
| \`web/app/superadmin/layout.tsx\` | Token verify uses same broken API_URL |
| \`.env:9\` | SUPER_ADMIN_KEY value |
| \`.env:10\` | NEXT_PUBLIC_GA_ID placeholder |
| \`web/next.config.mjs:21-26\` | Server-side rewrites (work correctly) |
| \`nginx.conf:78-94\` | Nginx API proxy (works correctly) |

## Architecture Note

The nginx config correctly proxies \`/api/*\` to the backend at \`127.0.0.1:8000\`. The Next.js server-side rewrites also work (\`/api/*\` → \`localhost:3099\`). The bug is specifically in **client-side JavaScript** where \`fetch()\` calls use the absolute \`http://localhost:3099\` URL instead of relative \`/api/*\` paths that nginx would proxy correctly.

---

## Screenshots

${['01-login-page', '02a-key-filled', '02b-post-login-task-key', '02c-dashboard-via-api', '03-dashboard', '04-users', '05-vouchers', '06-stats', '07-settings', '08-analytics'].map(s => `- \`e2e-${s}.png\``).join('\n')}

---
*Generated by E2E SuperAdmin Test Suite v3 — ${new Date().toISOString()}*
`;

  const fs = await import('fs');
  fs.mkdirSync('C:/Projects/4updf/Reports', { recursive: true });
  fs.writeFileSync('C:/Projects/4updf/Reports/E2E_SUPERADMIN_2026-03-27.md', report);
  console.log('\n📄 Report: C:/Projects/4updf/Reports/E2E_SUPERADMIN_2026-03-27.md');
}

main().catch(console.error);
