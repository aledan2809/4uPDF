"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Script from "next/script";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";

const fetchOpts: RequestInit = { credentials: "include" };

interface AnalyticsData {
  total_pageviews: number;
  unique_visitors: number;
  top_pages: { page: string; views: number; visitors: number }[];
  daily_stats: { day: string; views: number; visitors: number }[];
  top_referrers: { referrer: string; c: number }[];
  period: string;
}

interface ActiveUser {
  email: string;
  current_page: string;
  tool: string;
  duration_sec: number;
  ip: string;
  browser: string;
}

interface Session {
  user: string;
  pages: string[];
  tools: string[];
  start_time: string;
  end_time: string;
  duration_sec: number;
  country: string;
  browser: string;
}

interface ToolUsage {
  tool: string;
  count: number;
}

interface ActivityEvent {
  timestamp: string;
  user: string;
  action: string;
  tool: string;
  page: string;
  file_size: number | null;
  duration_ms: number | null;
  status: string;
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso + "Z");
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

// ============================================================
// Section: Active Users Now (SSE real-time)
// ============================================================
function ActiveUsersSection() {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const es = new EventSource(`${API_URL}/api/admin/active-users`, { withCredentials: true } as any);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setCount(data.active_users || 0);
        setUsers(data.users || []);
      } catch {}
    };
    return () => es.close();
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Active Users Now</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-400 text-sm font-medium">{count} active</span>
        </div>
      </div>
      {users.length === 0 ? (
        <p className="text-gray-500 text-sm">No active users right now</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left py-2 pr-4">User</th>
                <th className="text-left py-2 pr-4">Page</th>
                <th className="text-left py-2 pr-4">Tool</th>
                <th className="text-left py-2 pr-4">Duration</th>
                <th className="text-left py-2 pr-4">IP</th>
                <th className="text-left py-2">Browser</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-b border-gray-800/50 text-gray-300">
                  <td className="py-2 pr-4 truncate max-w-[180px]">{u.email}</td>
                  <td className="py-2 pr-4 truncate max-w-[200px]">{u.current_page}</td>
                  <td className="py-2 pr-4">{u.tool}</td>
                  <td className="py-2 pr-4">{formatDuration(u.duration_sec)}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{u.ip}</td>
                  <td className="py-2">{u.browser}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Section: User Sessions
// ============================================================
function SessionsSection() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("24h");

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/admin/sessions?period=${period}`, fetchOpts)
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">User Sessions</h2>
        <div className="flex gap-2">
          {["24h", "7d", "30d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                period === p ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p className="text-gray-500 text-sm">No sessions found</p>
      ) : (
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left py-2 pr-3">User</th>
                <th className="text-left py-2 pr-3">Pages</th>
                <th className="text-left py-2 pr-3">Tools</th>
                <th className="text-left py-2 pr-3">Duration</th>
                <th className="text-left py-2 pr-3">Start</th>
                <th className="text-left py-2 pr-3">End</th>
                <th className="text-left py-2">Browser</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={i} className="border-b border-gray-800/50 text-gray-300">
                  <td className="py-2 pr-3 truncate max-w-[150px]">{s.user}</td>
                  <td className="py-2 pr-3">
                    <span className="text-blue-400">{s.pages.length}</span>
                    {s.pages.length > 0 && (
                      <span className="text-gray-500 text-xs ml-1" title={s.pages.join(", ")}>
                        ({s.pages[0]}{s.pages.length > 1 ? `, +${s.pages.length - 1}` : ""})
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {s.tools.length === 0 ? (
                      <span className="text-gray-500">-</span>
                    ) : (
                      s.tools.map((t, j) => (
                        <span key={j} className="inline-block bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded text-xs mr-1">
                          {t}
                        </span>
                      ))
                    )}
                  </td>
                  <td className="py-2 pr-3">{formatDuration(s.duration_sec)}</td>
                  <td className="py-2 pr-3 text-xs">{formatTime(s.start_time)}</td>
                  <td className="py-2 pr-3 text-xs">{formatTime(s.end_time)}</td>
                  <td className="py-2">{s.browser}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Section: Tool Usage Breakdown (Bar Chart)
// ============================================================
function ToolUsageSection({ chartReady }: { chartReady: boolean }) {
  const [tools, setTools] = useState<ToolUsage[]>([]);
  const [period, setPeriod] = useState("30d");
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/tool-usage?period=${period}`, fetchOpts)
      .then((r) => r.json())
      .then((d) => setTools(d.tools || []))
      .catch(console.error);
  }, [period]);

  useEffect(() => {
    if (!chartReady || !chartRef.current || tools.length === 0) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;
    if (chartInst.current) chartInst.current.destroy();

    const colors = [
      "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
      "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
      "#14b8a6", "#e11d48", "#a855f7", "#eab308", "#22d3ee",
    ];

    chartInst.current = new Chart(chartRef.current, {
      type: "bar",
      data: {
        labels: tools.map((t) => t.tool),
        datasets: [
          {
            label: "Usage Count",
            data: tools.map((t) => t.count),
            backgroundColor: tools.map((_, i) => colors[i % colors.length]),
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        indexAxis: tools.length > 10 ? "y" as const : "x" as const,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#6b7280" }, grid: { color: "rgba(75,85,99,0.3)" } },
          y: { ticks: { color: "#6b7280" }, grid: { color: "rgba(75,85,99,0.3)" }, beginAtZero: true },
        },
      },
    });
  }, [chartReady, tools]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Tool Usage Breakdown</h2>
        <div className="flex gap-2">
          {["7d", "30d", "90d", "365d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                period === p ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {p === "365d" ? "1y" : p}
            </button>
          ))}
        </div>
      </div>
      <canvas ref={chartRef} />
      {tools.length === 0 && <p className="text-gray-500 text-sm text-center mt-4">No tool usage data yet</p>}
    </div>
  );
}

// ============================================================
// Section: Activity Log (Paginated)
// ============================================================
function ActivityLogSection() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadPage = useCallback((p: number) => {
    setLoading(true);
    fetch(`${API_URL}/api/admin/activity-log?page=${p}&per_page=50`, fetchOpts)
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events || []);
        setTotalPages(d.total_pages || 1);
        setPage(d.page || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">User Activity Log</h2>
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={() => loadPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => loadPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-2 py-1 rounded bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </div>
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500 text-sm">No activity yet</p>
      ) : (
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left py-2 pr-3">Time</th>
                <th className="text-left py-2 pr-3">User</th>
                <th className="text-left py-2 pr-3">Action</th>
                <th className="text-left py-2 pr-3">Tool</th>
                <th className="text-left py-2 pr-3">Page</th>
                <th className="text-left py-2 pr-3">File Size</th>
                <th className="text-left py-2 pr-3">Duration</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={i} className="border-b border-gray-800/50 text-gray-300">
                  <td className="py-2 pr-3 text-xs whitespace-nowrap">{formatTime(e.timestamp)}</td>
                  <td className="py-2 pr-3 truncate max-w-[140px]">{e.user}</td>
                  <td className="py-2 pr-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                      e.action === "process" ? "bg-blue-500/20 text-blue-300"
                      : e.action === "pageview" ? "bg-gray-700 text-gray-300"
                      : "bg-yellow-500/20 text-yellow-300"
                    }`}>
                      {e.action}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{e.tool}</td>
                  <td className="py-2 pr-3 truncate max-w-[150px] text-xs">{e.page}</td>
                  <td className="py-2 pr-3">{formatBytes(e.file_size)}</td>
                  <td className="py-2 pr-3">{e.duration_ms ? `${e.duration_ms}ms` : "-"}</td>
                  <td className="py-2">
                    <span className={`text-xs ${e.status === "success" ? "text-green-400" : "text-red-400"}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Analytics Page
// ============================================================
export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [chartReady, setChartReady] = useState(false);
  const dailyChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/admin/analytics?period=${period}`, fetchOpts)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    if (!chartReady || !data || !dailyChartRef.current) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(dailyChartRef.current, {
      type: "line",
      data: {
        labels: data.daily_stats.map((d) => d.day.slice(5)),
        datasets: [
          {
            label: "Page Views",
            data: data.daily_stats.map((d) => d.views),
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59,130,246,0.1)",
            fill: true,
            tension: 0.3,
          },
          {
            label: "Unique Visitors",
            data: data.daily_stats.map((d) => d.visitors),
            borderColor: "#10b981",
            backgroundColor: "rgba(16,185,129,0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { labels: { color: "#9ca3af" } } },
        scales: {
          x: { ticks: { color: "#6b7280" }, grid: { color: "rgba(75,85,99,0.3)" } },
          y: { ticks: { color: "#6b7280" }, grid: { color: "rgba(75,85,99,0.3)" }, beginAtZero: true },
        },
      },
    });
  }, [chartReady, data]);

  // Send heartbeat every 30s with current page
  useEffect(() => {
    const sessionId = Math.random().toString(36).slice(2, 10);
    const sendHeartbeat = () => {
      fetch(`${API_URL}/api/analytics/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          current_page: window.location.pathname,
          session_id: sessionId,
        }),
      }).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) return <div className="text-gray-400">Loading analytics...</div>;

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js@4"
        onLoad={() => setChartReady(true)}
      />

      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">Local analytics tracking</p>
          </div>
          <div className="flex gap-2">
            {["7d", "30d", "90d", "365d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {p === "365d" ? "1y" : p}
              </button>
            ))}
          </div>
        </div>

        {data && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-white">{data.total_pageviews.toLocaleString()}</div>
                <div className="text-sm text-gray-400 mt-1">Page Views</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="text-3xl font-bold text-white">{data.unique_visitors.toLocaleString()}</div>
                <div className="text-sm text-gray-400 mt-1">Unique Visitors</div>
              </div>
            </div>

            {/* Daily chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Daily Traffic</h2>
              <canvas ref={dailyChartRef} />
              {data.daily_stats.length === 0 && (
                <p className="text-gray-500 text-sm text-center mt-4">No data for this period</p>
              )}
            </div>

            {/* Top pages & Referrers side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Top Pages</h2>
                <div className="space-y-2">
                  {data.top_pages.length === 0 ? (
                    <p className="text-gray-500 text-sm">No data yet</p>
                  ) : (
                    data.top_pages.map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
                        <span className="text-sm text-gray-300 truncate max-w-[60%]">{p.page}</span>
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span>{p.views} views</span>
                          <span>{p.visitors} visitors</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Top Referrers</h2>
                <div className="space-y-2">
                  {data.top_referrers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No referrer data yet</p>
                  ) : (
                    data.top_referrers.map((r, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/50">
                        <span className="text-sm text-gray-300 truncate max-w-[70%]">{r.referrer}</span>
                        <span className="text-sm text-gray-400">{r.c}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ====== NEW SECTIONS ====== */}

        {/* 1. Active Users Now */}
        <ActiveUsersSection />

        {/* 2. User Sessions */}
        <SessionsSection />

        {/* 3. Tool Usage Breakdown */}
        <ToolUsageSection chartReady={chartReady} />

        {/* 4. User Activity Log */}
        <ActivityLogSection />
      </div>
    </>
  );
}
