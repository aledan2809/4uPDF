import { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Extract PDF Pages - Extract Pages from PDF Online Free | 4uPDF",
  description:
    "Extract specific pages from your PDF documents online for free. Create a new PDF with only the pages you need. No registration required.",
  openGraph: {
    title: "Extract PDF Pages - Extract Pages from PDF Online Free | 4uPDF",
    description:
      "Extract specific pages from your PDF documents online for free. Create a new PDF with only the pages you need.",
    type: "website",
    url: "https://4updf.com/tools/extract-pages",
  },
  alternates: {
    canonical: "https://4updf.com/tools/extract-pages",
  },
};

export default function ExtractPagesLayout({
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
