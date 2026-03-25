import { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Edit PDF - Add Text to PDF Online Free | 4uPDF",
  description:
    "Add text annotations to your PDF documents online for free. Specify position, font size, color, and page number. No registration required.",
  openGraph: {
    title: "Edit PDF - Add Text to PDF Online Free | 4uPDF",
    description:
      "Add text annotations to your PDF documents online for free. Specify position, font size, color, and page number.",
    type: "website",
    url: "https://4updf.com/tools/edit-pdf",
  },
  alternates: {
    canonical: "https://4updf.com/tools/edit-pdf",
  },
};

export default function EditPDFLayout({
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
