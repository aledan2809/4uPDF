import { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Annotate PDF - Highlight & Underline PDF Text Online Free | 4uPDF",
  description:
    "Add highlight and underline annotations to your PDF documents online for free. Search for text and highlight it in yellow, green, blue, or pink. No registration required.",
  openGraph: {
    title: "Annotate PDF - Highlight & Underline PDF Text Online Free | 4uPDF",
    description:
      "Add highlight and underline annotations to your PDF documents online for free. Search for text and highlight it in any color.",
    type: "website",
    url: "https://4updf.com/tools/annotate-pdf",
  },
  alternates: {
    canonical: "https://4updf.com/tools/annotate-pdf",
  },
};

export default function AnnotatePDFLayout({
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
