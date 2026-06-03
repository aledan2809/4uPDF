import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crop PDF - Crop PDF Page Margins Online Free | 4uPDF",
  description:
    "Crop PDF page margins to remove whitespace and unwanted content from your documents online for free. No registration required.",
  openGraph: {
    title: "Crop PDF - Crop PDF Page Margins Online Free | 4uPDF",
    description:
      "Crop PDF page margins to remove whitespace and unwanted content from your documents online for free.",
    type: "website",
    url: "https://4updf.com/tools/crop-pdf",
  },
  alternates: {
    canonical: "https://4updf.com/tools/crop-pdf",
  },
};

export default function CropPDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
