import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to JPG - Convert PDF to Images Online Free | 4uPDF",
  description:
    "Convert PDF pages to high-quality JPG images for free. Extract all pages or select specific pages. Choose from 72, 150, or 300 DPI quality.",
  alternates: {
    canonical: "https://4updf.com/tools/pdf-to-jpg",
  },
  openGraph: {
    title: "PDF to JPG - Convert PDF to Images Online Free",
    description: "Convert PDF pages to high-quality JPG images for free. Choose quality settings.",
    url: "https://4updf.com/tools/pdf-to-jpg",
    type: "website",
  },
};

export default function PDFToJPGLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
