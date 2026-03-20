"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../lib/auth";

const toolCategories = [
  {
    name: "PDF Tools",
    href: "#",
    items: [
      { name: "Merge PDF", href: "/tools/merge-pdf" },
      { name: "Split PDF", href: "/tools/split-pdf" },
      { name: "Compress PDF", href: "/tools/compress-pdf" },
      { name: "Rotate PDF", href: "/tools/rotate-pdf" },
      { name: "Delete Pages", href: "/tools/delete-pages" },
      { name: "Extract Pages", href: "/tools/extract-pages" },
      { name: "Organize PDF", href: "/tools/organize-pdf" },
    ],
  },
  {
    name: "Convert",
    href: "#",
    items: [
      { name: "PDF to Word", href: "/tools/pdf-to-word" },
      { name: "PDF to Excel", href: "/tools/pdf-to-excel" },
      { name: "PDF to PowerPoint", href: "/tools/pdf-to-powerpoint" },
      { name: "PDF to JPG", href: "/tools/pdf-to-jpg" },
      { name: "Word to PDF", href: "/tools/word-to-pdf" },
      { name: "Excel to PDF", href: "/tools/excel-to-pdf" },
      { name: "JPG to PDF", href: "/tools/jpg-to-pdf" },
      { name: "HTML to PDF", href: "/tools/html-to-pdf" },
    ],
  },
  {
    name: "Edit",
    href: "#",
    items: [
      { name: "Edit PDF", href: "/tools/edit-pdf" },
      { name: "Sign PDF", href: "/tools/sign-pdf" },
      { name: "Add Watermark", href: "/tools/add-watermark" },
      { name: "Add Page Numbers", href: "/tools/add-page-numbers" },
      { name: "Annotate PDF", href: "/tools/annotate-pdf" },
      { name: "Redact PDF", href: "/tools/redact-pdf" },
    ],
  },
  {
    name: "Smart Tools",
    href: "/automation",
    items: [
      { name: "OCR PDF", href: "/tools/ocr-pdf" },
      { name: "Searchable PDF", href: "/tools/searchable-pdf" },
      { name: "Split by Text", href: "/tools/split-by-text" },
      { name: "Split Invoices", href: "/tools/split-invoices" },
      { name: "Auto-Rename PDF", href: "/tools/auto-rename-pdf" },
      { name: "Document Detector", href: "/tools/document-detector" },
      { name: "Extract Text", href: "/tools/extract-text-from-pdf" },
      { name: "View All Smart Tools", href: "/automation" },
    ],
  },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    window.location.href = "/";
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">4u</span>
              </div>
              <span className="text-xl font-bold text-white">
                4uPDF<span className="text-blue-400">.com</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {toolCategories.map((category) => (
              <div
                key={category.name}
                className="relative"
                onMouseEnter={() => setOpenDropdown(category.name)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                  {category.name}
                  <svg
                    className="w-4 h-4 ml-1 inline-block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openDropdown === category.name && (
                  <div className="absolute left-0 mt-0 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2">
                    {category.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/blog"
              className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/pricing"
              className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Pricing
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-gray-800 rounded animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="max-w-[120px] truncate">{user.email}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-2">
                    <div className="px-4 py-2 border-b border-gray-800">
                      <p className="text-sm text-gray-400">Signed in as</p>
                      <p className="text-sm text-white truncate">{user.email}</p>
                      <p className="text-xs text-blue-400 mt-1 capitalize">{user.plan} Plan</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Dashboard
                    </Link>
                    {user.plan === "free" && (
                      <Link
                        href="/pricing"
                        className="block px-4 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        Upgrade Plan
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800"
                    >
                      <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            {toolCategories.map((category) => (
              <div key={category.name} className="mb-4">
                <div className="px-4 py-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  {category.name}
                </div>
                {category.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-6 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            ))}
            <Link
              href="/blog"
              className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/pricing"
              className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <div className="border-t border-gray-800 pt-4 px-4 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="px-2 py-2 text-sm text-gray-400">
                    Signed in as <span className="text-white">{user.email}</span>
                    <span className="text-xs text-blue-400 ml-2 capitalize">({user.plan})</span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm text-gray-300 hover:text-white text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-center"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm text-gray-300 hover:text-white text-center"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center"
                  >
                    Sign up free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
