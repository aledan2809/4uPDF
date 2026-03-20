import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Extract Text from PDF with OCR - 4uPDF",
  description:
    "Extract all text from PDF documents using OCR. Export to TXT, JSON, or CSV format. Works with scanned documents and supports 100+ languages.",
  openGraph: {
    title: "Extract Text from PDF with OCR - 4uPDF",
    description:
      "OCR extract text from PDFs. Export to TXT, JSON, or CSV. Works with scanned documents.",
    type: "website",
    url: "https://4updf.com/tools/extract-text-from-pdf",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
