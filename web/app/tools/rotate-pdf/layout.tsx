import { Metadata } from "next";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export const metadata: Metadata = {
  title: "Rotate PDF - Rotate PDF Pages Online Free | 4uPDF",
  description:
    "Rotate PDF pages by 90, 180, or 270 degrees online for free. Rotate all pages or specific pages. No registration required.",
  openGraph: {
    title: "Rotate PDF - Rotate PDF Pages Online Free | 4uPDF",
    description:
      "Rotate PDF pages by 90, 180, or 270 degrees online for free. Rotate all pages or specific pages.",
    type: "website",
    url: "https://4updf.com/tools/rotate-pdf",
  },
  alternates: {
    canonical: "https://4updf.com/tools/rotate-pdf",
  },
};

export default function RotatePDFLayout({
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
