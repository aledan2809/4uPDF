/**
 * Server-side proxy for the CAS (Carusel de Ads) render endpoint in
 * MarketingAutomation (ma.techbiz.ae).
 *
 * Why this exists: MA's /api/cas/render is gated by CAS_API_KEY in production.
 * The key must NOT live in the browser bundle, so the CasCarousel client calls
 * this same-origin proxy instead; the proxy attaches X-API-Key server-side and
 * forwards to MA. Track (image beacon) and click (302 redirect) are keyless and
 * stay direct from the browser — only render needs the key.
 *
 * Fails soft: missing key / upstream error / 204 all return `{ ad: null }` with
 * HTTP 200 so the carousel collapses gracefully and never surfaces an error.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CAS_BASE = (
  process.env.CAS_BASE ||
  process.env.NEXT_PUBLIC_CAS_BASE ||
  "https://ma.techbiz.ae"
).replace(/\/+$/, "");

const EMPTY = JSON.stringify({ ad: null });

function emptyResponse() {
  return new Response(EMPTY, {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export async function GET(req: Request) {
  const apiKey = process.env.CAS_API_KEY;
  if (!apiKey) return emptyResponse();

  const inUrl = new URL(req.url);
  const placement = inUrl.searchParams.get("placement");
  if (!placement) return emptyResponse();

  // Whitelist + length-cap the params we forward (avoids open-proxy abuse).
  const out = new URLSearchParams();
  out.set("placement", placement.slice(0, 60));
  out.set("format", "json");
  const n = inUrl.searchParams.get("n");
  if (n && /^\d{1,2}$/.test(n)) out.set("n", n);
  const source = inUrl.searchParams.get("source");
  out.set("source", (source || "4updf").slice(0, 60));
  const visitor = inUrl.searchParams.get("visitor");
  if (visitor) out.set("visitor", visitor.slice(0, 128));

  try {
    const res = await fetch(`${CAS_BASE}/api/cas/render?${out}`, {
      method: "GET",
      headers: { "X-API-Key": apiKey },
      cache: "no-store",
    });
    if (res.status === 204 || !res.ok) return emptyResponse();
    const text = await res.text();
    return new Response(text, {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch {
    return emptyResponse();
  }
}
