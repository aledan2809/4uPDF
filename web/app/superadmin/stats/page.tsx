"use client";

import { useEffect, useState, useRef } from "react";
import Script from "next/script";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";

const fetchOpts: RequestInit = { credentials: "include" };

interface Stats {
  total_users: number;
  users_by_plan: Record<string, number>;
  total_operations: number;
  operations_by_tool: Record<string, number>;
  daily_operations: { date: string; count: number }[];
  daily_new_users: { date: string; count: number }[];
  active_users_now: number;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState(0);
  const [chartReady, setChartReady] = useState(false);
  const opsChartRef = useRef<HTMLCanvasElement>(null);
  const usersChartRef = useRef<HTMLCanvasElement>(null);
  const toolsChartRef = useRef<HTMLCanvasElement>(null);
  const chartsDrawn = useRef(false);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/stats`, fetchOpts)
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setActiveUsers(data.active_users_now);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // SSE for real-time active users
  useEffect(() => {
    // SSE doesn't support cookies natively; we poll instead
    const es = new EventSource(`${API_URL}/api/admin/active-users`, { withCredentials: true });
    // Note: SSE doesn't support custom headers, so we rely on the fetch-based stats
    // and poll every 10s instead
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/stats`, fetchOpts);
        const data = await res.json();
        setActiveUsers(data.active_users_now);
      } catch { /* ignore */ }
    }, 10000);

    return () => {
      es.close();
      clearInterval(interval);
    };
  }, []);

  // Draw charts when Chart.js is loaded and data is ready
  useEffect(() => {
    if (!chartReady || !stats || chartsDrawn.current) return;
    chartsDrawn.current = true;
    const Chart = (window as any).Chart;
    if (!Chart) return;

    // Daily operations chart
    if (opsChartRef.current) {
      new Chart(opsChartRef.current, {
        type: "line",
        data: {
          labels: stats.daily_operations.map((d) => d.date.slice(5)),
          datasets: [{
            label: "Operations",
            data: stats.daily_operations.map((d) => d.count),
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.1)",
            fill: true,
            tension: 0.3,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: "#6b7280" }, grid: { color: "rgba(75,85,99,0.3)" } },
            y: { ticks: { color: "#6b7280" }, grid: { color: "rgba(75,85,99,0.3)" }, beginAtZero: true },
          },
        },
      });
    }

    // New users chart
    if (usersChartRef.current) {
      new Chart(usersChartRef.current, {
        type: "bar",
        data: {
          labels: stats.daily_new_users.map((d) => d.date.slice(5)),
          datasets: [{
            label: "New Users",
            data: stats.daily_new_users.map((d) => d.count),
            backgroundColor: "rgba(16,185,129,0.6)",
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: "#6b7280" }, grid: { display: false } },
            y: { ticks: { color: "#6b7280" }, grid: { color: "rgba(75,85,99,0.3)" }, beginAtZero: true },
          },
        },
      });
    }

    // Tools pie chart
    if (toolsChartRef.current) {
      const toolEntries = Object.entries(stats.operations_by_tool).sort(([, a], [, b]) => b - a).slice(0, 8);
      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
      new Chart(toolsChartRef.current, {
        type: "doughnut",
        data: {
          labels: toolEntries.map(([t]) => t),
          datasets: [{
            data: toolEntries.map(([, c]) => c),
            backgroundColor: colors.slice(0, toolEntries.length),
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "right", labels: { color: "#9ca3af", font: { size: 11 } } },
          },
        },
      });
    }
  }, [chartReady, stats]);

  if (loading) return <div className="text-gray-400">Loading stats...</div>;
  if (!stats) return <div className="text-red-400">Failed to load stats</div>;

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4"
        onLoad={() => setChartReady(true)}
      />

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Stats</h1>
          <p className="text-gray-400 text-sm mt-1">Platform statistics and real-time data</p>
        </div>

        {/* Real-time active users */}
        <div className="bg-gradient-to-r from-green-900/30 to-green-800/10 border border-green-700/30 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 font-medium">Real-Time Active Users</span>
          </div>
          <div className="text-5xl font-bold text-white mt-2">{activeUsers}</div>
          <p className="text-green-400/60 text-sm mt-1">Users active in the last 5 minutes</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-white">{stats.total_operations.toLocaleString()}</div>
            <div className="text-sm text-gray-400 mt-1">Total Operations</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-white">{stats.total_users.toLocaleString()}</div>
            <div className="text-sm text-gray-400 mt-1">Total Users</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-3xl font-bold text-white">
              {Object.keys(stats.operations_by_tool).length}
            </div>
            <div className="text-sm text-gray-400 mt-1">Tools Used</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Daily Operations (30d)</h2>
            <canvas ref={opsChartRef} />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">New Users (30d)</h2>
            <canvas ref={usersChartRef} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Conversions by Tool</h2>
          <div className="max-w-lg mx-auto">
            <canvas ref={toolsChartRef} />
          </div>
          {Object.keys(stats.operations_by_tool).length === 0 && (
            <p className="text-gray-500 text-sm text-center mt-4">No tool usage data yet</p>
          )}
        </div>
      </div>
    </>
  );
}
