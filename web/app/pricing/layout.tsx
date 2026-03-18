import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - 4uPDF Pro | Free & Pro PDF Tools Plans",
  description: "4uPDF pricing plans. Start free with 5 operations per day, or upgrade to Pro for €5/month with 1,000 daily operations, 200MB files, and batch processing.",
  alternates: { canonical: "https://4updf.com/pricing" },
  openGraph: {
    title: "4uPDF Pricing - Free & Pro Plans",
    description: "Start free with 5 daily operations. Upgrade to Pro for €5/month for unlimited PDF processing.",
    url: "https://4updf.com/pricing",
    siteName: "4uPDF",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
