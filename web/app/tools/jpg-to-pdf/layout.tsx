import { Metadata } from "next";

export const metadata: Metadata = {
  title: "JPG to PDF - Convert Images to PDF Online Free | 4uPDF",
  description:
    "Convert JPG, JPEG, and PNG images to PDF documents for free. Combine multiple images into one PDF. Choose page size, drag to reorder.",
  alternates: {
    canonical: "https://4updf.com/tools/jpg-to-pdf",
  },
  openGraph: {
    title: "JPG to PDF - Convert Images to PDF Online Free",
    description: "Convert JPG images to PDF documents for free. Combine multiple images into one PDF.",
    url: "https://4updf.com/tools/jpg-to-pdf",
    type: "website",
  },
};

export default function JPGToPDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
