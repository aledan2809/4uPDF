import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Split PDF - Extract Pages or Split PDF Online Free | 4uPDF",
  description:
    "Split PDF files into multiple documents or extract specific pages for free. Choose page ranges, split by intervals, or extract single pages.",
  alternates: {
    canonical: "https://4updf.com/tools/split-pdf",
  },
  openGraph: {
    title: "Split PDF - Extract Pages or Split PDF Online Free",
    description: "Split PDF files into multiple documents or extract specific pages for free.",
    url: "https://4updf.com/tools/split-pdf",
    type: "website",
  },
};

export default function SplitPDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
