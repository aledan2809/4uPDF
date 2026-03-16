import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Merge PDF - Combine PDF Files Online Free | 4uPDF",
  description:
    "Merge multiple PDF files into one document online for free. Combine PDFs easily without registration or installation.",
  keywords:
    "merge PDF, combine PDF, join PDF files, merge PDF online, free PDF merger, PDF combiner",
  openGraph: {
    title: "Merge PDF - Combine PDF Files | 4uPDF",
    description:
      "Merge multiple PDF files into one document online for free. No registration required.",
    url: "https://4updf.com/merge-pdf",
    type: "website",
  },
};

export default function MergePdfLayout({
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
            name: "Merge PDF - 4uPDF",
            description: "Merge multiple PDF files into one document online for free",
            applicationCategory: "WebApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            url: "https://4updf.com/merge-pdf",
          }),
        }}
      />
      {children}
    </>
  );
}
