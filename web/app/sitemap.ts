import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://4updf.com";

  const tools = [
    "merge-pdf",
    "split-pdf",
    "compress-pdf",
    "pdf-to-word",
    "word-to-pdf",
    "jpg-to-pdf",
    "pdf-to-jpg",
    "rotate-pdf",
    "delete-pages",
    "extract-pages",
    "watermark-pdf",
    "protect-pdf",
    "unlock-pdf",
    "sign-pdf",
    "split-pattern",
    "split-invoice",
    "split-barcode",
    "split-ocr",
    "auto-rename",
    "detect-type",
    "process-archive",
  ];

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ];

  const blogSlugs = [
    "how-to-merge-pdf-files-online-free",
    "how-to-split-large-scanned-pdfs",
    "compress-pdf-without-losing-quality",
    "organize-scanned-document-archives",
    "best-free-pdf-tools-2026",
  ];

  const blogPages = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    ...blogSlugs.map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  const toolPages = tools.map((tool) => ({
    url: `${baseUrl}/${tool}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...blogPages, ...toolPages];
}
