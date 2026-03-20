"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth";

interface UpgradePromptProps {
  reason?: "limit_reached" | "file_too_large" | "feature_locked";
  featureName?: string;
  onClose?: () => void;
}

export default function UpgradePrompt({ reason = "limit_reached", featureName, onClose }: UpgradePromptProps) {
  const { user } = useAuth();

  const getMessage = () => {
    switch (reason) {
      case "limit_reached":
        return {
          title: "Daily Limit Reached",
          description: "You've reached your daily page processing limit. Upgrade your plan to continue processing PDFs today.",
        };
      case "file_too_large":
        return {
          title: "File Too Large",
          description: `Your file exceeds the ${user?.plan === "free" ? "50MB" : ""} limit for your current plan. Upgrade for larger file support.`,
        };
      case "feature_locked":
        return {
          title: "Premium Feature",
          description: `${featureName || "This feature"} is available on premium plans. Upgrade to unlock it.`,
        };
      default:
        return {
          title: "Upgrade Your Plan",
          description: "Get access to more features and higher limits.",
        };
    }
  };

  const message = getMessage();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{message.title}</h2>
          <p className="text-gray-400">{message.description}</p>
        </div>

        <div className="space-y-3">
          {!user ? (
            <>
              <Link
                href="/signup"
                className="block w-full py-3 px-4 text-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Create Free Account
              </Link>
              <Link
                href="/login"
                className="block w-full py-3 px-4 text-center bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors border border-gray-700"
              >
                Sign In
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className="block w-full py-3 px-4 text-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                View Plans
              </Link>
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 text-center bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors border border-gray-700"
                >
                  Maybe Later
                </button>
              )}
            </>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-sm text-gray-500 text-center">
            Premium plans start at{" "}
            <span className="text-white font-medium">just 3.99/mo</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function UsageBanner() {
  const { user } = useAuth();

  if (user && user.plan !== "free") return null;

  return (
    <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-white font-medium">
              {user ? "Upgrade for more power" : "Create an account for more features"}
            </p>
            <p className="text-xs text-gray-400">
              {user
                ? "Get unlimited pages, larger files, and smart tools"
                : "Track your usage and unlock premium features"}
            </p>
          </div>
        </div>
        <Link
          href={user ? "/pricing" : "/signup"}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {user ? "Upgrade" : "Sign Up Free"}
        </Link>
      </div>
    </div>
  );
}

export function InlineUpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
      <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <p className="text-sm text-gray-400 mb-3">{feature} is a premium feature</p>
      <Link
        href="/pricing"
        className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Upgrade to Unlock
      </Link>
    </div>
  );
}
