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
            Call 4uPDF&apos;s PDF engine from your own apps over a simple HTTP API: high-DPI figure
            extraction (region → PNG, batch, OCR), core operations (merge, split, compress, PDF-to-JPG),
            Office conversions (PDF ↔ Word/Excel/PowerPoint) and an OCR searchable-text layer.
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
                  <p className="text-gray-500 text-xs mt-2">Fields: <code>file</code> (PDF), <code>page</code> (1-based), <code>fx0/fy0/fx1/fy1</code>, <code>dpi</code> (72–1200, default 300), <code>fmt</code> (<code>png</code>|<code>tiff</code>, default png), <code>transparent</code> (bool), <code>trim</code> (bool, auto-trim a uniform border).</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/extract-region-svg
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Export a page region as a scalable vector <code className="px-1 bg-gray-800 rounded">image/svg+xml</code> — text and vector art stay crisp at any size.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/extract-region-svg \\
  -H "X-API-Key: $KEY" \\
  -F "file=@report.pdf" \\
  -F "page=1" \\
  -F "fx0=0.1" -F "fy0=0.3" -F "fx1=0.7" -F "fy1=0.4" \\
  -o figure.svg`}</Code>
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
                  <p className="text-gray-500 text-xs mt-2"><code>page_to=0</code> means &quot;through the last page&quot;. Up to 200 pages per request. Also accepts <code>fmt</code> (png|tiff), <code>transparent</code>, <code>trim</code>.</p>
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

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/merge
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Merge 2+ PDFs into one. Returns <code className="px-1 bg-gray-800 rounded">application/pdf</code>.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/merge \\
  -H "X-API-Key: $KEY" \\
  -F "files=@a.pdf" -F "files=@b.pdf" \\
  -o merged.pdf`}</Code>
                  <p className="text-gray-500 text-xs mt-2">Up to 50 files; combined size follows your plan&apos;s limit.</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/split
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Split a PDF by page ranges. Returns a <code className="px-1 bg-gray-800 rounded">application/zip</code> of PDFs.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/split \\
  -H "X-API-Key: $KEY" \\
  -F "file=@doc.pdf" \\
  -F "ranges=1-3,4,5-7" \\
  -o split.zip`}</Code>
                  <p className="text-gray-500 text-xs mt-2"><code>ranges=all</code> (default) splits into single pages. Each comma part becomes one output PDF.</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/compress
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Compress a PDF. Returns <code className="px-1 bg-gray-800 rounded">application/pdf</code>.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/compress \\
  -H "X-API-Key: $KEY" \\
  -F "file=@doc.pdf" \\
  -F "quality=medium" \\
  -o compressed.pdf`}</Code>
                  <p className="text-gray-500 text-xs mt-2"><code>quality</code> = <code>low</code> | <code>medium</code> | <code>high</code> (default medium).</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/pdf-to-jpg
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Render PDF pages to JPGs. Returns a <code className="px-1 bg-gray-800 rounded">application/zip</code> of images.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/pdf-to-jpg \\
  -H "X-API-Key: $KEY" \\
  -F "file=@doc.pdf" \\
  -F "dpi=150" -F "pages=all" \\
  -o images.zip`}</Code>
                  <p className="text-gray-500 text-xs mt-2"><code>dpi</code> 36–300 (default 150), <code>pages</code> = <code>all</code> or e.g. <code>1,3,5-7</code>.</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/pdf-to-word
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Extract a PDF&apos;s text into an editable Word DOCX. Returns a <code className="px-1 bg-gray-800 rounded">.docx</code>.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/pdf-to-word \\
  -H "X-API-Key: $KEY" \\
  -F "file=@doc.pdf" \\
  -o converted.docx`}</Code>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/word-to-pdf
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Convert a Word DOCX to PDF. Returns <code className="px-1 bg-gray-800 rounded">application/pdf</code>.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/word-to-pdf \\
  -H "X-API-Key: $KEY" \\
  -F "file=@doc.docx" \\
  -o converted.pdf`}</Code>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/pdf-to-excel
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Extract PDF tables/text into an Excel XLSX. Returns a <code className="px-1 bg-gray-800 rounded">.xlsx</code>.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/pdf-to-excel \\
  -H "X-API-Key: $KEY" \\
  -F "file=@statement.pdf" \\
  -o converted.xlsx`}</Code>
                  <p className="text-gray-500 text-xs mt-2">Detected tables are preserved; otherwise text is laid out by whitespace columns.</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/excel-to-pdf
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Convert an Excel XLSX to PDF. Returns <code className="px-1 bg-gray-800 rounded">application/pdf</code>.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/excel-to-pdf \\
  -H "X-API-Key: $KEY" \\
  -F "file=@sheet.xlsx" \\
  -o converted.pdf`}</Code>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/pdf-to-powerpoint
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Render each PDF page as a slide in a PowerPoint PPTX. Returns a <code className="px-1 bg-gray-800 rounded">.pptx</code>.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/pdf-to-powerpoint \\
  -H "X-API-Key: $KEY" \\
  -F "file=@deck.pdf" \\
  -o converted.pptx`}</Code>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/powerpoint-to-pdf
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Convert a PowerPoint PPTX to PDF. Returns <code className="px-1 bg-gray-800 rounded">application/pdf</code>.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/powerpoint-to-pdf \\
  -H "X-API-Key: $KEY" \\
  -F "file=@deck.pptx" \\
  -o converted.pdf`}</Code>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    <span className="text-green-400">POST</span> /api/v1/ocr-pdf
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">Add a searchable OCR text layer to a scanned PDF (text becomes selectable/searchable). Returns <code className="px-1 bg-gray-800 rounded">application/pdf</code>.</p>
                  <Code>{`curl -X POST ${BASE}/api/v1/ocr-pdf \\
  -H "X-API-Key: $KEY" \\
  -F "file=@scan.pdf" \\
  -F "dpi=300" \\
  -o searchable.pdf`}</Code>
                  <p className="text-gray-500 text-xs mt-2"><code>dpi</code> 150–400 (default 300). Up to 100 pages per request.</p>
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
                <li>Office conversions are limited to 200 pages per request, and OCR to 100 pages (<code className="px-1 bg-gray-800 rounded">400</code> over the cap) — split large files first.</li>
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
