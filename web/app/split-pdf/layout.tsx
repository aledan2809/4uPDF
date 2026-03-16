import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Split PDF - Separate PDF Pages Online Free | 4uPDF",
  description:
    "Split PDF files into individual pages or custom ranges online for free. Divide PDFs easily without registration.",
  keywords:
    "split PDF, separate PDF pages, divide PDF, PDF splitter online, extract PDF pages, free PDF splitter",
  openGraph: {
    title: "Split PDF - Separate PDF Pages | 4uPDF",
    description:
      "Split PDF files into individual pages or custom ranges online for free.",
    url: "https://4updf.com/split-pdf",
    type: "website",
  },
};

export default function SplitPdfLayout({
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
            name: "Split PDF - 4uPDF",
            description: "Split PDF files into individual pages or custom ranges online for free",
            applicationCategory: "WebApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            url: "https://4updf.com/split-pdf",
          }),
        }}
      />
      {children}
    </>
  );
}
