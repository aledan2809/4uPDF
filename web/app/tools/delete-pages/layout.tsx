import { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Delete PDF Pages - Remove Pages from PDF Online Free | 4uPDF",
  description:
    "Delete specific pages from your PDF documents online for free. Remove unwanted pages easily. No registration required.",
  openGraph: {
    title: "Delete PDF Pages - Remove Pages from PDF Online Free | 4uPDF",
    description:
      "Delete specific pages from your PDF documents online for free. Remove unwanted pages easily.",
    type: "website",
    url: "https://4updf.com/tools/delete-pages",
  },
  alternates: {
    canonical: "https://4updf.com/tools/delete-pages",
  },
};

export default function DeletePagesLayout({
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
