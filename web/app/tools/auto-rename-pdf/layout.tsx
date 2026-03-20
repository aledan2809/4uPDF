import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auto-Rename PDF by Content - 4uPDF",
  description:
    "Let AI read your PDF and suggest meaningful filenames based on content. Extract dates, invoice numbers, and document types automatically using OCR.",
  openGraph: {
    title: "Auto-Rename PDF by Content - 4uPDF",
    description:
      "AI-powered file naming. Extract dates, invoice numbers, and document types to auto-rename your PDFs.",
    type: "website",
    url: "https://4updf.com/tools/auto-rename-pdf",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
