import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Extract Figure from PDF - Snip a Region as Image Online Free | 4uPDF",
  description:
    "Draw a box around any figure, chart, diagram or drawing in a PDF and export just that region as a PNG image. 100% in your browser — no upload, no registration.",
  openGraph: {
    title: "Extract Figure from PDF - Snip a Region as Image Online Free | 4uPDF",
    description:
      "Crop any region of a PDF page to a PNG image, right in your browser. Private, no upload, free.",
    type: "website",
    url: "https://4updf.com/tools/extract-figure",
  },
  alternates: {
    canonical: "https://4updf.com/tools/extract-figure",
  },
};

export default function ExtractFigureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
