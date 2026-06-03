import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Repair PDF - Fix Corrupted PDF Files Online Free | 4uPDF",
  description:
    "Repair corrupted or damaged PDF files online for free. Fix broken PDFs and recover your documents. No registration required.",
  openGraph: {
    title: "Repair PDF - Fix Corrupted PDF Files Online Free | 4uPDF",
    description:
      "Repair corrupted or damaged PDF files online for free. Fix broken PDFs and recover your documents.",
    type: "website",
    url: "https://4updf.com/tools/repair-pdf",
  },
  alternates: {
    canonical: "https://4updf.com/tools/repair-pdf",
  },
};

export default function RepairPDFLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
