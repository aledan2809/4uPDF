"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../lib/auth";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked: boolean;
  calls_total: number;
  period_calls: number;
}

interface KeysResponse {
  keys: ApiKey[];
  api_access: boolean;
  quota_per_month: number;
}

// Dashboard panel for the B2B "PDF API" product. Self-gating: if the plan has
// no api_access it renders an upsell instead of the key manager. Same-origin
// relative /api/* paths (nginx routes them to the Python backend).
export default function ApiKeysPanel() {
  const { getToken } = useAuth();
  const [data, setData] = useState<KeysResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const authHeaders = useCallback((): Record<string, string> => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [getToken]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/api-keys", { headers: authHeaders() });
      if (!res.ok) throw new Error("Could not load API keys");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load API keys");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  const createKey = useCallback(async () => {
    setError(null);
    setFreshKey(null);
    setCreating(true);
    try {
      const form = new FormData();
      form.append("name", name.trim());
      const res = await fetch("/api/api-keys", { method: "POST", headers: authHeaders(), body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.detail || "Could not create the key");
      setFreshKey(body.key);
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the key");
    } finally {
      setCreating(false);
    }
  }, [name, authHeaders, load]);

  const revokeKey = useCallback(async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("Could not revoke the key");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not revoke the key");
    }
  }, [authHeaders, load]);

  const copyFresh = useCallback(async () => {
    if (!freshKey) return;
    try {
      await navigator.clipboard.writeText(freshKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; the key stays selectable in the box */
    }
  }, [freshKey]);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <div className="animate-pulse h-5 bg-gray-800 rounded w-1/3" />
      </div>
    );
  }

  // Upsell when the plan has no API access — sell the product.
  if (!data?.api_access) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-1">
          PDF API <span className="text-yellow-400">Gold</span>
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Call 4uPDF&apos;s engine from your own apps — high-DPI figure extraction, batch and OCR over a
          simple HTTP API. Available on the Gold plan.
        </p>
        <div className="flex gap-3">
          <Link href="/pricing" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            Upgrade to Gold
          </Link>
          <Link href="/api-docs" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg transition-colors">
            Read the API docs
          </Link>
        </div>
      </div>
    );
  }

  const quotaLabel = data.quota_per_month === -1 ? "Unlimited" : `${data.quota_per_month.toLocaleString()} calls/month`;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <h2 className="text-lg font-semibold text-white">API Keys</h2>
        <Link href="/api-docs" className="text-sm text-blue-400 hover:text-blue-300">API docs →</Link>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        Your plan includes <span className="text-gray-200">{quotaLabel}</span>. Authenticate requests with the
        <code className="mx-1 px-1 py-0.5 bg-gray-800 rounded text-gray-200">X-API-Key</code> header.
      </p>

      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm" role="alert">{error}</div>
      )}

      {/* Newly created key — shown exactly once */}
      {freshKey && (
        <div className="mb-4 bg-green-900/20 border border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-300 mb-2">New key created — copy it now, it won&apos;t be shown again:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-950 border border-gray-800 rounded text-gray-200 text-sm break-all">{freshKey}</code>
            <button type="button" onClick={copyFresh} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg whitespace-nowrap">
              {copied ? "Copied!" : "Copy"}
            </button>
            <button type="button" onClick={() => { setFreshKey(null); setCopied(false); }} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg whitespace-nowrap" aria-label="Dismiss — hide this key">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Create */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Key name (e.g. Production server)"
          maxLength={60}
          className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={createKey}
          disabled={creating}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          {creating ? "Creating…" : "Create key"}
        </button>
      </div>

      {/* List */}
      {data.keys.length === 0 ? (
        <p className="text-sm text-gray-500">No API keys yet. Create one above to start using the API.</p>
      ) : (
        <div className="space-y-2">
          {data.keys.map((k) => (
            <div
              key={k.id}
              className={`flex items-center justify-between flex-wrap gap-2 px-4 py-3 rounded-lg border ${k.revoked ? "border-gray-800 bg-gray-950/50 opacity-60" : "border-gray-800 bg-gray-950"}`}
            >
              <div className="min-w-0">
                <p className="text-sm text-white truncate">
                  {k.name} {k.revoked && <span className="text-xs text-red-400">(revoked)</span>}
                </p>
                <p className="text-xs text-gray-500">
                  <code className="text-gray-400">{k.key_prefix}…</code>
                  {" · "}{data.quota_per_month === -1 ? `${k.period_calls.toLocaleString()} this month` : `${k.period_calls.toLocaleString()} / ${data.quota_per_month.toLocaleString()} this month`}
                  {k.last_used_at ? ` · last used ${new Date(k.last_used_at).toLocaleDateString()}` : " · never used"}
                </p>
              </div>
              {!k.revoked && (
                <button
                  type="button"
                  onClick={() => revokeKey(k.id)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-red-900/40 text-gray-300 hover:text-red-300 text-xs rounded-lg transition-colors"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
