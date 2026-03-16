import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About & Contact - 4uPDF Free Online PDF Tools",
  description: "Learn about 4uPDF, our free online PDF tools platform. Contact us for support, feature requests, or business inquiries.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
        &larr; Back to home
      </Link>

      <h1 className="text-4xl font-bold mb-6">About 4uPDF</h1>

      <div className="prose prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is 4uPDF?</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            4uPDF is a free online platform offering a comprehensive suite of PDF tools.
            We provide simple, fast, and secure PDF processing directly in your browser without
            requiring installation or registration.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Our mission is to make PDF manipulation accessible to everyone, from basic operations
            like merging and splitting to advanced features like OCR-based invoice splitting and
            document type detection.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Tools</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Core Tools (Phase 1)</h3>
              <ul className="text-gray-400 space-y-1 text-sm">
                <li>• Merge, Split, Compress PDF</li>
                <li>• PDF to Word / Word to PDF</li>
                <li>• JPG to PDF / PDF to JPG</li>
              </ul>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-green-400">Editing Tools (Phase 2)</h3>
              <ul className="text-gray-400 space-y-1 text-sm">
                <li>• Rotate, Delete, Extract pages</li>
                <li>• Sign, Watermark, Protect PDF</li>
                <li>• Unlock password-protected PDFs</li>
              </ul>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-purple-400">Smart Tools (Phase 3)</h3>
              <ul className="text-gray-400 space-y-1 text-sm">
                <li>• Split by text pattern or invoice number</li>
                <li>• Split by barcode / QR code</li>
                <li>• Auto-rename PDFs using OCR</li>
                <li>• Document type detection</li>
              </ul>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
              <h3 className="text-lg font-semibold mb-2 text-orange-400">Automation (Phase 4)</h3>
              <ul className="text-gray-400 space-y-1 text-sm">
                <li>• Archive processor (bulk operations)</li>
                <li>• Document classification pipelines</li>
                <li>• Batch processing workflows</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Privacy & Security</h2>
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-5">
            <ul className="text-gray-300 space-y-2">
              <li>✓ <strong>Secure Processing:</strong> All files are processed server-side with encryption</li>
              <li>✓ <strong>No Storage:</strong> Files are automatically deleted after processing</li>
              <li>✓ <strong>No Registration:</strong> Use all tools without creating an account</li>
              <li>✓ <strong>No Tracking:</strong> We don't track your documents or personal data</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Technology</h2>
          <p className="text-gray-400 leading-relaxed mb-4">
            4uPDF is built with modern web technologies:
          </p>
          <ul className="text-gray-400 space-y-1 list-disc list-inside">
            <li><strong>Backend:</strong> Python FastAPI for high-performance PDF processing</li>
            <li><strong>Frontend:</strong> Next.js 13+ with React and TailwindCSS</li>
            <li><strong>PDF Engine:</strong> PyMuPDF (fitz) for reliable PDF manipulation</li>
            <li><strong>OCR:</strong> RapidOCR for text recognition in scanned documents</li>
            <li><strong>Hosting:</strong> VPS infrastructure for fast and reliable service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 mb-4">
              Have questions, feature requests, or need support? Get in touch with us:
            </p>
            <div className="space-y-3 text-gray-300">
              <div>
                <strong className="text-white">Email:</strong> <a href="mailto:support@4updf.com" className="text-blue-400 hover:text-blue-300">support@4updf.com</a>
              </div>
              <div>
                <strong className="text-white">Website:</strong> <a href="https://4updf.com" className="text-blue-400 hover:text-blue-300">https://4updf.com</a>
              </div>
              <div className="pt-3 border-t border-gray-800">
                <p className="text-sm text-gray-500">
                  For business inquiries, partnerships, or bulk processing needs, please contact us via email.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">Is 4uPDF really free?</h3>
              <p className="text-gray-400 text-sm">
                Yes, all our tools are completely free to use with no hidden fees or subscription requirements.
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">What is the file size limit?</h3>
              <p className="text-gray-400 text-sm">
                Most tools support files up to 50MB. Some OCR-based tools support up to 100MB for better processing.
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">Are my files safe?</h3>
              <p className="text-gray-400 text-sm">
                Yes. Files are processed securely and automatically deleted from our servers immediately after processing.
                We don't store, access, or share your documents.
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">Can I use these tools for commercial purposes?</h3>
              <p className="text-gray-400 text-sm">
                Yes, you can use 4uPDF tools for both personal and commercial projects. For high-volume processing needs,
                please contact us for enterprise solutions.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
