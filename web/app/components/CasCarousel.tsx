"use client";

/**
 * CasCarousel — cross-promo ad carousel for 4uPDF.
 *
 * 4uPDF is a *consumer* of the CAS (Carusel de Ads) module that lives in
 * MarketingAutomation (ma.techbiz.ae). We do NOT reimplement CAS here — we only
 * fetch already-eligible ads from its public, CORS-enabled JSON endpoint, rotate
 * them client-side, and report impressions/clicks back to MA.
 *
 *   render : GET {base}/api/cas/render?placement=&format=json&source=&n=&visitor=
 *            -> { ad: {id, trackingCode, creative:{imageUrl,imageAlt,headline,body,
 *                 ctaText,ctaUrl,brand}, placement}, clickUrl } | { ad: null }  (204)
 *   click  : the clickUrl from render already 302-redirects + counts the click
 *   track  : GET {base}/api/cas/track?event=impression&trackingCode=&source=&visitor=
 *
 * Design constraints (see 4uPDF/TODO_PERSISTENT.md):
 *  - Non-intrusive, hidden for paying users (shared shouldShowAds() predicate).
 *  - Lazy: fetch only when the slot is about to enter the viewport (no LCP hit).
 *  - Stable wrapper node so the IntersectionObserver never watches a swapped node.
 *  - Parallel slot fetch (independent `n` rotation seeds).
 *  - Respects prefers-reduced-motion + offers an explicit pause control (WCAG 2.2.2).
 *  - Never throws / never logs to console on failure (silent collapse).
 *
 * Never used inside split-ocr (NO-TOUCH CRITIC) or SuperAdmin.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, shouldShowAds } from "../lib/auth";

const CAS_BASE = (
  process.env.NEXT_PUBLIC_CAS_BASE || "https://ma.techbiz.ae"
).replace(/\/+$/, "");

interface CasCreative {
  imageUrl?: string;
  imageAlt?: string;
  headline?: string;
  body?: string;
  ctaText?: string;
  ctaUrl?: string;
  brand?: string;
}

interface CasAd {
  id: string;
  trackingCode: string;
  creative: CasCreative;
  placement?: string;
  clickUrl: string;
}

interface CasCarouselProps {
  /** CAS placement / slot name. Default WEBSITE_INFEED. */
  placement?: string;
  /** How many distinct slots to request (carousel size). Default 3. */
  slots?: number;
  /** Auto-advance interval in ms (ignored under reduced-motion). Default 7000. */
  intervalMs?: number;
  /** Consumer attribution sent to CAS metrics. Default "4updf". */
  source?: string;
  /** Extra classes on the outer wrapper. */
  className?: string;
  /** Small muted label above the card. Default "Din ecosistem". */
  eyebrow?: string;
}

function readVisitorToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("anon_token");
  } catch {
    return null;
  }
}

/** Append `source` to a click URL safely (before any #fragment, skip if present). */
function withSource(rawUrl: string, source: string): string {
  try {
    const u = new URL(rawUrl);
    if (!u.searchParams.has("source")) u.searchParams.set("source", source);
    return u.toString();
  } catch {
    // Relative or malformed URL: fall back to a fragment-aware manual append.
    if (/[?&]source=/.test(rawUrl)) return rawUrl;
    const hashIdx = rawUrl.indexOf("#");
    const hash = hashIdx >= 0 ? rawUrl.slice(hashIdx) : "";
    const base = hashIdx >= 0 ? rawUrl.slice(0, hashIdx) : rawUrl;
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}source=${encodeURIComponent(source)}${hash}`;
  }
}

export default function CasCarousel({
  placement = "WEBSITE_INFEED",
  slots = 3,
  intervalMs = 7000,
  source = "4updf",
  className = "",
  eyebrow = "Din ecosistem",
}: CasCarouselProps) {
  const { user, loading } = useAuth();
  const [ads, setAds] = useState<CasAd[]>([]);
  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const firedImpressions = useRef<Set<string>>(new Set());

  // Hide for paying users (free + anonymous keep ads, shared with AdsBanner).
  const adsAllowed = shouldShowAds(user);

  // Lazy mount: observe the (stable) wrapper, only flip inView once near viewport.
  useEffect(() => {
    if (!adsAllowed || loading) return;
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [adsAllowed, loading]);

  // Fetch the rotation set once in view. Slots are independent → fetch parallel,
  // then dedupe by ad id preserving slot order. No persistent "fetched" ref:
  // inView flips false→true exactly once, so this effect runs once in prod
  // (and harmlessly twice under StrictMode dev — the cancelled guard + the
  // impression Set make that idempotent).
  useEffect(() => {
    if (!inView || !adsAllowed) return;
    let cancelled = false;

    (async () => {
      const visitor = readVisitorToken();
      const count = Math.max(1, Math.min(slots, 6));

      const results = await Promise.all(
        Array.from({ length: count }, async (_, n) => {
          const params = new URLSearchParams({
            placement,
            source,
            n: String(n),
          });
          if (visitor) params.set("visitor", visitor);
          try {
            // Same-origin proxy (holds CAS_API_KEY server-side).
            const res = await fetch(`/api/cas/render?${params}`, {
              method: "GET",
              cache: "no-store",
            });
            if (res.status === 204 || !res.ok) return null;
            const data = await res.json();
            const ad = data?.ad;
            if (ad?.id && ad?.trackingCode && data?.clickUrl) {
              return { ...ad, clickUrl: data.clickUrl } as CasAd;
            }
          } catch {
            // network/CORS failure — skip this slot silently
          }
          return null;
        })
      );

      const collected: CasAd[] = [];
      const seen = new Set<string>();
      for (const ad of results) {
        if (ad && !seen.has(ad.id)) {
          seen.add(ad.id);
          collected.push(ad);
        }
      }

      if (!cancelled && collected.length > 0) setAds(collected);
    })();

    return () => {
      cancelled = true;
    };
  }, [inView, adsAllowed, placement, slots, source]);

  // Fire an impression beacon for the active ad (once per trackingCode).
  const fireImpression = useCallback(
    (ad: CasAd | undefined) => {
      if (!ad || typeof window === "undefined") return;
      if (firedImpressions.current.has(ad.trackingCode)) return;
      firedImpressions.current.add(ad.trackingCode);
      const visitor = readVisitorToken();
      const params = new URLSearchParams({
        event: "impression",
        trackingCode: ad.trackingCode,
        source,
      });
      if (visitor) params.set("visitor", visitor);
      try {
        const img = new Image();
        img.src = `${CAS_BASE}/api/cas/track?${params}`;
      } catch {
        // ignore
      }
    },
    [source]
  );

  useEffect(() => {
    if (ads.length === 0 || !inView) return;
    fireImpression(ads[index]);
  }, [ads, index, inView, fireImpression]);

  // Auto-advance (respects reduced-motion + hover/focus + explicit pause).
  const paused = hoverPaused || userPaused;
  useEffect(() => {
    if (ads.length <= 1 || paused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, Math.max(3000, intervalMs));
    return () => clearInterval(t);
  }, [ads.length, paused, intervalMs]);

  const active = ads[index];
  const liveMessage = useMemo(() => {
    if (!active) return "";
    const h = active.creative?.headline || "Recomandare";
    return `Slide ${index + 1} din ${ads.length}: ${h}`;
  }, [active, index, ads.length]);

  // Paid users: render nothing (no wrapper, no fetch).
  if (!adsAllowed) return null;

  // Stable wrapper: the ref node never changes identity, so the observer always
  // watches a live node. Before ads load the wrapper is empty (collapses).
  return (
    <div
      ref={rootRef}
      className={`w-full ${ads.length > 0 ? className : ""}`}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={() => setHoverPaused(false)}
    >
      {/* Screen-reader announcement of the active slide */}
      <span className="sr-only" aria-live="polite">
        {liveMessage}
      </span>

      {ads.length > 0 && active ? (
        <section
          aria-roledescription="carousel"
          aria-label="Recomandări din ecosistem"
          className="relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
        >
          <a
            href={withSource(active.clickUrl, source)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex flex-col sm:flex-row items-stretch gap-4 p-4 group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
          >
            {active.creative?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.creative.imageUrl}
                alt={active.creative.imageAlt || active.creative.headline || "Sponsored"}
                width={160}
                height={112}
                loading="lazy"
                decoding="async"
                className="w-full sm:w-40 h-32 sm:h-28 object-cover rounded-lg bg-gray-800 flex-shrink-0"
              />
            ) : null}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wide text-gray-500">
                  {eyebrow}
                </span>
                {active.creative?.brand ? (
                  <span className="text-[10px] text-gray-600">· {active.creative.brand}</span>
                ) : null}
              </div>
              {active.creative?.headline ? (
                <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                  {active.creative.headline}
                </h3>
              ) : null}
              {active.creative?.body ? (
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{active.creative.body}</p>
              ) : null}
              {active.creative?.ctaText ? (
                <span className="inline-block mt-3 self-start px-4 py-2 bg-blue-600 group-hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                  {active.creative.ctaText}
                </span>
              ) : null}
            </div>
          </a>

          {/* Sponsored disclosure */}
          <span className="absolute top-2 right-3 text-[10px] text-gray-600 select-none">
            Sponsored
          </span>

          {/* Controls: pause/play (WCAG 2.2.2) + navigation dots */}
          {ads.length > 1 ? (
            <div className="flex items-center justify-center gap-3 pb-3">
              <button
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? "Pornește rotația" : "Oprește rotația"}
                aria-pressed={userPaused}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                {userPaused ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                  </svg>
                )}
              </button>
              <div className="flex gap-2" role="group" aria-label="Selector slide">
                {ads.map((ad, i) => (
                  <button
                    key={ad.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Slide ${i + 1} din ${ads.length}`}
                    aria-current={i === index ? "true" : undefined}
                    className={`h-2 rounded-full transition-all ${
                      i === index ? "w-5 bg-blue-500" : "w-2 bg-gray-600 hover:bg-gray-500"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
