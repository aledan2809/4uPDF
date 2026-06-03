import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Page Numbers to PDF - Number PDF Pages Online Free | 4uPDF",
  description:
    "Add page numbers to your PDF documents online for free. Customize position, format, and starting number. No registration required.",
  openGraph: {
    title: "Add Page Numbers to PDF - Number PDF Pages Online Free | 4uPDF",
    description:
      "Add page numbers to your PDF documents online for free. Customize position, format, and starting number.",
    type: "website",
    url: "https://4updf.com/tools/add-page-numbers",
  },
  alternates: {
    canonical: "https://4updf.com/tools/add-page-numbers",
  },
};

export default function AddPageNumbersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
