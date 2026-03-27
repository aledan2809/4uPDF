"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";

const fetchOpts: RequestInit = { credentials: "include" };

interface User {
  id: string;
  email: string;
  plan: string;
  base_plan: string;
  subscription_status: string;
  created_at: string;
  last_active: string | null;
  is_banned: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(0);
  const limit = 25;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(page * limit),
      sort_by: "created_at",
      sort_dir: "desc",
    });
    if (search) params.set("search", search);
    if (planFilter) params.set("plan_filter", planFilter);

    try {
      const res = await fetch(`${API_URL}/api/admin/users?${params}`, fetchOpts);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, planFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleBan = async (userId: string) => {
    await fetch(`${API_URL}/api/admin/users/${userId}/ban`, {
      method: "POST",
      credentials: "include",
    });
    fetchUsers();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 text-sm mt-1">{total} total users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by email..."
          title="Search users by email"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(0); }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Registered</th>
                <th className="px-4 py-3 font-medium">Last Active</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-white">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        u.plan === "gold" ? "bg-yellow-500/20 text-yellow-400" :
                        u.plan === "silver" ? "bg-gray-500/20 text-gray-300" :
                        u.plan === "bronze" ? "bg-orange-500/20 text-orange-400" :
                        "bg-gray-700/50 text-gray-400"
                      }`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_banned ? (
                        <span className="text-red-400 text-xs font-medium">Banned</span>
                      ) : (
                        <span className="text-green-400 text-xs font-medium">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-gray-400">{u.last_active ? formatDate(u.last_active) : "Never"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleBan(u.id)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          u.is_banned
                            ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                            : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                        }`}
                      >
                        {u.is_banned ? "Unban" : "Ban"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <span className="text-sm text-gray-400">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
