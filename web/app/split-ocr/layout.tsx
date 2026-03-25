import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Split PDF by OCR - Split Scanned PDFs by Order Number | 4uPDF",
  description:
    "Split scanned PDFs by order number using OCR. Automatically detect order numbers and split large scanned documents into individual files.",
  alternates: {
    canonical: "https://4updf.com/split-ocr",
  },
  openGraph: {
    title: "Split PDF by OCR - Split Scanned PDFs by Order Number",
    description: "Split scanned PDFs by order number using OCR. Automatically detect order numbers and split large scanned documents.",
    url: "https://4updf.com/split-ocr",
    type: "website",
  },
};

export default function SplitOCRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
