import Link from "next/link";

const TOOLS = [
  {
    slug: "merge-pdf",
    title: "Merge PDF",
    description: "Combine multiple PDF files into a single document",
    color: "bg-blue-600",
    icon: "M",
  },
  {
    slug: "split-pdf",
    title: "Split PDF",
    description: "Split a PDF into individual pages or custom ranges",
    color: "bg-purple-600",
    icon: "S",
  },
  {
    slug: "compress-pdf",
    title: "Compress PDF",
    description: "Reduce PDF file size while keeping quality",
    color: "bg-green-600",
    icon: "C",
  },
  {
    slug: "pdf-to-word",
    title: "PDF to Word",
    description: "Convert PDF documents to editable DOCX files",
    color: "bg-orange-600",
    icon: "W",
  },
  {
    slug: "word-to-pdf",
    title: "Word to PDF",
    description: "Convert DOCX documents to PDF format",
    color: "bg-red-600",
    icon: "P",
  },
  {
    slug: "jpg-to-pdf",
    title: "JPG to PDF",
    description: "Convert images (JPG, PNG) to PDF documents",
    color: "bg-teal-600",
    icon: "I",
  },
  {
    slug: "pdf-to-jpg",
    title: "PDF to JPG",
    description: "Convert PDF pages to high-quality JPG images",
    color: "bg-yellow-600",
    icon: "J",
  },
  {
    slug: "rotate-pdf",
    title: "Rotate PDF",
    description: "Rotate all or specific pages by 90, 180, or 270 degrees",
    color: "bg-cyan-600",
    icon: "R",
  },
  {
    slug: "delete-pages",
    title: "Delete Pages",
    description: "Remove specific pages from a PDF document",
    color: "bg-rose-600",
    icon: "D",
  },
  {
    slug: "extract-pages",
    title: "Extract Pages",
    description: "Extract specific pages into a new PDF document",
    color: "bg-emerald-600",
    icon: "E",
  },
  {
    slug: "watermark-pdf",
    title: "Watermark PDF",
    description: "Add a text watermark to every page of a PDF",
    color: "bg-violet-600",
    icon: "W",
  },
  {
    slug: "protect-pdf",
    title: "Protect PDF",
    description: "Add password protection and set permissions",
    color: "bg-amber-600",
    icon: "L",
  },
  {
    slug: "unlock-pdf",
    title: "Unlock PDF",
    description: "Remove password protection from a PDF",
    color: "bg-lime-600",
    icon: "U",
  },
  {
    slug: "sign-pdf",
    title: "Sign PDF",
    description: "Add a digital signature to your PDF documents",
    color: "bg-amber-500",
    icon: "S",
  },
  {
    slug: "split-ocr",
    title: "OCR Split",
    description: "Split scanned PDFs by order number using OCR",
    color: "bg-indigo-600",
    icon: "O",
  },
  {
    slug: "split-barcode",
    title: "Barcode Split",
    description: "Split PDFs by barcode or QR code separator pages",
    color: "bg-sky-600",
    icon: "B",
  },
  {
    slug: "split-pattern",
    title: "Pattern Split",
    description: "Split PDFs when a specific text pattern is found",
    color: "bg-indigo-500",
    icon: "P",
  },
  {
    slug: "split-invoice",
    title: "Invoice Split",
    description: "Split PDFs by invoice/order numbers using OCR",
    color: "bg-orange-500",
    icon: "I",
  },
  {
    slug: "auto-rename",
    title: "Auto-Rename",
    description: "Automatically rename PDFs based on OCR text detection",
    color: "bg-sky-600",
    icon: "A",
  },
  {
    slug: "detect-type",
    title: "Detect Type",
    description: "Analyze PDF to detect text, images, or barcodes",
    color: "bg-pink-600",
    icon: "?",
  },
  {
    slug: "process-archive",
    title: "Process Archive",
    description: "Batch process a ZIP of PDFs: detect, rename, split, organize",
    color: "bg-fuchsia-600",
    icon: "Z",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">4uPDF</h1>
        <p className="text-gray-400 text-lg">
          Free online PDF tools. Simple, fast, no registration required.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOOLS.map((tool) => (
          <Link
            key={tool.slug}
            href={`/${tool.slug}`}
            className="group bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-all hover:shadow-lg hover:shadow-black/20"
          >
            <div
              className={`${tool.color} w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold mb-3 group-hover:scale-110 transition-transform`}
            >
              {tool.icon}
            </div>
            <h2 className="text-lg font-semibold mb-1">{tool.title}</h2>
            <p className="text-sm text-gray-400">{tool.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-16 text-center text-gray-600 text-sm">
        <p>All files are processed securely and automatically deleted after processing.</p>
        <p className="mt-1">Maximum file size: 50MB per file.</p>
      </div>
    </div>
  );
}
