"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function PricingContent() {
  const [user, setUser] = useState<{ id: number; email: string; tier: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  const handleUpgrade = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/register";
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      window.location.href = data.checkout_url;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      window.location.href = data.portal_url;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Simple Pricing</h1>
        <p className="text-gray-400 text-lg">Start free, upgrade when you need more</p>
      </div>

      {success && (
        <div className="mb-8 bg-green-900/20 border border-green-800 rounded-lg p-4 text-green-300 text-center">
          Welcome to Pro! Your account has been upgraded.
        </div>
      )}
      {canceled && (
        <div className="mb-8 bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 text-yellow-300 text-center">
          Checkout was canceled. No charges were made.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Free */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-1">Free</h2>
          <p className="text-gray-400 mb-4">For occasional use</p>
          <div className="text-4xl font-bold mb-6">
            €0<span className="text-lg text-gray-500 font-normal">/month</span>
          </div>
          <ul className="space-y-3 text-sm text-gray-300 mb-8">
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 5 operations per day</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 50MB max file size</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> All basic tools (merge, split, compress, convert)</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> No registration required for 3 free uses</li>
            <li className="flex items-center gap-2 text-gray-500"><span>✗</span> No batch processing</li>
            <li className="flex items-center gap-2 text-gray-500"><span>✗</span> Ads shown</li>
          </ul>
          {user?.tier === "free" ? (
            <div className="text-center text-gray-500 text-sm py-3">Current plan</div>
          ) : !user ? (
            <Link href="/register" className="block text-center bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors">
              Get Started Free
            </Link>
          ) : null}
        </div>

        {/* Pro */}
        <div className="bg-gray-900 border-2 border-blue-600 rounded-xl p-8 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-xs px-3 py-1 rounded-full font-medium">
            RECOMMENDED
          </div>
          <h2 className="text-2xl font-bold mb-1">Pro</h2>
          <p className="text-gray-400 mb-4">For regular users and businesses</p>
          <div className="text-4xl font-bold mb-6">
            €5<span className="text-lg text-gray-500 font-normal">/month</span>
          </div>
          <ul className="space-y-3 text-sm text-gray-300 mb-8">
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 1,000 operations per day</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 200MB max file size</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> All tools including OCR & automation</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Batch processing</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Priority processing</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> No ads</li>
          </ul>
          {user?.tier === "pro" ? (
            <button
              onClick={handleManage}
              disabled={loading}
              className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? "Loading..." : "Manage Subscription"}
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? "Redirecting..." : "Upgrade to Pro"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>All plans include secure file processing. Files are automatically deleted after processing.</p>
        <p className="mt-1">Need a custom plan? <Link href="/about" className="text-blue-400 hover:text-blue-300">Contact us</Link></p>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-6 mt-8 text-center text-gray-400">Loading...</div>}>
      <PricingContent />
    </Suspense>
  );
}
