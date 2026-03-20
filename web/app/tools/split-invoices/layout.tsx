import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Split Multi-Invoice PDF by Invoice Number - 4uPDF",
  description:
    "Automatically split multi-invoice PDFs by detecting invoice numbers. Perfect for accounting and bookkeeping. OCR-powered detection works with scanned documents.",
  openGraph: {
    title: "Split Multi-Invoice PDF - 4uPDF",
    description:
      "Automatically split multi-invoice PDFs by detecting invoice numbers. Perfect for accounting and bookkeeping.",
    type: "website",
    url: "https://4updf.com/tools/split-invoices",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
