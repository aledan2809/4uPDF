"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ApiKeysPanel from "../components/ApiKeysPanel";
import { useAuth, getUsageStatus, PlanLimits } from "../lib/auth";
import { describeOperation, relativeTime, QUICK_START, SMART_TOOLS, BATCH_TOOLS } from "../lib/toolMeta";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";

interface UsageData {
  pages_used_today: number;
  pages_limit: number;
  limit_reached: boolean;
  plan: string;
  limits: PlanLimits;
  tasks_used_today?: number;
  tasks_limit?: number;
  tasks_remaining?: number;
}

interface RecentItem {
  operation: string;
  last_at: string;
  uses: number;
}

export default function DashboardPage() {
  const { user, loading, getToken, refreshUser } = useAuth();
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [managingSubscription, setManagingSubscription] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function fetchUsage() {
      if (user) {
        try {
          const data = await getUsageStatus(getToken());
          setUsage({
            pages_used_today: data.pages_used_today ?? 0,
            pages_limit: data.limits.pages_per_day,
            limit_reached: data.limit_reached ?? false,
            plan: data.plan,
            limits: data.limits,
            tasks_used_today: data.tasks_used_today,
            tasks_limit: data.tasks_limit,
            tasks_remaining: data.tasks_remaining,
          });
        } catch {
          console.error("Failed to fetch usage");
        } finally {
          setLoadingUsage(false);
        }
      }
    }
    fetchUsage();
  }, [user, getToken]);

  // Recent activity — powers "pick up where you left off". Best-effort: an empty/failed
  // response simply shows the empty state, never blocks the workspace.
  useEffect(() => {
    async function fetchRecent() {
      if (!user) return;
      try {
        const res = await fetch(`${API_URL}/api/track/recent?limit=6`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data?.items)) setRecent(data.items);
      } catch {
        /* leave recent empty */
      }
    }
    fetchRecent();
  }, [user, getToken]);

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError("Please enter a voucher code");
      return;
    }

    setVoucherError("");
    setVoucherSuccess("");

    try {
      const formData = new FormData();
      formData.append("code", voucherCode.trim());

      const response = await fetch(`${API_URL}/api/voucher/redeem`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setVoucherSuccess(data.message || "Voucher redeemed successfully!");
        setVoucherCode("");
        await refreshUser();
        const newUsage = await getUsageStatus(getToken());
        setUsage({
          pages_used_today: newUsage.pages_used_today ?? 0,
          pages_limit: newUsage.limits.pages_per_day,
          limit_reached: newUsage.limit_reached ?? false,
          plan: newUsage.plan,
          limits: newUsage.limits,
          tasks_used_today: newUsage.tasks_used_today,
          tasks_limit: newUsage.tasks_limit,
          tasks_remaining: newUsage.tasks_remaining,
        });
      } else {
        setVoucherError(data.detail || "Invalid voucher code");
      }
    } catch {
      setVoucherError("Failed to redeem voucher");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("current_password", currentPassword);
      formData.append("new_password", newPassword);

      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setChangingPassword(false);
      } else {
        setPasswordError(data.detail || "Failed to change password");
      }
    } catch {
      setPasswordError("Failed to change password");
    }
  };

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    try {
      const response = await fetch(`${API_URL}/api/stripe/create-portal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (data.portal_url) {
        window.location.href = data.portal_url;
      } else {
        alert(data.detail || "Failed to open subscription portal");
      }
    } catch {
      alert("Failed to open subscription portal");
    } finally {
      setManagingSubscription(false);
    }
  };

  // Unauthenticated: the effect above redirects to /login. Show a neutral
  // notice (no dashboard-shaped chrome) for the brief moment before it fires.
  if (!loading && !user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center px-4">
          <p className="text-gray-400" aria-live="polite">Redirecting to sign in…</p>
        </main>
        <Footer />
      </>
    );
  }

  if (loading || !user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen py-16">
          <div className="max-w-5xl mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-800 rounded w-1/3 mb-8" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-48 bg-gray-800 rounded-xl" />
                <div className="h-48 bg-gray-800 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const planColors: Record<string, string> = {
    free: "text-gray-400",
    bronze: "text-amber-500",
    silver: "text-gray-300",
    gold: "text-yellow-400",
    custom: "text-purple-400",
  };
  const planDisplay: Record<string, string> = { silver: "PRO", gold: "Business" };

  const usagePercent = usage
    ? usage.pages_limit === -1
      ? 0
      : Math.min((usage.pages_used_today / usage.pages_limit) * 100, 100)
    : 0;

  const firstName = user.email.split("@")[0].split(/[.\-_]/)[0];
  const greet = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const isFree = user.plan === "free";
  const tasksLimit = usage?.tasks_limit ?? -1;
  const tasksRemaining = usage?.tasks_remaining;
  const showTaskNudge =
    isFree && tasksLimit > 0 && typeof tasksRemaining === "number" && tasksRemaining <= 1;
  const usesSmartTools = recent.some((r) => /invoice|ocr|receipt|split|extract|searchable/i.test(r.operation));

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Workspace header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-1">Welcome back, {greet} 👋</h1>
            <p className="text-gray-400">Pick up where you left off — or start something new.</p>
          </div>

          {/* Start a task */}
          <section className="mb-8" aria-labelledby="start-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="start-heading" className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Start a task
              </h2>
              <Link href="/#tools" className="text-sm text-blue-400 hover:text-blue-300 underline">
                All tools →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {QUICK_START.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="flex flex-col items-center gap-2 py-4 px-2 bg-gray-900 border border-gray-800 rounded-xl hover:border-blue-500/60 hover:bg-gray-800 transition-colors text-center min-h-[44px]"
                >
                  <span className="text-2xl" aria-hidden="true">{t.icon}</span>
                  <span className="text-sm text-gray-200">{t.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Paid toolkit — surface what the plan already includes, right on the home.
              Free users keep the upgrade cards below instead. */}
          {!isFree && usage?.limits && (usage.limits.smart_tools || usage.limits.batch_processing || usage.limits.api_access) && (
            <section className="mb-8" aria-labelledby="toolkit-heading">
              <h2 id="toolkit-heading" className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Your {planDisplay[user.plan] || "plan"} toolkit
              </h2>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
                {usage.limits.smart_tools && (
                  <div>
                    <p className="text-sm text-gray-300 mb-2">
                      Smart Tools <span className="text-gray-500">— included in your plan</span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {SMART_TOOLS.map((t) => (
                        <Link
                          key={t.href}
                          href={t.href}
                          className="flex flex-col items-center gap-1.5 py-3 px-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-center"
                        >
                          <span className="text-xl" aria-hidden="true">{t.icon}</span>
                          <span className="text-xs text-gray-200">{t.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {usage.limits.batch_processing && (
                  <div>
                    <p className="text-sm text-gray-300 mb-2">
                      Batch processing <span className="text-gray-500">— many files at once</span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {BATCH_TOOLS.map((t) => (
                        <Link
                          key={t.label}
                          href={t.href}
                          className="flex items-center gap-2 py-2.5 px-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <span className="text-lg" aria-hidden="true">{t.icon}</span>
                          <span className="text-sm text-gray-200">{t.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {usage.limits.api_access && (
                  <div>
                    <p className="text-sm text-gray-300 mb-2">
                      PDF API <span className="text-gray-500">— automate from your own systems</span>
                    </p>
                    <a
                      href="#api-panel"
                      className="inline-flex items-center gap-2 py-2.5 px-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-lg" aria-hidden="true">🔑</span>
                      <span className="text-sm text-gray-200">Manage API keys</span>
                    </a>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Recent activity */}
          <section className="mb-8" aria-labelledby="recent-heading">
            <h2 id="recent-heading" className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Recent
            </h2>
            {recent.length > 0 ? (
              <div className="grid gap-2.5">
                {recent.map((item) => {
                  const meta = describeOperation(item.operation);
                  const when = relativeTime(item.last_at);
                  return (
                    <div
                      key={item.operation}
                      className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg"
                    >
                      <span className="w-9 h-9 flex-none rounded-lg bg-blue-600/15 grid place-items-center text-lg" aria-hidden="true">
                        {meta.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{meta.label}</p>
                        <p className="text-xs text-gray-500">
                          Used {item.uses}×{when ? ` · ${when}` : ""}
                        </p>
                      </div>
                      <Link
                        href={meta.href}
                        className="ml-auto flex-none px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        Open
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 bg-gray-900 border border-gray-800 border-dashed rounded-xl text-center">
                <p className="text-gray-400 text-sm">No recent activity yet.</p>
                <p className="text-gray-500 text-xs mt-1">Start with a tool above — your recent tools will appear here.</p>
              </div>
            )}
          </section>

          {/* Approaching-limit nudge (free tier) */}
          {showTaskNudge && (
            <div className="mb-8 flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/40 rounded-xl">
              <span className="text-xl" aria-hidden="true">⏳</span>
              <p className="text-sm text-amber-200">
                {tasksRemaining === 0
                  ? "You've used all 3 free tasks today."
                  : "1 free task left today."}{" "}
                <span className="text-amber-100">PRO removes the daily cap.</span>
              </p>
              <Link
                href="/pricing?plan=silver"
                className="ml-auto flex-none px-3 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-gray-900 font-medium rounded-lg transition-colors"
              >
                See PRO
              </Link>
            </div>
          )}

          {/* Usage + plan status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Usage Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Today&apos;s Usage</h2>
              {loadingUsage ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-1/2 mb-4" />
                  <div className="h-2 bg-gray-800 rounded w-full" />
                </div>
              ) : usage ? (
                <>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-3xl font-bold text-white tabular-nums">
                      {usage.pages_used_today}
                    </span>
                    <span className="text-gray-400">
                      / {usage.pages_limit === -1 ? "Unlimited" : usage.pages_limit} pages
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-yellow-500" : "bg-blue-600"
                      }`}
                      style={{ width: `${usage.pages_limit === -1 ? 0 : usagePercent}%` }}
                    />
                  </div>
                  {isFree && tasksLimit > 0 && typeof tasksRemaining === "number" && (
                    <p className="text-sm text-gray-400">
                      {Math.max(0, tasksRemaining)} of {tasksLimit} free tasks left today
                    </p>
                  )}
                  {usage.limit_reached && (
                    <p className="text-sm text-red-400 mt-1">
                      Daily limit reached.{" "}
                      <Link href="/pricing" className="text-blue-400 underline hover:text-blue-300">
                        Upgrade for more
                      </Link>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-400">Failed to load usage data</p>
              )}
            </div>

            {/* Plan / upgrade Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Your Plan</h2>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className={`text-2xl font-bold ${planColors[user.plan] || "text-white"}`}>
                    {planDisplay[user.plan] || user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                  </p>
                  {user.subscription_status === "active" && (
                    <p className="text-sm text-green-400">Active subscription</p>
                  )}
                  {user.subscription_end_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Renews {new Date(user.subscription_end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {user.plan !== "free" && user.plan !== "custom" && (
                  <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">Premium</span>
                )}
              </div>
              {isFree ? (
                <Link
                  href="/pricing?plan=silver"
                  className="block w-full py-3 px-4 text-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Upgrade to PRO
                </Link>
              ) : user.plan !== "custom" ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={managingSubscription}
                  className="w-full py-3 px-4 text-center bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {managingSubscription ? "Loading..." : "Manage Subscription"}
                </button>
              ) : (
                <div className="text-sm text-gray-400">Custom plan managed by administrator</div>
              )}
            </div>
          </div>

          {/* Contextual upgrade card (free users) */}
          {isFree && (
            <div className="mb-10 rounded-xl p-6 border border-blue-500/40 bg-gradient-to-b from-blue-600/15 to-blue-600/5">
              <h3 className="text-lg font-semibold text-white">
                {usesSmartTools ? "You're using Smart Tools — PRO makes them unlimited." : "Do more with PRO."}
              </h3>
              <p className="text-sm text-blue-100/80 mt-1">
                Unlimited daily tasks, no ads, files up to 200MB, batch processing, OCR &amp; Smart Tools, priority support.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Link
                  href="/pricing?plan=silver"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  See PRO — from €4.99/mo
                </Link>
                <Link href="/pricing" className="text-sm text-blue-300 hover:text-blue-200 underline">
                  Compare plans
                </Link>
              </div>
            </div>
          )}

          {/* Account & settings (secondary) */}
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Account &amp; settings</h2>
          </div>

          {/* Plan Features */}
          {usage?.limits && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Plan Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">File Size Limit</p>
                  <p className="text-lg font-semibold text-white">{usage.limits.max_file_size_mb} MB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pages per Day</p>
                  <p className="text-lg font-semibold text-white">
                    {usage.limits.pages_per_day === -1 ? "Unlimited" : usage.limits.pages_per_day}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Batch Processing</p>
                  <p className={`text-lg font-semibold ${usage.limits.batch_processing ? "text-green-400" : "text-gray-500"}`}>
                    {usage.limits.batch_processing ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Smart Tools</p>
                  <p className={`text-lg font-semibold ${usage.limits.smart_tools ? "text-green-400" : "text-gray-500"}`}>
                    {usage.limits.smart_tools ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* API Keys (B2B PDF API — self-gates on plan api_access) */}
          <div id="api-panel">
            <ApiKeysPanel />
          </div>

          {/* Voucher Redemption */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Redeem Voucher</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Enter voucher code"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleRedeemVoucher}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Redeem
              </button>
            </div>
            {voucherError && <p className="mt-3 text-sm text-red-400">{voucherError}</p>}
            {voucherSuccess && <p className="mt-3 text-sm text-green-400">{voucherSuccess}</p>}
          </div>

          {/* Account Settings */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Account Settings</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white">{user.email}</p>
              </div>

              {!changingPassword ? (
                <button
                  onClick={() => setChangingPassword(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Change password
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
                  {passwordError && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
                      {passwordSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Current password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">New password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Confirm new password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Update Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChangingPassword(false);
                        setPasswordError("");
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
