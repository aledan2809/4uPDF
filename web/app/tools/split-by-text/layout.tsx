import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Split PDF by Text Pattern - 4uPDF",
  description:
    "Automatically split your PDF when specific text appears. Use OCR to detect text patterns like headers, section titles, or any recurring text. Free online tool.",
  openGraph: {
    title: "Split PDF by Text Pattern - 4uPDF",
    description:
      "Automatically split your PDF when specific text appears. OCR-powered text detection for accurate splitting.",
    type: "website",
    url: "https://4updf.com/tools/split-by-text",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
