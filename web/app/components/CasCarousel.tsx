"use client";

/**
 * CasCarousel — cross-promo ad from the CAS (Carusel de Ads) module in
 * MarketingAutomation (ma.techbiz.ae). Mirrors the TeInformez integration:
 *
 *  - We render MA's OWN ad HTML (format=html), not a re-built widget, so it is
 *    literally the same carousel markup MA serves to TeInformez.
 *  - The HTML is fetched from the same-origin /api/cas/render, which on prod is
 *    served by the Python backend (nginx /api -> :3099). That backend holds the
 *    CAS key (settings table) and attaches X-API-Key — the key never reaches the
 *    browser. MA counts the impression when it serves the HTML; the click links
 *    in the markup route through MA's keyless /api/cas/click.
 *  - The HTML is sanitized with DOMPurify before injection (scripts/iframes
 *    stripped), exactly like TeInformez's useCasSlot.
 *
 * 4uPDF specifics: hidden for paying users (shared shouldShowAds), lazy-mounted,
 * fail-soft (collapses if MA returns nothing). Never used in split-ocr / admin.
 */

import { useEffect, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { useAuth, shouldShowAds } from "../lib/auth";

interface CasCarouselProps {
  /** CAS placement / slot name. Default WEBSITE_INFEED. */
  placement?: string;
  /** Carousel slot index — distinct campaigns when several slots share a page. */
  index?: number;
  /** Extra classes on the outer wrapper. */
  className?: string;
}

function readVisitorToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("anon_token");
  } catch {
    return null;
  }
}

export default function CasCarousel({
  placement = "WEBSITE_INFEED",
  index,
  className = "",
}: CasCarouselProps) {
  const { user, loading } = useAuth();
  const [html, setHtml] = useState<string>("");
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const adsAllowed = shouldShowAds(user);

  // Lazy mount: only fetch once the slot is near the viewport.
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

  // Fetch MA's ad HTML through the same-origin proxy, sanitize, store.
  useEffect(() => {
    if (!inView || !adsAllowed) return;
    let cancelled = false;
    const params = new URLSearchParams({ placement });
    if (typeof index === "number") params.set("n", String(index));
    const visitor = readVisitorToken();
    if (visitor) params.set("visitor", visitor);

    fetch(`/api/cas/render?${params}`, { cache: "no-store", credentials: "omit" })
      .then((res) => (res.ok && res.status !== 204 ? res.text() : ""))
      .then((body) => {
        if (cancelled || !body || !body.trim()) return;
        const clean = DOMPurify.sanitize(body, {
          FORBID_TAGS: ["script", "iframe", "object", "embed"],
        });
        if (clean.trim()) setHtml(clean);
      })
      .catch(() => {
        /* network/CORS failure — collapse silently */
      });

    return () => {
      cancelled = true;
    };
  }, [inView, adsAllowed, placement, index]);

  // Paid users: render nothing (no wrapper, no fetch).
  if (!adsAllowed) return null;

  // Stable wrapper so the observer always watches a live node; empty until the
  // ad HTML arrives (collapses with no layout reserved if MA returns nothing).
  return (
    <div ref={rootRef} className={html ? className : "h-0 w-full"}>
      {html ? (
        <div
          role="complementary"
          aria-label="Recomandare"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}
    </div>
  );
}
