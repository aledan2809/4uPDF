"use client";

import { useAuth } from "../lib/auth";
import Link from "next/link";

interface AdsBannerProps {
  placement?: "top" | "bottom" | "sidebar";
  className?: string;
}

export default function AdsBanner({ placement = "top", className = "" }: AdsBannerProps) {
  const { user } = useAuth();

  // Hide ads for paid users
  if (user && user.plan !== "free") {
    return null;
  }

  const placementStyles = {
    top: "w-full h-[90px] mb-4",
    bottom: "w-full h-[90px] mt-4",
    sidebar: "w-[300px] h-[250px]",
  };

  return (
    <div className={`${placementStyles[placement]} ${className}`}>
      {/* Ad container - replace with actual ad code in production */}
      <div className="w-full h-full bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-center relative">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">Advertisement</p>
          <div className="text-gray-600 text-sm">
            {/* Placeholder for ad network code */}
            {/* In production, insert Google AdSense or other ad code here */}
            <span className="text-gray-500">Ad Space</span>
          </div>
        </div>

        {/* Remove ads CTA */}
        <Link
          href="/pricing"
          className="absolute bottom-2 right-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Remove ads
        </Link>
      </div>
    </div>
  );
}

export function SponsoredBanner() {
  const { user } = useAuth();

  if (user && user.plan !== "free") {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="text-yellow-400">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              Upgrade to remove ads
            </p>
            <p className="text-xs text-gray-400">
              Plus get more features starting at just 3.99/month
            </p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          View Plans
        </Link>
      </div>
    </div>
  );
}
