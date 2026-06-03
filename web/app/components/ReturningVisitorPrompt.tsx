"use client";

/**
 * ReturningVisitorPrompt — soft account-conversion nudge for anonymous returning
 * visitors (see 4uPDF/TODO_PERSISTENT.md "Identifică vizitatorul recurent").
 *
 * Detection (authoritative, reuses existing infra):
 *  - backend /api/track/returning aggregates anonymous_usage by local_token /
 *    composite_hash → total_pages_all_time + days_since_first (survives cache
 *    clears within the same fingerprint, and IP changes via local_token).
 *  - client fallback: first-touch timestamp in localStorage `_4u_acq`.
 *  Requires prior tool usage (total >= 1) so pure browsers aren't nudged.
 *
 * GDPR: detection sends a device fingerprint + persistent token + analytics
 * events. It therefore runs ONLY when the user granted analytics cookies
 * (cookieConsent.analytics === true). Until consent is answered, the cookie
 * banner owns the bottom of the screen, so gating on consent also avoids the
 * z-index collision with <CookieConsent/>.
 *
 * Honest value proposition: a free ACCOUNT does NOT raise the daily page limit
 * (anonymous and free-plan share 200/day in api.py PLAN_LIMITS["free"]); larger
 * files/no-ads come from a paid plan. The copy reflects that.
 *
 * Anti-annoyance: shown at most once per session; a cooldown is written on every
 * show (escalating 3→7→30 days) so even users who never click stop being nagged,
 * with a longer cooldown after an explicit dismiss/click. Never shown to
 * logged-in users, nor on /split-ocr (NO-TOUCH) or /superadmin routes.
 *
 * Measurement: conversion_prompt_shown / _clicked / _dismissed via
 * /api/analytics/track (event_type), visible in SuperAdmin analytics.
 *
 * NOTE: the global pageview tracker in layout.tsx + GA currently fire without a
 * consent gate (pre-existing). This component does NOT — but that wider gap is
 * worth an ecosystem fix on the same cookieConsent.analytics flag.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, getReturningStatus, trackConversionEvent } from "../lib/auth";

const STORE_KEY = "_4u_conv";
const SESSION_KEY = "_4u_conv_session";
const SHOW_DELAY_MS = 8000;
const DAY_MS = 24 * 60 * 60 * 1000;

// "returning" = used >=1 page ever AND (first seen >=1 day ago OR >=3 pages total).
const MIN_TOTAL_PAGES = 3;
const MIN_DAYS_SINCE_FIRST = 1;
// Cooldown (days) written on each successive show, so non-clickers stop seeing it.
const SHOW_COOLDOWN_DAYS = [3, 7, 30];

interface ConvState {
  dismissUntil?: number;
  lastShown?: number;
  count?: number;
}

function readState(): ConvState {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeState(s: ConvState) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("cookieConsent");
    if (!raw) return false; // not answered yet → banner owns the screen
    return JSON.parse(raw)?.analytics === true;
  } catch {
    return false;
  }
}

function acqAgeDays(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem("_4u_acq");
    if (!raw) return 0;
    const acq = JSON.parse(raw);
    if (!acq?.ts) return 0;
    return Math.max(0, Math.floor((Date.now() - Number(acq.ts)) / DAY_MS));
  } catch {
    return 0;
  }
}

export default function ReturningVisitorPrompt() {
  const { user, loading } = useAuth();
  const pathname = usePathname() || "";
  const [visible, setVisible] = useState(false);
  const [total, setTotal] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Suppress on excluded routes (NO-TOUCH split-ocr + admin) and for logged-in.
  const suppressedRoute =
    pathname.startsWith("/split-ocr") || pathname.startsWith("/superadmin");

  // Explicit dismiss / CTA click. Does not touch `count` (which tracks shows).
  const dismiss = useCallback((cooldownDays: number, reason: string) => {
    setVisible(false);
    const s = readState();
    const until = Math.max(s.dismissUntil || 0, Date.now() + cooldownDays * DAY_MS);
    writeState({ ...s, dismissUntil: until, lastShown: Date.now() });
    trackConversionEvent(reason);
  }, []);

  useEffect(() => {
    if (suppressedRoute || loading || user) return;
    if (typeof window === "undefined") return;

    // Cheap synchronous gates first (avoid the network/fingerprint when ineligible).
    if (!hasAnalyticsConsent()) return; // GDPR + avoids cookie-banner collision
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const s = readState();
    if (s.dismissUntil && Date.now() < s.dismissUntil) return;

    let active = true;
    timerRef.current = setTimeout(async () => {
      if (!active || typeof window === "undefined") return;
      // Re-check (user may have logged in / navigated during the delay).
      if (localStorage.getItem("auth_token")) return;

      const data = await getReturningStatus();
      if (!active) return; // navigated/unmounted during the await — don't fire
      if (data.authenticated) return;

      const totalPages = data.total_pages_all_time || 0;
      const days = Math.max(data.days_since_first || 0, acqAgeDays());
      const returning =
        totalPages >= 1 && (totalPages >= MIN_TOTAL_PAGES || days >= MIN_DAYS_SINCE_FIRST);
      if (!returning) return;

      setTotal(totalPages);
      setVisible(true);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignore
      }
      // Write an escalating cooldown on show, so even non-clickers back off.
      const cur = readState();
      const newCount = (cur.count || 0) + 1;
      const cd = SHOW_COOLDOWN_DAYS[Math.min(newCount - 1, SHOW_COOLDOWN_DAYS.length - 1)];
      writeState({
        ...cur,
        dismissUntil: Math.max(cur.dismissUntil || 0, Date.now() + cd * DAY_MS),
        lastShown: Date.now(),
        count: newCount,
      });
      trackConversionEvent("conversion_prompt_shown");
    }, SHOW_DELAY_MS);

    return () => {
      active = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [suppressedRoute, loading, user]);

  // Hide immediately if the user logs in while it's open.
  useEffect(() => {
    if (user && visible) setVisible(false);
  }, [user, visible]);

  if (!visible || suppressedRoute || user) return null;

  const headline =
    total >= 1
      ? `Ai procesat deja ${total} ${total === 1 ? "pagină" : "pagini"} cu 4uPDF`
      : "Ne pare bine că te-ai întors la 4uPDF";

  return (
    <div
      role="complementary"
      aria-label="Creează un cont gratuit 4uPDF"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4"
    >
      <button
        type="button"
        onClick={() => dismiss(14, "conversion_prompt_dismissed")}
        aria-label="Închide"
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-300 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="pr-6">
        <p className="text-sm font-semibold text-white">{headline}</p>
        <p className="text-sm text-gray-400 mt-1">
          Fă-ți un cont gratuit ca să-ți păstrezi activitatea pe orice dispozitiv. Când ai nevoie de mai
          mult, treci la un plan fără reclame, cu fișiere mai mari și procesare în lot.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <Link
            href="/signup"
            onClick={() => dismiss(60, "conversion_prompt_clicked")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Creează cont gratuit
          </Link>
          <button
            type="button"
            onClick={() => dismiss(14, "conversion_prompt_dismissed")}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Mai târziu
          </button>
        </div>
      </div>
    </div>
  );
}
