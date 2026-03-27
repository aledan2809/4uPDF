"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";

const fetchOpts: RequestInit = { credentials: "include" };

const SETTING_GROUPS = [
  {
    title: "General",
    keys: [
      { key: "admin_api_key", label: "Admin API Key", type: "password" },
      { key: "rate_limit", label: "Rate Limit (req/min)", type: "number" },
      { key: "max_file_size_mb", label: "Max File Size (MB)", type: "number" },
      { key: "maintenance_mode", label: "Maintenance Mode", type: "toggle" },
    ],
  },
  {
    title: "Stripe",
    keys: [
      { key: "stripe_secret_key", label: "Secret Key", type: "password" },
      { key: "stripe_publishable_key", label: "Publishable Key", type: "text" },
      { key: "stripe_webhook_secret", label: "Webhook Secret", type: "password" },
    ],
  },
  {
    title: "Stripe Price IDs",
    keys: [
      { key: "bronze_monthly_price_id", label: "Bronze Monthly", type: "text" },
      { key: "bronze_annual_price_id", label: "Bronze Annual", type: "text" },
      { key: "silver_monthly_price_id", label: "Silver Monthly", type: "text" },
      { key: "silver_annual_price_id", label: "Silver Annual", type: "text" },
      { key: "gold_monthly_price_id", label: "Gold Monthly", type: "text" },
      { key: "gold_annual_price_id", label: "Gold Annual", type: "text" },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  // Change password state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/admin/settings`, fetchOpts)
      .then((r) => r.json())
      .then((data) => setSettings(data.settings || {}))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (Object.keys(edited).length === 0) return;
    setSaving(true);
    setMessage("");

    const formData = new FormData();
    for (const [k, v] of Object.entries(edited)) {
      formData.append(k, v);
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Updated: ${data.updated.join(", ")}`);
        setEdited({});
        const res2 = await fetch(`${API_URL}/api/admin/settings`, fetchOpts);
        const data2 = await res2.json();
        setSettings(data2.settings || {});
      }
    } catch {
      setMessage("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwMessage("");

    if (newPw !== confirmPw) {
      setPwError("Passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/superadmin/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          current_password: currentPw,
          new_password: newPw,
          confirm_password: confirmPw,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwMessage("Password changed successfully");
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        setPwError(data.detail || "Failed to change password");
      }
    } catch {
      setPwError("Network error");
    } finally {
      setPwSaving(false);
    }
  };

  const getValue = (key: string) => {
    if (key in edited) return edited[key];
    return settings[key] || "";
  };

  const setValue = (key: string, value: string) => {
    setEdited((prev) => ({ ...prev, [key]: value }));
  };

  const regenerateKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const key = Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setValue("admin_api_key", key);
  };

  if (loading) return <div className="text-gray-400">Loading settings...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Configure platform settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || Object.keys(edited).length === 0}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg text-sm">
          {message}
        </div>
      )}

      {SETTING_GROUPS.map((group) => (
        <div key={group.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">{group.title}</h2>
          <div className="space-y-4">
            {group.keys.map(({ key, label, type }) => (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="w-48 text-sm text-gray-400 shrink-0">{label}</label>
                {type === "toggle" ? (
                  <button
                    onClick={() => setValue(key, getValue(key) === "true" ? "false" : "true")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      getValue(key) === "true"
                        ? "bg-red-600/20 text-red-400 border border-red-500/30"
                        : "bg-green-600/20 text-green-400 border border-green-500/30"
                    }`}
                  >
                    {getValue(key) === "true" ? "ON (Maintenance)" : "OFF (Normal)"}
                  </button>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <input
                      type={type === "password" ? "password" : type === "number" ? "number" : "text"}
                      value={getValue(key)}
                      onChange={(e) => setValue(key, e.target.value)}
                      placeholder={label}
                      title={label}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {key === "admin_api_key" && (
                      <button
                        type="button"
                        onClick={regenerateKey}
                        className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600"
                      >
                        Regenerate
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Change Password Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>

        {pwMessage && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg text-sm mb-4">
            {pwMessage}
          </div>
        )}
        {pwError && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">
            {pwError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              title="Current password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">New Password</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="Enter new password (min 8 chars)"
              title="New password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Confirm new password"
              title="Confirm new password"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={pwSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {pwSaving ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
