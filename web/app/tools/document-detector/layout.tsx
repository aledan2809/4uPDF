import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Type Detector - Classify PDFs with AI - 4uPDF",
  description:
    "Upload any PDF and let AI classify it as invoice, contract, receipt, form, letter, or report. Uses OCR and keyword matching in multiple languages.",
  openGraph: {
    title: "Document Type Detector - 4uPDF",
    description:
      "AI-powered document classification. Detect invoices, contracts, receipts, forms, and more from any PDF.",
    type: "website",
    url: "https://4updf.com/tools/document-detector",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
