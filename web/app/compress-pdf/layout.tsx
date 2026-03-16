import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compress PDF - Reduce PDF File Size Online Free | 4uPDF",
  description:
    "Compress PDF files and reduce file size online for free. Shrink PDF documents while maintaining quality.",
  keywords:
    "compress PDF, reduce PDF size, shrink PDF, PDF compressor online, free PDF compression, optimize PDF",
  openGraph: {
    title: "Compress PDF - Reduce File Size | 4uPDF",
    description:
      "Compress PDF files and reduce file size online for free while maintaining quality.",
    url: "https://4updf.com/compress-pdf",
    type: "website",
  },
};

export default function CompressPdfLayout({
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
            name: "Compress PDF - 4uPDF",
            description: "Compress PDF files and reduce file size online for free",
            applicationCategory: "WebApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            url: "https://4updf.com/compress-pdf",
          }),
        }}
      />
      {children}
    </>
  );
}
