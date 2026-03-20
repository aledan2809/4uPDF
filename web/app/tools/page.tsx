import { Metadata } from "next";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FAQAccordion from "../components/FAQAccordion";
import FAQSchema from "../components/FAQSchema";

export const metadata: Metadata = {
  title: "All PDF Tools - 4uPDF",
  description:
    "Browse all 45+ free online PDF tools. Merge, split, compress, convert, edit, OCR, and more. No registration required.",
  openGraph: {
    title: "All PDF Tools - 4uPDF",
    description:
      "Browse all 45+ free online PDF tools. Merge, split, compress, convert, edit, OCR, and more.",
    type: "website",
    url: "https://4updf.com/tools",
  },
};

const toolCategories = [
  {
    name: "Organize & Edit",
    description: "Rearrange, combine, and modify your PDF files",
    color: "from-blue-500 to-blue-600",
    tools: [
      { name: "Merge PDF", href: "/tools/merge-pdf", description: "Combine multiple PDFs into one" },
      { name: "Split PDF", href: "/tools/split-pdf", description: "Split PDF into multiple files" },
      { name: "Compress PDF", href: "/tools/compress-pdf", description: "Reduce PDF file size" },
      { name: "Rotate PDF", href: "/tools/rotate-pdf", description: "Rotate PDF pages" },
      { name: "Delete Pages", href: "/tools/delete-pages", description: "Remove pages from PDF" },
      { name: "Extract Pages", href: "/tools/extract-pages", description: "Extract specific pages" },
      { name: "Crop PDF", href: "/tools/crop-pdf", description: "Crop PDF page margins" },
      { name: "Organize PDF", href: "/tools/organize-pdf", description: "Reorder PDF pages" },
      { name: "Repair PDF", href: "/tools/repair-pdf", description: "Fix corrupted PDFs" },
    ],
  },
  {
    name: "Convert From PDF",
    description: "Transform PDFs into other formats",
    color: "from-purple-500 to-purple-600",
    tools: [
      { name: "PDF to Word", href: "/tools/pdf-to-word", description: "Convert PDF to DOCX" },
      { name: "PDF to Excel", href: "/tools/pdf-to-excel", description: "Extract tables to XLSX" },
      { name: "PDF to PowerPoint", href: "/tools/pdf-to-powerpoint", description: "Convert PDF to PPTX" },
      { name: "PDF to JPG", href: "/tools/pdf-to-jpg", description: "Convert PDF to JPG images" },
      { name: "PDF to PNG", href: "/tools/pdf-to-png", description: "Convert PDF to PNG images" },
      { name: "PDF to Text", href: "/tools/pdf-to-text", description: "Extract text from PDF" },
    ],
  },
  {
    name: "Convert To PDF",
    description: "Create PDFs from various file formats",
    color: "from-green-500 to-green-600",
    tools: [
      { name: "Word to PDF", href: "/tools/word-to-pdf", description: "Convert DOCX to PDF" },
      { name: "Excel to PDF", href: "/tools/excel-to-pdf", description: "Convert XLSX to PDF" },
      { name: "PowerPoint to PDF", href: "/tools/powerpoint-to-pdf", description: "Convert PPTX to PDF" },
      { name: "JPG to PDF", href: "/tools/jpg-to-pdf", description: "Convert JPG images to PDF" },
      { name: "PNG to PDF", href: "/tools/png-to-pdf", description: "Convert PNG images to PDF" },
      { name: "Text to PDF", href: "/tools/text-to-pdf", description: "Create PDF from text" },
      { name: "HTML to PDF", href: "/tools/html-to-pdf", description: "Convert HTML to PDF" },
    ],
  },
  {
    name: "Edit & Annotate",
    description: "Modify content and add annotations",
    color: "from-orange-500 to-orange-600",
    tools: [
      { name: "Edit PDF", href: "/tools/edit-pdf", description: "Edit text and images" },
      { name: "Sign PDF", href: "/tools/sign-pdf", description: "Add digital signatures" },
      { name: "Watermark PDF", href: "/tools/watermark-pdf", description: "Add text or image watermarks" },
      { name: "Add Page Numbers", href: "/tools/add-page-numbers", description: "Number your pages" },
      { name: "Annotate PDF", href: "/tools/annotate-pdf", description: "Add notes and highlights" },
      { name: "Redact PDF", href: "/tools/redact-pdf", description: "Black out sensitive info" },
    ],
  },
  {
    name: "Smart Tools",
    description: "AI-powered automation and OCR",
    color: "from-pink-500 to-pink-600",
    tools: [
      { name: "OCR PDF", href: "/tools/ocr-pdf", description: "Make scanned PDFs searchable" },
      { name: "Searchable PDF", href: "/tools/searchable-pdf", description: "Add text layer to scanned PDFs" },
      { name: "Split by Text", href: "/tools/split-by-text", description: "Split when text pattern appears" },
      { name: "Split Invoices", href: "/tools/split-invoices", description: "Split by invoice number" },
      { name: "Auto-Rename PDF", href: "/tools/auto-rename-pdf", description: "Rename files by content" },
      { name: "Document Detector", href: "/tools/document-detector", description: "Detect document types" },
      { name: "Extract Text", href: "/tools/extract-text-from-pdf", description: "OCR extract text to file" },
    ],
  },
  {
    name: "Security",
    description: "Protect and secure your documents",
    color: "from-red-500 to-red-600",
    tools: [
      { name: "Protect PDF", href: "/tools/protect-pdf", description: "Add password protection" },
      { name: "Unlock PDF", href: "/tools/unlock-pdf", description: "Remove PDF passwords" },
      { name: "Flatten PDF", href: "/tools/flatten-pdf", description: "Flatten form fields" },
    ],
  },
];

const faqs = [
  {
    question: "How many PDF tools do you offer?",
    answer:
      "We offer over 45 PDF tools across 6 categories: organizing, converting from PDF, converting to PDF, editing, smart automation, and security.",
  },
  {
    question: "Are all tools free to use?",
    answer:
      "Yes, all basic tools are completely free. Premium features like batch processing and larger file sizes are available with paid plans.",
  },
  {
    question: "Do I need to install any software?",
    answer:
      "No installation required. All tools work directly in your browser on any device - desktop, tablet, or mobile.",
  },
  {
    question: "How secure are my files?",
    answer:
      "All file transfers use SSL encryption. Files are processed on secure servers and automatically deleted after 1 hour.",
  },
];

export default function ToolsPage() {
  return (
    <>
      <FAQSchema faqs={faqs} />
      <Navbar />
      <main className="min-h-screen">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              All PDF Tools
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to work with PDFs. Choose from 45+ tools organized by category.
            </p>
          </div>
        </section>

        {/* Tool Categories */}
        <section className="py-16 bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {toolCategories.map((category) => (
              <div key={category.name} className="mb-16">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-1 h-8 bg-gradient-to-b ${category.color} rounded-full`} />
                  <div>
                    <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                    <p className="text-gray-400">{category.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      className="group bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 hover:bg-gray-800/50 transition-all"
                    >
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
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
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Choose any tool above and start working with your PDFs for free.
            </p>
            <Link
              href="/tools/merge-pdf"
              className="inline-block px-8 py-4 bg-white text-blue-600 text-lg font-medium rounded-xl hover:bg-blue-50 transition-colors"
            >
              Try Merge PDF
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
