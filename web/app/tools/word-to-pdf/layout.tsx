import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word to PDF - Convert DOCX to PDF Online Free | 4uPDF",
  description:
    "Convert Word documents (DOCX, DOC) to PDF format for free. Preserve formatting and layout. Fast, secure, no software installation required.",
  alternates: {
    canonical: "https://4updf.com/tools/word-to-pdf",
  },
  openGraph: {
    title: "Word to PDF - Convert DOCX to PDF Online Free",
    description: "Convert Word documents to PDF format for free. Preserve formatting and layout.",
    url: "https://4updf.com/tools/word-to-pdf",
    type: "website",
  },
};

export default function WordToPDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
