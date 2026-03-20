import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compress PDF - Reduce PDF File Size Online Free | 4uPDF",
  description:
    "Compress PDF files to reduce file size without losing quality. Free online PDF compressor with 3 compression levels. Perfect for email attachments.",
  alternates: {
    canonical: "https://4updf.com/tools/compress-pdf",
  },
  openGraph: {
    title: "Compress PDF - Reduce PDF File Size Online Free",
    description: "Compress PDF files to reduce file size without losing quality. Free online PDF compressor.",
    url: "https://4updf.com/tools/compress-pdf",
    type: "website",
  },
};

export default function CompressPDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
