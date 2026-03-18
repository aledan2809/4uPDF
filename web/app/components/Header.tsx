"use client";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function Header() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold hover:text-blue-400 transition-colors">
          4uPDF
        </Link>
        <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
          <Link href="/merge-pdf" className="hover:text-white transition-colors">Merge</Link>
          <Link href="/split-pdf" className="hover:text-white transition-colors">Split</Link>
          <Link href="/compress-pdf" className="hover:text-white transition-colors">Compress</Link>
          <Link href="/rotate-pdf" className="hover:text-white transition-colors">Rotate</Link>
          <Link href="/delete-pages" className="hover:text-white transition-colors">Delete</Link>
          <Link href="/extract-pages" className="hover:text-white transition-colors">Extract</Link>
          <Link href="/watermark-pdf" className="hover:text-white transition-colors">Watermark</Link>
          <Link href="/protect-pdf" className="hover:text-white transition-colors">Protect</Link>
          <Link href="/unlock-pdf" className="hover:text-white transition-colors">Unlock</Link>
          <span className="text-gray-700">|</span>
          <Link href="/pdf-to-word" className="hover:text-white transition-colors">PDF→Word</Link>
          <Link href="/jpg-to-pdf" className="hover:text-white transition-colors">IMG→PDF</Link>
          <Link href="/pdf-to-jpg" className="hover:text-white transition-colors">PDF→JPG</Link>
          <Link href="/sign-pdf" className="hover:text-white transition-colors">Sign</Link>
          <Link href="/split-pattern" className="hover:text-white transition-colors">Pattern</Link>
          <Link href="/split-invoice" className="hover:text-white transition-colors">Invoice</Link>
          <Link href="/split-barcode" className="hover:text-white transition-colors">Barcode</Link>
          <Link href="/auto-rename" className="hover:text-white transition-colors">Rename</Link>
          <Link href="/detect-type" className="hover:text-white transition-colors">Detect</Link>
          <span className="text-gray-700">|</span>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <span className="text-gray-700">|</span>
          {loading ? (
            <span className="text-gray-500 text-xs">...</span>
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs">
                {user.email.split("@")[0]}
                {user.tier === "pro" && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs">PRO</span>
                )}
              </span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-white transition-colors text-xs"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
