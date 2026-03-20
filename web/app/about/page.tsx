import { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "About Us - 4uPDF",
  description:
    "Learn about 4uPDF - our mission to make PDF tools accessible, fast, and secure for everyone.",
  alternates: {
    canonical: "https://4updf.com/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-white mb-8">About 4uPDF</h1>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Our Mission</h2>
              <p className="text-gray-300 leading-relaxed text-lg">
                At 4uPDF, we believe that powerful PDF tools should be accessible to everyone. Our
                mission is to provide fast, secure, and easy-to-use PDF solutions that help individuals
                and businesses work more efficiently with documents.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">What We Offer</h2>
              <p className="text-gray-300 leading-relaxed">
                We provide a comprehensive suite of 40+ PDF tools, including:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-2">Core PDF Operations</h3>
                  <p className="text-gray-400 text-sm">
                    Merge, split, compress, rotate, and organize your PDFs with ease.
                  </p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-2">File Conversions</h3>
                  <p className="text-gray-400 text-sm">
                    Convert PDFs to Word, Excel, PowerPoint, images, and more.
                  </p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-2">Editing Tools</h3>
                  <p className="text-gray-400 text-sm">
                    Edit, annotate, sign, add watermarks, and customize your PDFs.
                  </p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-2">Smart Automation</h3>
                  <p className="text-gray-400 text-sm">
                    OCR, document detection, invoice splitting, and data extraction.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Why Choose 4uPDF?</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Security First</h3>
                    <p className="text-gray-400">
                      Your files are encrypted during transfer and automatically deleted after
                      processing. We never access or share your documents.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Lightning Fast</h3>
                    <p className="text-gray-400">
                      Our powerful servers process your files in seconds, not minutes. No waiting, no
                      frustration.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">Free to Start</h3>
                    <p className="text-gray-400">
                      All basic tools are completely free. No credit card required. Upgrade only if you
                      need advanced features.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="text-gray-300 leading-relaxed">
                We&apos;d love to hear from you! Whether you have questions, feedback, or partnership
                inquiries:
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-gray-300">
                  General inquiries:{" "}
                  <a href="mailto:hello@4updf.com" className="text-blue-400 hover:underline">
                    hello@4updf.com
                  </a>
                </p>
                <p className="text-gray-300">
                  Support:{" "}
                  <a href="mailto:support@4updf.com" className="text-blue-400 hover:underline">
                    support@4updf.com
                  </a>
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/contact"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
