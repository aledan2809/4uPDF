import { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Organize PDF - Reorder & Reverse PDF Pages Online Free | 4uPDF",
  description:
    "Reorder, rearrange, and reverse pages in your PDF documents online for free. Specify custom page order or reverse all pages. No registration required.",
  openGraph: {
    title: "Organize PDF - Reorder & Reverse PDF Pages Online Free | 4uPDF",
    description:
      "Reorder, rearrange, and reverse pages in your PDF documents online for free. Full control over page order.",
    type: "website",
    url: "https://4updf.com/tools/organize-pdf",
  },
  alternates: {
    canonical: "https://4updf.com/tools/organize-pdf",
  },
};

export default function OrganizePDFLayout({
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
