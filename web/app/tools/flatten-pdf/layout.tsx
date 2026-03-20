import { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Flatten PDF - Flatten Form Fields and Annotations Online Free | 4uPDF",
  description:
    "Flatten PDF form fields and annotations into static content online for free. Make PDFs uneditable while preserving appearance. No registration required.",
  openGraph: {
    title: "Flatten PDF - Flatten Form Fields and Annotations Online Free | 4uPDF",
    description:
      "Flatten PDF form fields and annotations into static content online for free. Make PDFs uneditable while preserving appearance.",
    type: "website",
    url: "https://4updf.com/tools/flatten-pdf",
  },
  alternates: {
    canonical: "https://4updf.com/tools/flatten-pdf",
  },
};

export default function FlattenPDFLayout({
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
