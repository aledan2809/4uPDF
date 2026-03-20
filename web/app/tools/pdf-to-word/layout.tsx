import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to Word - Convert PDF to DOCX Online Free | 4uPDF",
  description:
    "Convert PDF files to editable Word documents (DOCX) for free. Preserve formatting and layout. Fast, secure, no registration required.",
  alternates: {
    canonical: "https://4updf.com/tools/pdf-to-word",
  },
  openGraph: {
    title: "PDF to Word - Convert PDF to DOCX Online Free",
    description: "Convert PDF files to editable Word documents (DOCX) for free. Preserve formatting.",
    url: "https://4updf.com/tools/pdf-to-word",
    type: "website",
  },
};

export default function PDFToWordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
