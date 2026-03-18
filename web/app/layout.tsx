import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "4uPDF - Free Online PDF Tools | Merge, Split, Compress, Convert PDFs",
  description: "Free online PDF tools to merge, split, compress, convert, rotate, watermark, sign, and protect PDF files. No installation required. Process PDFs instantly in your browser.",
  keywords: "PDF tools, merge PDF, split PDF, compress PDF, convert PDF to Word, PDF to JPG, sign PDF, watermark PDF, protect PDF, online PDF editor, free PDF tools",
  authors: [{ name: "4uPDF" }],
  metadataBase: new URL("https://4updf.com"),
  alternates: { canonical: "https://4updf.com" },
  openGraph: {
    title: "4uPDF - Free Online PDF Tools",
    description: "Free online PDF tools to merge, split, compress, convert, rotate, watermark, sign, and protect PDF files. Process PDFs instantly in your browser.",
    url: "https://4updf.com",
    siteName: "4uPDF",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "4uPDF - Free Online PDF Tools",
    description: "Free online PDF tools to merge, split, compress, convert, rotate, watermark, sign, and protect PDF files.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <AuthProvider>
          <Header />
          {children}
          <footer className="border-t border-gray-800 bg-gray-950 mt-16">
            <div className="max-w-6xl mx-auto px-6 py-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="font-bold text-lg mb-3">4uPDF</h3>
                  <p className="text-gray-400 text-sm">Free online PDF tools. Process PDFs directly in your browser without uploads to cloud servers.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Core Tools</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><Link href="/merge-pdf" className="hover:text-white transition-colors">Merge PDF</Link></li>
                    <li><Link href="/split-pdf" className="hover:text-white transition-colors">Split PDF</Link></li>
                    <li><Link href="/compress-pdf" className="hover:text-white transition-colors">Compress PDF</Link></li>
                    <li><Link href="/rotate-pdf" className="hover:text-white transition-colors">Rotate PDF</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Convert</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><Link href="/pdf-to-word" className="hover:text-white transition-colors">PDF to Word</Link></li>
                    <li><Link href="/word-to-pdf" className="hover:text-white transition-colors">Word to PDF</Link></li>
                    <li><Link href="/jpg-to-pdf" className="hover:text-white transition-colors">JPG to PDF</Link></li>
                    <li><Link href="/pdf-to-jpg" className="hover:text-white transition-colors">PDF to JPG</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Advanced</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li><Link href="/sign-pdf" className="hover:text-white transition-colors">Sign PDF</Link></li>
                    <li><Link href="/watermark-pdf" className="hover:text-white transition-colors">Watermark PDF</Link></li>
                    <li><Link href="/protect-pdf" className="hover:text-white transition-colors">Protect PDF</Link></li>
                    <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                    <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                    <li><Link href="/about" className="hover:text-white transition-colors">About / Contact</Link></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} 4uPDF. All rights reserved. Free online PDF tools.</p>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
