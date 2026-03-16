import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Split PDF by Invoice Number - OCR Invoice Splitter | 4uPDF",
  description:
    "Automatically split PDF documents by invoice or order numbers using OCR. Perfect for batch processing invoices, orders, and business documents.",
  keywords:
    "split PDF by invoice, invoice splitter, order number PDF split, OCR PDF split, batch invoice processing, split by factura",
  openGraph: {
    title: "Split PDF by Invoice Number | 4uPDF",
    description:
      "Automatically split PDF documents by invoice or order numbers using OCR technology.",
    url: "https://4updf.com/split-invoice",
    type: "website",
  },
};

export default function SplitInvoiceLayout({
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
            name: "Split PDF by Invoice Number - 4uPDF",
            description:
              "Automatically split PDF documents by invoice or order numbers using OCR",
            applicationCategory: "WebApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            url: "https://4updf.com/split-invoice",
          }),
        }}
      />
      {children}
    </>
  );
}
