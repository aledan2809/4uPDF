import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Split PDF by Text Pattern - Smart PDF Splitting | 4uPDF",
  description:
    "Split PDF documents when specific text patterns are found. Automatically divide PDFs by keywords, page markers, or custom patterns.",
  keywords:
    "split PDF by text, PDF pattern split, smart PDF split, divide PDF by content, text-based PDF splitter",
  openGraph: {
    title: "Split PDF by Text Pattern | 4uPDF",
    description:
      "Split PDF documents automatically when specific text patterns are found on pages.",
    url: "https://4updf.com/split-pattern",
    type: "website",
  },
};

export default function SplitPatternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Split PDF by Text Pattern - 4uPDF",
            description:
              "Split PDF documents when specific text patterns are found",
            applicationCategory: "WebApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            url: "https://4updf.com/split-pattern",
          }),
        }}
      />
      {children}
    </>
  );
}
