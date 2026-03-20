import { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Unlock PDF - Remove PDF Password Protection Online Free | 4uPDF",
  description:
    "Remove password protection from your PDF documents online for free. Unlock password-protected PDFs instantly. No registration required.",
  openGraph: {
    title: "Unlock PDF - Remove PDF Password Protection Online Free | 4uPDF",
    description:
      "Remove password protection from your PDF documents online for free. Unlock password-protected PDFs instantly.",
    type: "website",
    url: "https://4updf.com/tools/unlock-pdf",
  },
  alternates: {
    canonical: "https://4updf.com/tools/unlock-pdf",
  },
};

export default function UnlockPDFLayout({
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
