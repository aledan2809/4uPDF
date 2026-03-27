"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";

function getToken() {
  return localStorage.getItem("superadmin_token") || "";
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

interface Stats {
  total_users: number;
  users_by_plan: Record<string, number>;
  total_operations: number;
  operations_by_tool: Record<string, number>;
  daily_operations: { date: string; count: number }[];
  daily_new_users: { date: string; count: number }[];
  active_users_now: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/stats`, { headers: authHeaders() })
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-400">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="text-red-400">Failed to load stats</div>;
  }

  const topTools = Object.entries(stats.operations_by_tool)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Overview of your 4uPDF platform</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.total_users} color="blue" />
        <StatCard label="Active Now" value={stats.active_users_now} color="green" />
        <StatCard label="Total Operations" value={stats.total_operations} color="purple" />
        <StatCard
          label="Paid Users"
          value={
            (stats.users_by_plan.bronze || 0) +
            (stats.users_by_plan.silver || 0) +
            (stats.users_by_plan.gold || 0)
          }
          color="yellow"
        />
      </div>

      {/* Users by plan */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Users by Plan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Object.entries(stats.users_by_plan).map(([plan, count]) => (
            <div key={plan} className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className="text-sm text-gray-400 capitalize">{plan}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top tools */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Top Tools by Usage</h2>
        <div className="space-y-3">
          {topTools.map(([tool, count]) => {
            const maxCount = topTools[0]?.[1] || 1;
            const pct = Math.round((count / maxCount) * 100);
            return (
              <div key={tool} className="flex items-center gap-4">
                <div className="w-40 text-sm text-gray-300 truncate">{tool}</div>
                <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-16 text-right text-sm text-gray-400">{count}</div>
              </div>
            );
          })}
          {topTools.length === 0 && (
            <p className="text-gray-500 text-sm">No tool usage data yet</p>
          )}
        </div>
      </div>

      {/* Recent activity charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Daily Operations (30d)</h2>
          <MiniBarChart data={stats.daily_operations} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">New Users (30d)</h2>
          <MiniBarChart data={stats.daily_new_users} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-600/20 text-blue-400 border-blue-500/30",
    green: "bg-green-600/20 text-green-400 border-green-500/30",
    purple: "bg-purple-600/20 text-purple-400 border-purple-500/30",
    yellow: "bg-yellow-600/20 text-yellow-400 border-yellow-500/30",
  };
  return (
    <div className={`rounded-xl border p-6 ${colors[color]}`}>
      <div className="text-3xl font-bold">{value.toLocaleString()}</div>
      <div className="text-sm mt-1 opacity-80">{label}</div>
    </div>
  );
}

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return <p className="text-gray-500 text-sm">No data yet</p>;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
          <div
            className="w-full bg-blue-500/60 rounded-sm min-h-[2px]"
            style={{ height: `${(d.count / maxVal) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}
