import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merge PDF - Combine PDF Files Online Free | 4uPDF",
  description:
    "Merge multiple PDF files into one document for free. Drag and drop to reorder, fast processing, no registration required. Combine PDFs in seconds.",
  alternates: {
    canonical: "https://4updf.com/tools/merge-pdf",
  },
  openGraph: {
    title: "Merge PDF - Combine PDF Files Online Free",
    description: "Merge multiple PDF files into one document for free. Fast and secure.",
    url: "https://4updf.com/tools/merge-pdf",
    type: "website",
  },
};

export default function MergePDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
