import { MetadataRoute } from "next";
import { getAllBlogPosts } from '../lib/blog';

const BASE_URL = "https://4updf.com";

const tools = [
  "merge-pdf",
  "split-pdf",
  "compress-pdf",
  "rotate-pdf",
  "delete-pages",
  "extract-pages",
  "crop-pdf",
  "repair-pdf",
  "pdf-to-word",
  "pdf-to-excel",
  "pdf-to-powerpoint",
  "pdf-to-jpg",
  "pdf-to-png",
  "pdf-to-text",
  "word-to-pdf",
  "excel-to-pdf",
  "powerpoint-to-pdf",
  "jpg-to-pdf",
  "png-to-pdf",
  "text-to-pdf",
  "watermark-pdf",
  "add-page-numbers",
  "ocr-pdf",
  "searchable-pdf",
  "split-by-text",
  "split-invoices",
  "auto-rename-pdf",
  "document-detector",
  "extract-text-from-pdf",
  "protect-pdf",
  "unlock-pdf",
  "flatten-pdf",
  "archive-processor",
  "invoice-extractor",
  "receipt-extractor",
  "batch-document-splitter",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/automation`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/batch-processing`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/dashboard`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookie-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];

  const howToPages = [
    'how-to-merge-pdf',
    'how-to-split-pdf',
    'how-to-compress-pdf',
    'how-to-convert-pdf-to-word',
    'how-to-organize-scanned-documents',
    'how-to-extract-invoices-from-pdf',
  ].map((page) => ({
    url: `${BASE_URL}/${page}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const toolPages = tools.map((tool) => ({
    url: `${BASE_URL}/tools/${tool}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const blogPosts = getAllBlogPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...howToPages, ...toolPages, ...blogPosts];
}
