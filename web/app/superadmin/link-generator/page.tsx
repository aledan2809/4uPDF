"use client";

import { useMemo, useState } from "react";

// UTM medium implied by each source (so you don't have to think about it)
const SOURCES: { value: string; label: string; medium: string }[] = [
  { value: "facebook", label: "Facebook", medium: "social" },
  { value: "instagram", label: "Instagram", medium: "social" },
  { value: "whatsapp", label: "WhatsApp", medium: "social" },
  { value: "linkedin", label: "LinkedIn", medium: "social" },
  { value: "twitter", label: "Twitter / X", medium: "social" },
  { value: "youtube", label: "YouTube", medium: "social" },
  { value: "google", label: "Google (ad)", medium: "cpc" },
  { value: "newsletter", label: "Newsletter / Email", medium: "email" },
  { value: "blog", label: "Blog / Article", medium: "referral" },
  { value: "other", label: "Other (custom)", medium: "referral" },
];

const DESTINATIONS = [
  { value: "/", label: "Home (4updf.com)" },
  { value: "/tools/merge-pdf", label: "Merge PDF" },
  { value: "/tools/split-pdf", label: "Split PDF" },
  { value: "/tools/compress-pdf", label: "Compress PDF" },
  { value: "/split-ocr", label: "Split-OCR (invoices)" },
  { value: "/pricing", label: "Pricing" },
  { value: "__custom__", label: "Custom path…" },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function LinkGeneratorPage() {
  const [dest, setDest] = useState("/");
  const [customDest, setCustomDest] = useState("");
  const [source, setSource] = useState("facebook");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  const sourceMeta = SOURCES.find((s) => s.value === source) || SOURCES[0];
  const path = dest === "__custom__" ? (customDest.startsWith("/") ? customDest : "/" + customDest) : dest;
  const campaignSlug = slugify(campaign);

  const url = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://4updf.com";
    const u = new URL(path || "/", origin);
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", sourceMeta.medium);
    if (campaignSlug) u.searchParams.set("utm_campaign", campaignSlug);
    if (content.trim()) u.searchParams.set("utm_content", slugify(content));
    return u.toString();
  }, [path, source, sourceMeta.medium, campaignSlug, content]);

  const ready = !!campaignSlug && (dest !== "__custom__" || !!customDest.trim());

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Link Generator (UTM)</h1>
        <p className="text-gray-400 text-sm mt-1">
          Generează linkuri etichetate ca să știi din ce grup / pagină vine fiecare vizitator.
          Folosește <span className="text-amber-400">acest</span> link când postezi (Facebook taie adresa grupului,
          deci eticheta e singurul mod să afli grupul exact).
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        {/* Destination */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Pagina destinație</label>
          <select
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            title="Pagina către care duce linkul"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DESTINATIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          {dest === "__custom__" && (
            <input
              type="text"
              value={customDest}
              onChange={(e) => setCustomDest(e.target.value)}
              placeholder="/exemplu-pagina"
              className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Sursă</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            title="De unde vine traficul"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Campaign (group/page name) */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Numele grupului / paginii <span className="text-gray-500">(campanie)</span>
          </label>
          <input
            type="text"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="ex: Grup Contabili România"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {campaign && (
            <p className="text-xs text-gray-500 mt-1">
              etichetă: <span className="text-amber-400">{campaignSlug}</span>
            </p>
          )}
        </div>

        {/* Content (optional) */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Variantă <span className="text-gray-500">(opțional — ex: post-1, banner)</span>
          </label>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="opțional"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Output */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <label className="block text-sm text-gray-300 mb-2">Linkul tău (copiază-l și postează-l)</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            readOnly
            value={ready ? url : "Completează numele grupului…"}
            onFocus={(e) => e.currentTarget.select()}
            className={`flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono ${ready ? "text-blue-300" : "text-gray-600"}`}
          />
          <button
            onClick={copy}
            disabled={!ready}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white whitespace-nowrap"
          >
            {copied ? "✓ Copiat" : "Copiază"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Apoi vezi rezultatele în <span className="text-gray-300">Analytics → User Activity Log</span> (per click)
          și în <span className="text-gray-300">Users → Source</span> (per cont înregistrat), ca „{sourceMeta.label}
          {campaignSlug ? ` → ${campaignSlug}` : ""}".
        </p>
      </div>
    </div>
  );
}
