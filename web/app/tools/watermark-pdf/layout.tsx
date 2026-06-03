import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watermark PDF - Add Watermark to PDF Online Free | 4uPDF",
  description:
    "Add text or image watermarks to your PDF documents online for free. Customize position, opacity, and rotation. No registration required.",
  openGraph: {
    title: "Watermark PDF - Add Watermark to PDF Online Free | 4uPDF",
    description:
      "Add text or image watermarks to your PDF documents online for free. Customize position, opacity, and rotation.",
    type: "website",
    url: "https://4updf.com/tools/watermark-pdf",
  },
  alternates: {
    canonical: "https://4updf.com/tools/watermark-pdf",
  },
};

export default function WatermarkPDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
