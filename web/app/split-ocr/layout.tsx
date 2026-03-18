import type { Metadata } from "next";
import { getToolMetadata, getToolJsonLd } from "../lib/seo-tools";

export const metadata: Metadata = getToolMetadata("split-ocr");

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = getToolJsonLd("split-ocr");
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
