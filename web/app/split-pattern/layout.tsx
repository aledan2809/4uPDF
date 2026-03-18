import type { Metadata } from "next";
import { getToolMetadata, getToolJsonLd } from "../lib/seo-tools";

export const metadata: Metadata = getToolMetadata("split-pattern");

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = getToolJsonLd("split-pattern");
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
