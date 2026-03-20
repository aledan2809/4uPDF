"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../lib/auth";

const plans = [
  {
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    period: "forever",
    description: "Perfect for occasional use",
    features: [
      "All basic PDF tools",
      "Up to 50MB file size",
      "200 pages per day",
      "Standard processing speed",
      "Includes ads",
    ],
    limitations: ["No batch processing", "No smart tools"],
    cta: "Get Started Free",
    href: "/",
    popular: false,
    requiresLogin: false,
  },
  {
    name: "Bronze",
    priceMonthly: 3.99,
    priceAnnual: 38.30,
    period: "per month",
    description: "For regular PDF users",
    features: [
      "All basic PDF tools",
      "Up to 150MB file size",
      "500 pages per day",
      "Faster processing",
      "No ads",
      "Batch processing",
      "Email support",
    ],
    limitations: [],
    cta: "Subscribe",
    href: "/signup?plan=bronze",
    popular: false,
    requiresLogin: true,
  },
  {
    name: "Silver",
    priceMonthly: 7.99,
    priceAnnual: 76.70,
    period: "per month",
    description: "Best for professionals",
    features: [
      "All PDF tools + Smart Tools",
      "Up to 300MB file size",
      "1000 pages per day",
      "Priority processing",
      "No ads",
      "Batch processing",
      "Smart automation tools",
      "Priority email support",
    ],
    limitations: [],
    cta: "Subscribe",
    href: "/signup?plan=silver",
    popular: true,
    requiresLogin: true,
  },
  {
    name: "Gold",
    priceMonthly: 17.99,
    priceAnnual: 172.70,
    period: "per month",
    description: "For power users",
    features: [
      "All PDF + Smart Tools",
      "Up to 500MB file size",
      "Unlimited pages",
      "Fastest processing",
      "No ads",
      "Batch processing",
      "Smart automation tools",
      "Full API access",
      "Workflow automation",
      "Priority support",
    ],
    limitations: [],
    cta: "Subscribe",
    href: "/signup?plan=gold",
    popular: false,
    requiresLogin: true,
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");
  const { user, getToken } = useAuth();

  const handleSubscribe = async (planName: string) => {
    if (!user) {
      window.location.href = `/signup?plan=${planName.toLowerCase()}`;
      return;
    }

    setLoading(planName);
    try {
      const formData = new FormData();
      formData.append("plan", planName.toLowerCase());
      formData.append("billing_period", billingPeriod);

      const response = await fetch(`${API_URL}/api/stripe/create-checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.detail || "Failed to create checkout session");
      }
    } catch {
      alert("Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  const handleRedeemVoucher = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

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
      } else {
        setVoucherError(data.detail || "Invalid voucher code");
      }
    } catch {
      setVoucherError("Failed to redeem voucher");
    }
  };

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.priceMonthly === 0) return "Free";
    const price = billingPeriod === "monthly" ? plan.priceMonthly : plan.priceAnnual;
    const suffix = billingPeriod === "monthly" ? "/mo" : "/yr";
    return `€${price.toFixed(2)}${suffix}`;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.priceMonthly === 0) return null;
    const monthlyTotal = plan.priceMonthly * 12;
    const savings = monthlyTotal - plan.priceAnnual;
    const percent = Math.round((savings / monthlyTotal) * 100);
    return percent;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Choose the plan that fits your needs. Start free and upgrade anytime.
            </p>

            <div className="inline-flex items-center bg-gray-900 border border-gray-800 rounded-lg p-1">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingPeriod === "monthly"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  billingPeriod === "annual"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Annual <span className="text-green-400 ml-1">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-gray-900 border rounded-2xl p-6 ${
                  plan.popular
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-gray-800"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">{plan.name}</h2>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">{getPrice(plan)}</span>
                  </div>
                  {billingPeriod === "annual" && getSavings(plan) && (
                    <p className="text-sm text-green-400 mt-1">
                      Save {getSavings(plan)}% annually
                    </p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">{limitation}</span>
                    </li>
                  ))}
                </ul>

                {plan.requiresLogin ? (
                  <button
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={loading === plan.name}
                    className={`block w-full py-3 px-4 text-center font-medium rounded-lg transition-colors ${
                      plan.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-600/50"
                        : "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 disabled:bg-gray-800/50"
                    }`}
                  >
                    {loading === plan.name ? "Loading..." : plan.cta}
                  </button>
                ) : (
                  <Link
                    href={plan.href}
                    className="block w-full py-3 px-4 text-center font-medium rounded-lg transition-colors bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Need a Custom Solution?</h2>
              <p className="text-blue-100 mb-6">
                For large teams, enterprise needs, or custom integrations, contact us directly.
              </p>
              <div className="space-y-3 text-white">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <a href="https://wa.me/40749591399" className="hover:underline">+40 749 591 399</a>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:office@4updf.com" className="hover:underline">office@4updf.com</a>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Have a Voucher Code?</h2>
              <p className="text-gray-400 mb-6">
                Enter your voucher code to unlock premium features.
              </p>
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
              {voucherError && (
                <p className="mt-3 text-sm text-red-400">{voucherError}</p>
              )}
              {voucherSuccess && (
                <p className="mt-3 text-sm text-green-400">{voucherSuccess}</p>
              )}
              {!user && (
                <p className="mt-3 text-sm text-gray-500">
                  <Link href="/login" className="text-blue-400 hover:underline">Log in</Link> to redeem vouchers
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
