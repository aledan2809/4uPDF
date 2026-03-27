"use client";

import { useEffect, useState, useRef } from "react";
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
      </div>
    </>
  );
}
