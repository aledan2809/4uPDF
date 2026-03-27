"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";

const fetchOpts: RequestInit = { credentials: "include" };

interface Voucher {
  id: string;
  code: string;
  target_plan: string;
  duration_days: number;
  max_uses: number;
  current_uses: number;
  expires_at: string | null;
  created_at: string;
  is_active: number;
  redemption_count: number;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Create form
  const [newCode, setNewCode] = useState("");
  const [newPlan, setNewPlan] = useState("bronze");
  const [newDays, setNewDays] = useState(30);
  const [newMaxUses, setNewMaxUses] = useState(1);
  const [newExpires, setNewExpires] = useState("");

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/vouchers`, fetchOpts);
      const data = await res.json();
      setVouchers(data.vouchers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setNewCode(`PDF-${seg()}-${seg()}`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    const formData = new FormData();
    formData.append("code", newCode);
    formData.append("target_plan", newPlan);
    formData.append("duration_days", String(newDays));
    formData.append("max_uses", String(newMaxUses));
    if (newExpires) formData.append("expires_at", newExpires);

    try {
      const res = await fetch(`${API_URL}/api/admin/vouchers`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Failed to create");
        return;
      }
      setShowCreate(false);
      setNewCode("");
      fetchVouchers();
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, currentActive: number) => {
    const formData = new FormData();
    formData.append("is_active", String(currentActive ? 0 : 1));
    await fetch(`${API_URL}/api/admin/vouchers/${id}`, {
      method: "PUT",
      credentials: "include",
      body: formData,
    });
    fetchVouchers();
  };

  const deleteVoucher = async (id: string) => {
    if (!confirm("Delete this voucher?")) return;
    await fetch(`${API_URL}/api/admin/vouchers/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    fetchVouchers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vouchers</h1>
          <p className="text-gray-400 text-sm mt-1">{vouchers.length} vouchers</p>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); if (!newCode) generateCode(); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Create Voucher
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">New Voucher</h2>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Code</label>
              <div className="flex gap-2">
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="PDF-XXXX-XXXX"
                  title="Voucher code"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button type="button" onClick={generateCode} className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600">
                  Gen
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Target Plan</label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Duration (days)</label>
              <input
                type="number"
                value={newDays}
                onChange={(e) => setNewDays(Number(e.target.value))}
                min={1}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Uses</label>
              <input
                type="number"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(Number(e.target.value))}
                min={1}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expires At (optional)</label>
              <input
                type="date"
                value={newExpires}
                onChange={(e) => setNewExpires(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vouchers table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Uses</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No vouchers yet</td></tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-white font-mono">{v.code}</td>
                    <td className="px-4 py-3 capitalize text-gray-300">{v.target_plan}</td>
                    <td className="px-4 py-3 text-gray-400">{v.duration_days}d</td>
                    <td className="px-4 py-3 text-gray-400">{v.redemption_count}/{v.max_uses}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        v.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-700/50 text-gray-500"
                      }`}>
                        {v.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(v.created_at)}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => toggleActive(v.id, v.is_active)}
                        className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600"
                      >
                        {v.is_active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => deleteVoucher(v.id)}
                        className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs hover:bg-red-600/30"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}
