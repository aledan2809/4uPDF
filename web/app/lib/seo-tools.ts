import type { Metadata } from "next";

const BASE_URL = "https://4updf.com";

export interface ToolSEO {
  slug: string;
  title: string;
  h1: string;
  description: string;
  keywords: string;
  jsonLd: Record<string, unknown>;
}

const tools: Record<string, ToolSEO> = {
  "merge-pdf": {
    slug: "merge-pdf",
    title: "Merge PDF Online Free - Combine PDF Files | 4uPDF",
    h1: "Merge PDF Files Online",
    description: "Merge multiple PDF files into one document online for free. No registration, no watermarks. Combine PDFs instantly in your browser with 4uPDF.",
    keywords: "merge PDF, combine PDF, join PDF files, PDF merger online, free PDF merge tool",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Merge PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Merge multiple PDF files into one document online for free." },
  },
  "split-pdf": {
    slug: "split-pdf",
    title: "Split PDF Online Free - Extract Pages from PDF | 4uPDF",
    h1: "Split PDF Files Online",
    description: "Split PDF files into individual pages or custom page ranges online for free. No registration required. Fast and secure PDF splitting with 4uPDF.",
    keywords: "split PDF, separate PDF pages, extract PDF pages, PDF splitter online, free PDF split tool",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Split PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Split PDF files into individual pages or custom ranges online for free." },
  },
  "compress-pdf": {
    slug: "compress-pdf",
    title: "Compress PDF Online Free - Reduce PDF File Size | 4uPDF",
    h1: "Compress PDF Files Online",
    description: "Compress PDF files to reduce file size without losing quality. Free online PDF compressor with low, medium, and high compression options. No registration.",
    keywords: "compress PDF, reduce PDF size, PDF compressor online, shrink PDF, free PDF compression",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Compress PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Compress PDF files to reduce file size without losing quality." },
  },
  "pdf-to-word": {
    slug: "pdf-to-word",
    title: "PDF to Word Converter Online Free - PDF to DOCX | 4uPDF",
    h1: "Convert PDF to Word Online",
    description: "Convert PDF documents to editable Word (DOCX) files online for free. Accurate conversion preserving layout and formatting. No registration required.",
    keywords: "PDF to Word, PDF to DOCX, convert PDF to Word online, free PDF to Word converter",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF PDF to Word", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Convert PDF documents to editable Word files online for free." },
  },
  "word-to-pdf": {
    slug: "word-to-pdf",
    title: "Word to PDF Converter Online Free - DOCX to PDF | 4uPDF",
    h1: "Convert Word to PDF Online",
    description: "Convert Word (DOCX) documents to PDF format online for free. Preserve formatting and layout perfectly. No registration or installation required.",
    keywords: "Word to PDF, DOCX to PDF, convert Word to PDF online, free Word to PDF converter",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Word to PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Convert Word documents to PDF format online for free." },
  },
  "jpg-to-pdf": {
    slug: "jpg-to-pdf",
    title: "JPG to PDF Converter Online Free - Image to PDF | 4uPDF",
    h1: "Convert JPG Images to PDF",
    description: "Convert JPG, PNG, and other images to PDF documents online for free. Combine multiple images into a single PDF. No registration required.",
    keywords: "JPG to PDF, image to PDF, PNG to PDF, convert image to PDF online, free image to PDF",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF JPG to PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Convert JPG and PNG images to PDF documents online for free." },
  },
  "pdf-to-jpg": {
    slug: "pdf-to-jpg",
    title: "PDF to JPG Converter Online Free - PDF to Image | 4uPDF",
    h1: "Convert PDF to JPG Images",
    description: "Convert PDF pages to high-quality JPG images online for free. Extract all pages as images. No registration or installation needed.",
    keywords: "PDF to JPG, PDF to image, convert PDF to JPG online, extract images from PDF, free PDF to JPG",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF PDF to JPG", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Convert PDF pages to high-quality JPG images online for free." },
  },
  "rotate-pdf": {
    slug: "rotate-pdf",
    title: "Rotate PDF Online Free - Rotate PDF Pages | 4uPDF",
    h1: "Rotate PDF Pages Online",
    description: "Rotate PDF pages by 90, 180, or 270 degrees online for free. Rotate all pages or specific pages. No registration or software needed.",
    keywords: "rotate PDF, rotate PDF pages, PDF rotation online, turn PDF pages, free PDF rotator",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Rotate PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Rotate PDF pages by any angle online for free." },
  },
  "delete-pages": {
    slug: "delete-pages",
    title: "Delete PDF Pages Online Free - Remove Pages from PDF | 4uPDF",
    h1: "Delete Pages from PDF Online",
    description: "Remove unwanted pages from PDF documents online for free. Select and delete specific pages easily. No registration or software required.",
    keywords: "delete PDF pages, remove pages from PDF, PDF page remover online, free PDF page delete",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Delete Pages", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Remove unwanted pages from PDF documents online for free." },
  },
  "extract-pages": {
    slug: "extract-pages",
    title: "Extract PDF Pages Online Free - Extract Pages from PDF | 4uPDF",
    h1: "Extract Pages from PDF Online",
    description: "Extract specific pages from a PDF into a new document online for free. Select page numbers or ranges. No registration required.",
    keywords: "extract PDF pages, extract pages from PDF, PDF page extractor online, free PDF page extraction",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Extract Pages", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Extract specific pages from a PDF document online for free." },
  },
  "watermark-pdf": {
    slug: "watermark-pdf",
    title: "Add Watermark to PDF Online Free | 4uPDF",
    h1: "Add Watermark to PDF Online",
    description: "Add text watermarks to PDF documents online for free. Customize text, opacity, rotation, and position. No registration needed.",
    keywords: "watermark PDF, add watermark to PDF, PDF watermark online, free PDF watermark tool",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Watermark PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Add text watermarks to PDF documents online for free." },
  },
  "protect-pdf": {
    slug: "protect-pdf",
    title: "Protect PDF with Password Online Free | 4uPDF",
    h1: "Protect PDF with Password",
    description: "Add password protection to PDF documents online for free. Encrypt and secure your PDFs with strong encryption. No registration.",
    keywords: "protect PDF, password protect PDF, encrypt PDF, PDF password online, free PDF encryption",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Protect PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Add password protection to PDF documents online for free." },
  },
  "unlock-pdf": {
    slug: "unlock-pdf",
    title: "Unlock PDF Online Free - Remove PDF Password | 4uPDF",
    h1: "Unlock PDF - Remove Password",
    description: "Remove password protection from PDF files online for free. Unlock encrypted PDFs instantly. You must know the password. No registration.",
    keywords: "unlock PDF, remove PDF password, PDF unlocker online, decrypt PDF, free PDF unlock tool",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Unlock PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Remove password protection from PDF files online for free." },
  },
  "sign-pdf": {
    slug: "sign-pdf",
    title: "Sign PDF Online Free - Add Digital Signature | 4uPDF",
    h1: "Sign PDF Documents Online",
    description: "Add digital signatures to PDF documents online for free. Draw, type, or upload your signature. Secure and easy PDF signing. No registration.",
    keywords: "sign PDF, digital signature PDF, PDF signer online, add signature to PDF, free PDF signing",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Sign PDF", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Add digital signatures to PDF documents online for free." },
  },
  "split-ocr": {
    slug: "split-ocr",
    title: "OCR PDF Split - Split Scanned PDFs by Text | 4uPDF",
    h1: "OCR Split - Split Scanned PDFs",
    description: "Split scanned PDF documents by detected text using OCR. Automatically separate pages by order numbers, invoice IDs, or custom patterns.",
    keywords: "OCR split PDF, split scanned PDF, PDF OCR splitter, split PDF by text, document automation",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF OCR Split", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Split scanned PDF documents by detected text using OCR." },
  },
  "split-barcode": {
    slug: "split-barcode",
    title: "Split PDF by Barcode/QR Code Online | 4uPDF",
    h1: "Split PDF by Barcode or QR Code",
    description: "Split PDF documents at barcode or QR code separator pages. Automatically detect and split by barcodes. Perfect for batch document processing.",
    keywords: "split PDF by barcode, QR code PDF splitter, barcode separator PDF, document automation barcode",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Barcode Split", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Split PDF documents at barcode or QR code separator pages." },
  },
  "split-pattern": {
    slug: "split-pattern",
    title: "Split PDF by Text Pattern Online | 4uPDF",
    h1: "Split PDF by Text Pattern",
    description: "Split PDF documents when a specific text pattern is found on a page. Useful for separating reports, statements, and batched documents.",
    keywords: "split PDF by text, text pattern PDF splitter, split PDF by content, document separator",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Pattern Split", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Split PDF documents by text pattern detection." },
  },
  "split-invoice": {
    slug: "split-invoice",
    title: "Split PDF by Invoice Number Online | 4uPDF",
    h1: "Split PDF by Invoice Number",
    description: "Automatically split multi-invoice PDFs into separate files by invoice or order number using OCR detection. Perfect for accounting workflows.",
    keywords: "split invoices PDF, invoice splitter, split PDF by invoice number, accounting PDF tool",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Invoice Split", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Split multi-invoice PDFs by invoice number using OCR." },
  },
  "auto-rename": {
    slug: "auto-rename",
    title: "Auto-Rename PDF Files by Content | 4uPDF",
    h1: "Auto-Rename PDFs by Content",
    description: "Automatically rename PDF files based on detected text content using OCR. Extract dates, invoice numbers, or custom fields for file naming.",
    keywords: "auto rename PDF, rename PDF by content, OCR file renaming, PDF auto naming tool",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Auto-Rename", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Automatically rename PDF files based on detected text content." },
  },
  "detect-type": {
    slug: "detect-type",
    title: "Detect PDF Document Type Online | 4uPDF",
    h1: "Detect PDF Document Type",
    description: "Analyze PDF documents to detect their type - invoice, contract, delivery note, or other. Uses OCR and AI classification for accurate results.",
    keywords: "detect PDF type, PDF document classifier, document type detection, PDF analyzer",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Detect Type", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Detect PDF document type using AI classification." },
  },
  "process-archive": {
    slug: "process-archive",
    title: "Process PDF Archive - Batch PDF Processing | 4uPDF",
    h1: "Process PDF Archive",
    description: "Batch process ZIP archives of PDFs: automatically detect, classify, split, and rename documents. Ideal for digitizing large document collections.",
    keywords: "batch PDF processing, PDF archive processor, bulk PDF tool, document automation, PDF batch rename",
    jsonLd: { "@type": "SoftwareApplication", name: "4uPDF Archive Processor", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Batch process ZIP archives of PDFs with automatic classification." },
  },
};

export function getToolSEO(slug: string): ToolSEO | undefined {
  return tools[slug];
}

export function getToolMetadata(slug: string): Metadata {
  const tool = tools[slug];
  if (!tool) return {};
  return {
    title: tool.title,
    description: tool.description,
    keywords: tool.keywords,
    alternates: { canonical: `${BASE_URL}/${slug}` },
    openGraph: {
      title: tool.title,
      description: tool.description,
      url: `${BASE_URL}/${slug}`,
      siteName: "4uPDF",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tool.title,
      description: tool.description,
    },
  };
}

export function getToolJsonLd(slug: string): string {
  const tool = tools[slug];
  if (!tool) return "";
  const ld = {
    "@context": "https://schema.org",
    ...tool.jsonLd,
    url: `${BASE_URL}/${slug}`,
  };
  return JSON.stringify(ld);
}

export { tools, BASE_URL };
