import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF to Word - Convert PDF to DOCX Online Free | 4uPDF",
  description:
    "Convert PDF files to editable Word documents (DOCX) online for free. Extract text from PDFs easily.",
  keywords:
    "PDF to Word, convert PDF to DOCX, PDF converter, PDF to Word online, free PDF to Word, extract PDF text",
  openGraph: {
    title: "PDF to Word - Convert PDF to DOCX | 4uPDF",
    description:
      "Convert PDF files to editable Word documents online for free.",
    url: "https://4updf.com/pdf-to-word",
    type: "website",
  },
};

export default function PdfToWordLayout({
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
            name: "PDF to Word - 4uPDF",
            description: "Convert PDF files to editable Word documents online for free",
            applicationCategory: "WebApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            url: "https://4updf.com/pdf-to-word",
          }),
        }}
      />
      {children}
    </>
  );
}
