"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth, getUsageStatus, PlanLimits } from "../lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";

interface UsageData {
  pages_used_today: number;
  pages_limit: number;
  limit_reached: boolean;
  plan: string;
  limits: PlanLimits;
}

export default function DashboardPage() {
  const { user, loading, getToken, refreshUser } = useAuth();
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
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
            pages_used_today: 0,
            pages_limit: data.limits.pages_per_day,
            limit_reached: false,
            plan: data.plan,
            limits: data.limits,
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
          pages_used_today: 0,
          pages_limit: newUsage.limits.pages_per_day,
          limit_reached: false,
          plan: newUsage.plan,
          limits: newUsage.limits,
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

  if (loading || !user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen py-16">
          <div className="max-w-4xl mx-auto px-4">
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

  const usagePercent = usage
    ? usage.pages_limit === -1
      ? 0
      : Math.min((usage.pages_used_today / usage.pages_limit) * 100, 100)
    : 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user.email}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Plan Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Your Plan</h2>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className={`text-2xl font-bold capitalize ${planColors[user.plan] || "text-white"}`}>
                    {user.plan}
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
                  <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">
                    Premium
                  </span>
                )}
              </div>

              {user.plan === "free" ? (
                <Link
                  href="/pricing"
                  className="block w-full py-3 px-4 text-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Upgrade Plan
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
                <div className="text-sm text-gray-400">
                  Custom plan managed by administrator
                </div>
              )}
            </div>

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
                    <span className="text-3xl font-bold text-white">
                      {usage.pages_used_today}
                    </span>
                    <span className="text-gray-400">
                      / {usage.pages_limit === -1 ? "Unlimited" : usage.pages_limit} pages
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        usagePercent >= 90
                          ? "bg-red-500"
                          : usagePercent >= 70
                          ? "bg-yellow-500"
                          : "bg-blue-600"
                      }`}
                      style={{ width: `${usage.pages_limit === -1 ? 0 : usagePercent}%` }}
                    />
                  </div>
                  {usage.limit_reached && (
                    <p className="text-sm text-red-400">
                      Daily limit reached.{" "}
                      <Link href="/pricing" className="text-blue-400 hover:underline">
                        Upgrade for more
                      </Link>
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-400">Failed to load usage data</p>
              )}
            </div>
          </div>

          {/* Plan Features */}
          {usage?.limits && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Plan Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">File Size Limit</p>
                  <p className="text-lg font-semibold text-white">
                    {usage.limits.max_file_size_mb} MB
                  </p>
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

          {/* Voucher Redemption */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
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
