import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getHowToPage } from "@/lib/blog";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Newsletter from "../components/Newsletter";
import SocialShare from "../components/SocialShare";

const BASE_URL = "https://4updf.com";
const PAGE_URL = `${BASE_URL}/how-to-organize-scanned-documents`;

export const metadata: Metadata = {
  title: "How to Organize Scanned Documents - Complete Guide",
  description:
    "Build a professional document organization system for scanned files. Learn folder structures, naming conventions, and search optimization.",
  openGraph: {
    type: "article",
    url: PAGE_URL,
    title: "How to Organize Scanned Documents - Complete Guide",
    description:
      "Build a professional document organization system for scanned files. Learn folder structures, naming conventions, and search optimization.",
  },
  alternates: {
    canonical: PAGE_URL,
  },
};

export default function HowToOrganizeScannedDocumentsPage() {
  const page = getHowToPage("organize-scanned-documents");

  if (!page) {
    notFound();
  }

  const toolSlug = "organize-scanned-documents";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-950">
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {page.title}
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                {page.description}
              </p>
              <Link
                href={`/tools/${toolSlug}`}
                className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-xl transition-colors"
              >
                Try Free Tool
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-invert prose-lg max-w-none">
              <MDXRemote source={page.content} />
            </div>

            <div className="mt-12">
              <SocialShare title={page.title} url={PAGE_URL} />
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Newsletter />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
