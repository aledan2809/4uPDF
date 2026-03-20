import { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Protect PDF - Add Password Protection to PDF Online Free | 4uPDF",
  description:
    "Add password protection to your PDF documents online for free. Use AES-256 encryption and set permissions. No registration required.",
  openGraph: {
    title: "Protect PDF - Add Password Protection to PDF Online Free | 4uPDF",
    description:
      "Add password protection to your PDF documents online for free. Use AES-256 encryption and set permissions.",
    type: "website",
    url: "https://4updf.com/tools/protect-pdf",
  },
  alternates: {
    canonical: "https://4updf.com/tools/protect-pdf",
  },
};

export default function ProtectPDFLayout({
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
