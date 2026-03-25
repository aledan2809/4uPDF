import { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Redact PDF - Black Out Sensitive Text Online Free | 4uPDF",
  description:
    "Redact sensitive text from your PDF documents online for free. Search for text and permanently black it out. No registration required.",
  openGraph: {
    title: "Redact PDF - Black Out Sensitive Text Online Free | 4uPDF",
    description:
      "Redact sensitive text from your PDF documents online for free. Permanently remove confidential information.",
    type: "website",
    url: "https://4updf.com/tools/redact-pdf",
  },
  alternates: {
    canonical: "https://4updf.com/tools/redact-pdf",
  },
};

export default function RedactPDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-950">{children}</main>
      <Footer />
    </>
  );
}
