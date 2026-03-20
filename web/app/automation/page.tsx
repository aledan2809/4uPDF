import { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FAQAccordion from "../components/FAQAccordion";
import FAQSchema from "../components/FAQSchema";

export const metadata: Metadata = {
  title: "Smart Automation & OCR Tools - 4uPDF",
  description:
    "AI-powered PDF automation tools. Auto-split invoices, detect document types, auto-rename by content, OCR text extraction, and more. No coding required.",
  openGraph: {
    title: "Smart Automation & OCR Tools - 4uPDF",
    description:
      "AI-powered PDF automation tools. Auto-split invoices, detect document types, auto-rename by content, OCR text extraction, and more.",
    type: "website",
    url: "https://4updf.com/automation",
  },
};

const automationTools = [
  {
    name: "Split by Text",
    href: "/tools/split-by-text",
    description: "Split PDF when specific text pattern appears",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: "pink",
    highlight: "OCR-powered text detection",
  },
  {
    name: "Split Invoices",
    href: "/tools/split-invoices",
    description: "Auto-split multi-invoice PDFs by invoice number",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
    color: "green",
    highlight: "Perfect for accounting",
  },
  {
    name: "Auto-Rename PDF",
    href: "/tools/auto-rename-pdf",
    description: "OCR extracts data to auto-rename your files",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    color: "yellow",
    highlight: "Smart file naming",
  },
  {
    name: "Document Detector",
    href: "/tools/document-detector",
    description: "Classify documents as invoice, contract, receipt, etc.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: "cyan",
    highlight: "AI classification",
  },
  {
    name: "OCR PDF",
    href: "/tools/ocr-pdf",
    description: "Add searchable text layer to scanned PDFs",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    color: "purple",
    highlight: "100+ languages",
  },
  {
    name: "Searchable PDF",
    href: "/tools/searchable-pdf",
    description: "Make scanned PDFs text-searchable",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: "blue",
    highlight: "Ctrl+F enabled",
  },
  {
    name: "Extract Text",
    href: "/tools/extract-text-from-pdf",
    description: "OCR extract and export text to TXT/JSON/CSV",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    color: "orange",
    highlight: "Multiple formats",
  },
];

const useCases = [
  {
    title: "Accounting & Finance",
    description: "Process hundreds of invoices automatically. Split multi-invoice PDFs, extract invoice numbers, dates, and amounts for your bookkeeping software.",
    tools: ["Split Invoices", "Auto-Rename PDF", "Extract Text"],
  },
  {
    title: "Legal & Contracts",
    description: "Classify and organize legal documents automatically. Detect contract types, extract key dates, and make scanned documents searchable.",
    tools: ["Document Detector", "OCR PDF", "Searchable PDF"],
  },
  {
    title: "Document Archival",
    description: "Digitize paper archives with OCR. Make old scanned documents searchable and automatically organize them by content.",
    tools: ["OCR PDF", "Auto-Rename PDF", "Searchable PDF"],
  },
  {
    title: "Data Entry Automation",
    description: "Extract text from any PDF for data entry. Export to CSV or JSON for direct import into databases or spreadsheets.",
    tools: ["Extract Text", "Split by Text", "Document Detector"],
  },
];

const faqs = [
  {
    question: "How does the OCR engine work?",
    answer:
      "We use RapidOCR, an advanced open-source OCR engine that supports 100+ languages. It analyzes page images and extracts text with high accuracy, even from scanned documents.",
  },
  {
    question: "What makes these tools 'smart'?",
    answer:
      "Unlike basic PDF tools, our smart tools use AI and pattern matching to understand document content. They can detect invoice numbers, dates, document types, and automatically split or rename files based on what they contain.",
  },
  {
    question: "Can I use these for batch processing?",
    answer:
      "Yes! All automation tools support batch processing with our premium plans. Process hundreds of documents at once with consistent results.",
  },
  {
    question: "What languages are supported for OCR?",
    answer:
      "Our OCR engine supports 100+ languages including English, Spanish, French, German, Chinese, Japanese, Arabic, Romanian, and many more. Language detection is automatic.",
  },
  {
    question: "How accurate is the document detection?",
    answer:
      "Our document detector uses keyword matching across multiple languages (English and Romanian). It provides confidence scores and shows matched keywords so you can verify the results.",
  },
  {
    question: "Are my documents secure?",
    answer:
      "Absolutely. All files are processed on secure servers, transmitted via SSL encryption, and automatically deleted after 1 hour. We never share or access your document contents.",
  },
];

const colorClasses: Record<string, string> = {
  pink: "bg-pink-600/20 text-pink-400 border-pink-600/50 hover:border-pink-500",
  green: "bg-green-600/20 text-green-400 border-green-600/50 hover:border-green-500",
  yellow: "bg-yellow-600/20 text-yellow-400 border-yellow-600/50 hover:border-yellow-500",
  cyan: "bg-cyan-600/20 text-cyan-400 border-cyan-600/50 hover:border-cyan-500",
  purple: "bg-purple-600/20 text-purple-400 border-purple-600/50 hover:border-purple-500",
  blue: "bg-blue-600/20 text-blue-400 border-blue-600/50 hover:border-blue-500",
  orange: "bg-orange-600/20 text-orange-400 border-orange-600/50 hover:border-orange-500",
};

export default function AutomationPage() {
  return (
    <>
      <FAQSchema faqs={faqs} />
      <Navbar />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600/20 text-pink-400 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI-Powered Automation
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Smart Automation Hub
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Transform your PDF workflow with AI-powered tools. Auto-split invoices, detect document types,
              rename files by content, and extract text with OCR.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/tools/split-invoices"
                className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Invoice Splitter
              </Link>
              <Link
                href="/tools/ocr-pdf"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Try OCR PDF
              </Link>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-16 bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Smart OCR Tools</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                7 powerful tools that use OCR and AI to automate your PDF workflow
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {automationTools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className={`group bg-gray-900 border rounded-xl p-6 transition-all ${colorClasses[tool.color]}`}
                >
                  <div className={`w-12 h-12 ${colorClasses[tool.color].split(' ')[0]} rounded-xl flex items-center justify-center mb-4`}>
                    {tool.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{tool.description}</p>
                  <span className={`inline-flex items-center text-xs px-2 py-1 rounded ${colorClasses[tool.color].split(' ')[0]}`}>
                    {tool.highlight}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Use Cases</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                See how businesses use our automation tools to save time and reduce manual work
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {useCases.map((useCase) => (
                <div
                  key={useCase.title}
                  className="bg-gray-950 border border-gray-800 rounded-xl p-6"
                >
                  <h3 className="text-xl font-semibold text-white mb-3">{useCase.title}</h3>
                  <p className="text-gray-400 mb-4">{useCase.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {useCase.tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-16 bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Why Choose 4uPDF Automation?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
                <p className="text-gray-400 text-sm">
                  Process documents in seconds, not minutes. Our optimized OCR engine handles large files efficiently.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Secure Processing</h3>
                <p className="text-gray-400 text-sm">
                  SSL encryption, automatic file deletion, and privacy-first design. Your documents stay yours.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">100+ Languages</h3>
                <p className="text-gray-400 text-sm">
                  Our OCR supports documents in English, Spanish, Chinese, Arabic, Romanian, and 100+ more languages.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            </div>
            <FAQAccordion faqs={faqs} />
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-r from-pink-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Automate?</h2>
            <p className="text-xl text-pink-100 mb-8">
              Start processing your documents with AI-powered tools today. No signup required.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/tools/split-invoices"
                className="px-8 py-4 bg-white text-pink-600 text-lg font-medium rounded-xl hover:bg-pink-50 transition-colors"
              >
                Split Invoices Now
              </Link>
              <Link
                href="/tools"
                className="px-8 py-4 bg-pink-700 text-white text-lg font-medium rounded-xl hover:bg-pink-800 transition-colors"
              >
                View All Tools
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
