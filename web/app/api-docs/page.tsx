import { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "PDF API — Developer Docs | 4uPDF",
  description:
    "4uPDF PDF API: call our high-DPI figure extraction, batch and OCR engine from your own apps over a simple HTTP API. Authenticate with X-API-Key.",
  alternates: { canonical: "https://4updf.com/api-docs" },
};

const BASE = "https://4updf.com";

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 overflow-x-auto text-sm text-gray-200 leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

export default function ApiDocsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold text-white mb-4">PDF API</h1>
          <p className="text-gray-300 text-lg mb-10">
            Call 4uPDF&apos;s PDF engine from your own apps. The first endpoints expose the high-DPI
            figure-extraction family — render any region of a PDF page to a crisp PNG, batch it across
            pages, or OCR the region — over a simple HTTP API. More tools will follow.
          </p>

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Getting a key</h2>
              <p className="text-gray-300 leading-relaxed">
                The API is available on the <span className="text-yellow-400 font-medium">Gold</span> plan. Once
                you&apos;re on Gold, open your{" "}
                <Link href="/dashboard" className="text-blue-400 underline hover:text-blue-300">Dashboard</Link>{" "}
                → <span className="text-gray-200">API Keys</span>, create a key, and copy it (it is shown only
                once). See <Link href="/pricing" className="text-blue-400 underline hover:text-blue-300">Pricing</Link>{" "}
                to upgrade.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Authentication</h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                Send your key in the <code className="px-1 py-0.5 bg-gray-800 rounded text-gray-200">X-API-Key</code>{" "}
                header on every request. Requests without a valid key get <code className="px-1 py-0.5 bg-gray-800 rounded text-gray-200">401</code>;
                a plan without API access gets <code className="px-1 py-0.5 bg-gray-800 rounded text-gray-200">403</code>.
              </p>
              <Code>{`X-API-Key: pdf_live_<your_api_key>`}</Code>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Selection coordinates</h2>
              <p className="text-gray-300 leading-relaxed">
                The region is given as page fractions with a top-left origin: <code className="px-1 py-0.5 bg-gray-800 rounded text-gray-200">fx0,fy0</code>{" "}
                is the top-left corner and <code className="px-1 py-0.5 bg-gray-800 rounded text-gray-200">fx1,fy1</code>{" "}
                the bottom-right, each between 0 and 1. So the left half of a page is{" "}
                <code className="px-1 py-0.5 bg-gray-800 rounded text-gray-200">fx0=0, fy0=0, fx1=0.5, fy1=1</code>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Endpoints</h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/extract-region
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Render one page region to a high-DPI PNG. Returns <code className="px-1 bg-gray-800 rounded">image/png</code>.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/extract-region \\
  -H "X-API-Key: $KEY" \\
  -F "file=@report.pdf" \\
  -F "page=1" \\
  -F "fx0=0.1" -F "fy0=0.3" -F "fx1=0.7" -F "fy1=0.4" \\
  -F "dpi=600" \\
  -o figure.png`}</Code>
                  <p className="text-gray-500 text-xs mt-2">Fields: <code>file</code> (PDF), <code>page</code> (1-based), <code>fx0/fy0/fx1/fy1</code>, <code>dpi</code> (72–1200, default 300).</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/extract-region-batch
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Apply the same region across a page range. Returns a <code className="px-1 bg-gray-800 rounded">application/zip</code> of PNGs.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/extract-region-batch \\
  -H "X-API-Key: $KEY" \\
  -F "file=@report.pdf" \\
  -F "fx0=0.1" -F "fy0=0.3" -F "fx1=0.7" -F "fy1=0.4" \\
  -F "dpi=300" \\
  -F "page_from=1" -F "page_to=0" \\
  -o figures.zip`}</Code>
                  <p className="text-gray-500 text-xs mt-2"><code>page_to=0</code> means &quot;through the last page&quot;. Up to 200 pages per request.</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/extract-region-ocr
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">OCR the selected region. Returns JSON <code className="px-1 bg-gray-800 rounded">{`{ text, lines }`}</code>.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/extract-region-ocr \\
  -H "X-API-Key: $KEY" \\
  -F "file=@report.pdf" \\
  -F "page=1" \\
  -F "fx0=0.1" -F "fy0=0.3" -F "fx1=0.7" -F "fy1=0.4"

# => { "text": "Figure 1: ...", "lines": ["Figure 1: ...", ...] }`}</Code>
                  <p className="text-gray-500 text-xs mt-2">OCR DPI is clamped to 150–600 (accuracy plateaus above that).</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-3">Limits &amp; errors</h2>
              <ul className="text-gray-300 leading-relaxed list-disc pl-6 space-y-1">
                <li>Monthly call quota is included with your plan (Gold: 10,000 calls/month). When it&apos;s reached you get <code className="px-1 bg-gray-800 rounded">429</code> until the next month — there is no overage billing.</li>
                <li>Max file size follows your plan&apos;s limit; oversize uploads return <code className="px-1 bg-gray-800 rounded">413</code>.</li>
                <li>A degenerate selection, an out-of-range page, or a region too large at the chosen DPI returns <code className="px-1 bg-gray-800 rounded">400</code>.</li>
                <li>Password-protected PDFs are not supported (<code className="px-1 bg-gray-800 rounded">400</code>) — remove the password first.</li>
              </ul>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-2">Ready to build?</h2>
              <p className="text-gray-400 mb-4">Upgrade to Gold, create a key, and make your first call in minutes.</p>
              <div className="flex gap-3">
                <Link href="/pricing" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">View pricing</Link>
                <Link href="/dashboard" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg transition-colors">Go to dashboard</Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
