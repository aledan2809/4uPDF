import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OCR PDF - Make Scanned PDFs Searchable - 4uPDF",
  description:
    "Convert scanned PDFs to searchable text using advanced OCR. Supports 100+ languages with high accuracy. Free online OCR tool.",
  openGraph: {
    title: "OCR PDF - Make Scanned PDFs Searchable - 4uPDF",
    description:
      "Convert scanned PDFs to searchable text using OCR. 100+ languages supported with high accuracy.",
    type: "website",
    url: "https://4updf.com/tools/ocr-pdf",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
