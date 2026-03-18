import type { Metadata } from "next";
import { getToolMetadata, getToolJsonLd } from "../lib/seo-tools";

export const metadata: Metadata = getToolMetadata("watermark-pdf");

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = getToolJsonLd("watermark-pdf");
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      {children}
    </>
  );
}
