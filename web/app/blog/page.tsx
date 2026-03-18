import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - PDF Tips, Guides & Tutorials | 4uPDF",
  description: "Learn how to merge, split, compress, and convert PDF files. Tips for document automation, OCR processing, and organizing scanned archives.",
  alternates: { canonical: "https://4updf.com/blog" },
  openGraph: {
    title: "4uPDF Blog - PDF Tips & Guides",
    description: "Learn how to work with PDF files efficiently. Guides, tips, and tutorials for PDF processing.",
    url: "https://4updf.com/blog",
    siteName: "4uPDF",
    type: "website",
  },
};

const POSTS = [
  {
    slug: "how-to-merge-pdf-files-online-free",
    title: "How to Merge PDF Files Online for Free",
    excerpt: "Learn the fastest way to combine multiple PDF documents into a single file without installing any software.",
    date: "2026-03-18",
    readTime: "4 min read",
    tools: ["merge-pdf"],
  },
  {
    slug: "how-to-split-large-scanned-pdfs",
    title: "How to Split Large Scanned PDFs",
    excerpt: "A complete guide to splitting large scanned documents using OCR, text patterns, barcodes, and invoice numbers.",
    date: "2026-03-18",
    readTime: "6 min read",
    tools: ["split-pdf", "split-ocr", "split-barcode", "split-invoice"],
  },
  {
    slug: "compress-pdf-without-losing-quality",
    title: "How to Compress PDF Without Losing Quality",
    excerpt: "Reduce PDF file size for email attachments and uploads while maintaining readability and image quality.",
    date: "2026-03-18",
    readTime: "4 min read",
    tools: ["compress-pdf"],
  },
  {
    slug: "organize-scanned-document-archives",
    title: "How to Organize Scanned Document Archives",
    excerpt: "Automate the classification, splitting, and renaming of large scanned document collections using AI.",
    date: "2026-03-18",
    readTime: "5 min read",
    tools: ["process-archive", "detect-type", "auto-rename"],
  },
  {
    slug: "best-free-pdf-tools-2026",
    title: "Best Free PDF Tools in 2026",
    excerpt: "A comprehensive comparison of the best free online PDF tools available today for merge, split, convert, and more.",
    date: "2026-03-18",
    readTime: "7 min read",
    tools: [],
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 mt-8">
      <h1 className="text-4xl font-bold mb-3">Blog</h1>
      <p className="text-gray-400 text-lg mb-10">Tips, guides, and tutorials for working with PDF files</p>

      <div className="space-y-8">
        {POSTS.map((post) => (
          <article key={post.slug} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <Link href={`/blog/${post.slug}`}>
              <h2 className="text-xl font-bold mb-2 hover:text-blue-400 transition-colors">{post.title}</h2>
            </Link>
            <p className="text-gray-400 mb-3">{post.excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{post.date}</span>
              <span>{post.readTime}</span>
              {post.tools.length > 0 && (
                <div className="flex gap-2">
                  {post.tools.map((tool) => (
                    <Link key={tool} href={`/${tool}`} className="text-blue-400 hover:text-blue-300">
                      {tool.replace(/-/g, " ")}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
