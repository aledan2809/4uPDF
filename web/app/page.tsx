import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FAQAccordion from "./components/FAQAccordion";
import FAQSchema from "./components/FAQSchema";

const popularTools = [
  {
    name: "Merge PDF",
    description: "Combine multiple PDFs into one document",
    href: "/tools/merge-pdf",
    icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "Split PDF",
    description: "Extract pages or split PDF into multiple files",
    href: "/tools/split-pdf",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14",
    color: "from-purple-500 to-purple-600",
  },
  {
    name: "Compress PDF",
    description: "Reduce PDF file size without losing quality",
    href: "/tools/compress-pdf",
    icon: "M19 14l-7 7m0 0l-7-7m7 7V3",
    color: "from-green-500 to-green-600",
  },
  {
    name: "PDF to Word",
    description: "Convert PDF to editable Word documents",
    href: "/tools/pdf-to-word",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "from-orange-500 to-orange-600",
  },
  {
    name: "PDF to Excel",
    description: "Extract tables from PDF to Excel spreadsheets",
    href: "/tools/pdf-to-excel",
    icon: "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    name: "PDF to PNG",
    description: "Convert PDF pages to PNG images",
    href: "/tools/pdf-to-png",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    color: "from-cyan-500 to-cyan-600",
  },
];

const allTools = [
  // Organize
  { name: "Merge PDF", href: "/tools/merge-pdf", category: "organize" },
  { name: "Split PDF", href: "/tools/split-pdf", category: "organize" },
  { name: "Compress PDF", href: "/tools/compress-pdf", category: "organize" },
  { name: "Rotate PDF", href: "/tools/rotate-pdf", category: "organize" },
  { name: "Delete Pages", href: "/tools/delete-pages", category: "organize" },
  { name: "Extract Pages", href: "/tools/extract-pages", category: "organize" },
  { name: "Organize PDF", href: "/tools/organize-pdf", category: "organize" },
  // Convert from PDF
  { name: "PDF to Word", href: "/tools/pdf-to-word", category: "convert" },
  { name: "PDF to Excel", href: "/tools/pdf-to-excel", category: "convert" },
  { name: "PDF to PowerPoint", href: "/tools/pdf-to-powerpoint", category: "convert" },
  { name: "PDF to JPG", href: "/tools/pdf-to-jpg", category: "convert" },
  { name: "PDF to PNG", href: "/tools/pdf-to-png", category: "convert" },
  { name: "PDF to Text", href: "/tools/pdf-to-text", category: "convert" },
  // Convert to PDF
  { name: "Word to PDF", href: "/tools/word-to-pdf", category: "convert" },
  { name: "Excel to PDF", href: "/tools/excel-to-pdf", category: "convert" },
  { name: "PowerPoint to PDF", href: "/tools/powerpoint-to-pdf", category: "convert" },
  { name: "JPG to PDF", href: "/tools/jpg-to-pdf", category: "convert" },
  { name: "PNG to PDF", href: "/tools/png-to-pdf", category: "convert" },
  { name: "Text to PDF", href: "/tools/text-to-pdf", category: "convert" },
  { name: "HTML to PDF", href: "/tools/html-to-pdf", category: "convert" },
  // Edit
  { name: "Edit PDF", href: "/tools/edit-pdf", category: "edit" },
  { name: "Sign PDF", href: "/tools/sign-pdf", category: "edit" },
  { name: "Add Watermark", href: "/tools/add-watermark", category: "edit" },
  { name: "Add Page Numbers", href: "/tools/add-page-numbers", category: "edit" },
  { name: "Annotate PDF", href: "/tools/annotate-pdf", category: "edit" },
  { name: "Redact PDF", href: "/tools/redact-pdf", category: "edit" },
  // Smart
  { name: "OCR PDF", href: "/tools/ocr-pdf", category: "smart" },
  { name: "Searchable PDF", href: "/tools/searchable-pdf", category: "smart" },
  { name: "Split by Text", href: "/tools/split-by-text", category: "smart" },
  { name: "Split Invoices", href: "/tools/split-invoices", category: "smart" },
  { name: "Auto-Rename PDF", href: "/tools/auto-rename-pdf", category: "smart" },
  { name: "Document Detector", href: "/tools/document-detector", category: "smart" },
  { name: "Extract Text", href: "/tools/extract-text-from-pdf", category: "smart" },
  // Security
  { name: "Protect PDF", href: "/tools/protect-pdf", category: "security" },
  { name: "Unlock PDF", href: "/tools/unlock-pdf", category: "security" },
  { name: "Flatten PDF", href: "/tools/flatten-pdf", category: "security" },
];

const features = [
  {
    title: "100% Free",
    description: "All basic tools are completely free to use. No hidden costs.",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "No Registration",
    description: "Start using tools immediately. No account required.",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    title: "Secure & Private",
    description: "Files are processed securely and deleted after 1 hour.",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    title: "Fast Processing",
    description: "Powerful servers ensure quick file processing.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
];

const homeFaqs = [
  {
    question: "Is 4uPDF really free?",
    answer:
      "Yes! All basic PDF tools are completely free to use. We offer premium plans for advanced features like batch processing, larger file sizes, and smart automation tools.",
  },
  {
    question: "Are my files secure?",
    answer:
      "Absolutely. All file transfers are encrypted using SSL/TLS. Your files are processed on our secure servers and automatically deleted after 1 hour. We never share or sell your data.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No account is required to use our basic tools. Simply upload your file and start working. Creating a free account unlocks additional features like file history and preferences.",
  },
  {
    question: "What file size limit do you support?",
    answer:
      "Free users can process files up to 50MB. Premium plans support files up to 500MB or more, depending on your subscription level.",
  },
  {
    question: "Can I use 4uPDF on mobile devices?",
    answer:
      "Yes! Our tools are fully responsive and work on any device - desktop, tablet, or smartphone. No app installation required.",
  },
];

export default function HomePage() {
  return (
    <>
      <FAQSchema faqs={homeFaqs} />
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Free Online PDF Tools
                <span className="block text-blue-400">Fast, Secure, No Registration</span>
              </h1>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                Transform your PDFs with our powerful suite of 40+ tools. Merge, split, compress,
                convert, edit, and more - all in your browser.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="#tools"
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-xl transition-colors"
                >
                  Explore All Tools
                </Link>
                <Link
                  href="/tools/merge-pdf"
                  className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white text-lg font-medium rounded-xl transition-colors border border-gray-700"
                >
                  Try Merge PDF
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Tools */}
        <section className="py-20 bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Most Popular Tools</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Start with our most-used PDF tools. Quick, easy, and free.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularTools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="group bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-blue-500/5"
                >
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${tool.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={tool.icon}
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{tool.name}</h3>
                  <p className="text-gray-400 text-sm">{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Why Choose 4uPDF?</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                We make PDF editing simple, fast, and accessible to everyone.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={feature.icon}
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All Tools Grid */}
        <section id="tools" className="py-20 bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">All PDF Tools</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Everything you need to work with PDFs, all in one place.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {allTools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-center hover:border-blue-500 hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm text-gray-300 hover:text-white">{tool.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Three simple steps to transform your PDFs.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                  1
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Upload Your File</h3>
                <p className="text-gray-400 text-sm">
                  Drag and drop or click to upload your PDF files. We support files up to 50MB.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                  2
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Choose Your Action</h3>
                <p className="text-gray-400 text-sm">
                  Select the tool you need and customize settings to get the perfect result.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                  3
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Download Result</h3>
                <p className="text-gray-400 text-sm">
                  Your processed file is ready instantly. Download it with a single click.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-950">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-400">Got questions? We have answers.</p>
            </div>
            <FAQAccordion faqs={homeFaqs} />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your PDFs?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of users who trust 4uPDF for their daily PDF needs.
            </p>
            <Link
              href="#tools"
              className="inline-block px-8 py-4 bg-white text-blue-600 text-lg font-medium rounded-xl hover:bg-blue-50 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
