import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign PDF - Add Signature to PDF Online Free | 4uPDF",
  description:
    "Add text signatures to your PDF documents online for free. Choose position, page, and font size. No registration required.",
  openGraph: {
    title: "Sign PDF - Add Signature to PDF Online Free | 4uPDF",
    description:
      "Add text signatures to your PDF documents online for free. Choose position, page, and font size.",
    type: "website",
    url: "https://4updf.com/tools/sign-pdf",
  },
  alternates: {
    canonical: "https://4updf.com/tools/sign-pdf",
  },
};

export default function SignPDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
