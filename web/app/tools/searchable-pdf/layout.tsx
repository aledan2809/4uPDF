import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Make PDF Searchable - Add Text Layer to Scanned PDF - 4uPDF",
  description:
    "Convert scanned PDFs into searchable documents. Add an invisible text layer so you can select, copy, and search text within your PDF. Free online tool.",
  openGraph: {
    title: "Make PDF Searchable - 4uPDF",
    description:
      "Add a searchable text layer to scanned PDFs. Enable Ctrl+F search, text selection, and copy functionality.",
    type: "website",
    url: "https://4updf.com/tools/searchable-pdf",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
