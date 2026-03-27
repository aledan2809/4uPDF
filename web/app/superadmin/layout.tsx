"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";

const NAV_ITEMS = [
  { href: "/superadmin", label: "Dashboard", icon: "📊" },
  { href: "/superadmin/users", label: "Users", icon: "👥" },
  { href: "/superadmin/vouchers", label: "Vouchers", icon: "🎟️" },
  { href: "/superadmin/stats", label: "Stats", icon: "📈" },
  { href: "/superadmin/settings", label: "Settings", icon: "⚙️" },
  { href: "/superadmin/analytics", label: "Analytics", icon: "🔍" },
];

// Pages that don't require authentication
const PUBLIC_PATHS = ["/superadmin/login", "/superadmin/forgot-password", "/superadmin/reset-password"];

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (isPublicPage) {
      setChecking(false);
      return;
    }

    fetch(`${API_URL}/api/superadmin/verify`, {
      credentials: "include",
    })
      .then((r) => {
        if (r.ok) {
          setAuthenticated(true);
        } else {
          router.push("/superadmin/login");
        }
      })
      .catch(() => {
        router.push("/superadmin/login");
      })
      .finally(() => setChecking(false));
  }, [pathname, router, isPublicPage]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Verifying access...</div>
      </div>
    );
  }

  if (!authenticated) return null;

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/superadmin/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore errors
    }
    router.push("/superadmin/login");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">4uPDF Admin</h1>
          <p className="text-xs text-gray-500 mt-1">SuperAdmin Panel</p>
        </div>

        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-4 p-4 border-b border-gray-800 bg-gray-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-semibold">4uPDF Admin</span>
        </div>

        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
