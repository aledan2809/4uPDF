import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign PDF - Add Digital Signature to PDF | 4uPDF",
  description:
    "Add a digital signature to your PDF documents online for free. Sign PDFs with text or image signatures. No installation required.",
  keywords:
    "sign PDF, digital signature, PDF signature, add signature to PDF, free PDF signer, online PDF signature",
  openGraph: {
    title: "Sign PDF - Add Digital Signature | 4uPDF",
    description:
      "Add a digital signature to your PDF documents online for free. Sign PDFs with text or image signatures.",
    url: "https://4updf.com/sign-pdf",
    type: "website",
  },
};

export default function SignPdfLayout({
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
            name: "Sign PDF - 4uPDF",
            description:
              "Add a digital signature to your PDF documents online for free",
            applicationCategory: "WebApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            url: "https://4updf.com/sign-pdf",
          }),
        }}
      />
      {children}
    </>
  );
}
