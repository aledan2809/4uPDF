import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface BlogPost {
  title: string;
  description: string;
  date: string;
  readTime: string;
  content: string;
  tools: { slug: string; label: string }[];
}

const POSTS: Record<string, BlogPost> = {
  "how-to-merge-pdf-files-online-free": {
    title: "How to Merge PDF Files Online for Free",
    description: "Learn the fastest way to combine multiple PDF documents into a single file without installing any software. Step-by-step guide with tips.",
    date: "2026-03-18",
    readTime: "4 min read",
    tools: [{ slug: "merge-pdf", label: "Merge PDF Tool" }],
    content: `
Merging PDF files is one of the most common document tasks. Whether you need to combine reports, contracts, or presentations, doing it online saves time and doesn't require any software installation.

## Why Merge PDFs Online?

- **No software to install** — works directly in your browser
- **Cross-platform** — works on Windows, Mac, Linux, and mobile
- **Fast** — most merges complete in under 5 seconds
- **Secure** — files are processed locally and deleted after download

## How to Merge PDF Files with 4uPDF

1. **Go to the [Merge PDF](/merge-pdf) tool**
2. **Upload your PDF files** — click or drag files into the upload area
3. **Reorder if needed** — use the arrow buttons to change the order
4. **Click "Merge"** — your combined PDF is ready to download instantly

## Tips for Better Merging

- **Check page orientation** before merging — rotate pages first if some are landscape
- **Compress large files** before merging to keep the final file size manageable
- **Name your files clearly** — the merge tool preserves the order you set

## File Size Limits

Free users can merge files up to 50MB each. [Pro users](/pricing) get 200MB per file and batch processing for larger workflows.

## Common Use Cases

- Combining scanned documents into a single file
- Merging contract pages with signed signature pages
- Creating a single report from multiple departments
- Bundling invoices for accounting
    `,
  },
  "how-to-split-large-scanned-pdfs": {
    title: "How to Split Large Scanned PDFs",
    description: "A complete guide to splitting large scanned documents using OCR, text patterns, barcodes, and invoice numbers for automated document processing.",
    date: "2026-03-18",
    readTime: "6 min read",
    tools: [
      { slug: "split-pdf", label: "Split PDF" },
      { slug: "split-ocr", label: "OCR Split" },
      { slug: "split-barcode", label: "Barcode Split" },
      { slug: "split-invoice", label: "Invoice Split" },
    ],
    content: `
Large scanned PDFs with hundreds of pages are common in offices, archives, and accounting departments. Splitting them manually page by page is tedious and error-prone. Here's how to do it automatically.

## Method 1: Split by Page Ranges

The simplest approach — [Split PDF](/split-pdf) lets you specify exact page ranges:
- Split into individual pages
- Define custom ranges like "1-10, 11-20, 21-30"

Best for: documents where you know exactly which pages belong together.

## Method 2: Split by Text Pattern

Use [Pattern Split](/split-pattern) when documents have a repeating text marker:
- Enter a text pattern (e.g., "SECTION", "Page 1 of", "Report Date")
- The tool uses OCR to detect where each new section begins
- Automatically splits at every occurrence

Best for: reports, statements, batched printouts.

## Method 3: Split by Barcode or QR Code

If your documents have barcode separator pages, [Barcode Split](/split-barcode) is the fastest option:
- Upload your PDF
- The tool detects QR codes and barcodes on each page
- Splits at every barcode page, optionally including or excluding the separator

Best for: pre-printed separator sheets, warehouse documents, logistics.

## Method 4: Split by Invoice Number

For accounting workflows, [Invoice Split](/split-invoice) uses OCR to:
- Detect invoice or order numbers on each page
- Group pages by the same number
- Output separate PDFs named by invoice number

Best for: multi-invoice scans, purchase order batches.

## Which Method Should I Use?

| Scenario | Best Tool |
|----------|-----------|
| Known page ranges | Split PDF |
| Repeating text headers | Pattern Split |
| Barcode separator pages | Barcode Split |
| Invoices/order numbers | Invoice Split |
| Mixed documents | Process Archive |

## Processing Large Files

For files over 50MB or batches of PDFs, consider [upgrading to Pro](/pricing) for higher limits and batch processing via the [Archive Processor](/process-archive).
    `,
  },
  "compress-pdf-without-losing-quality": {
    title: "How to Compress PDF Without Losing Quality",
    description: "Reduce PDF file size for email and uploads while maintaining readability. Understand compression levels and when to use each one.",
    date: "2026-03-18",
    readTime: "4 min read",
    tools: [{ slug: "compress-pdf", label: "Compress PDF Tool" }],
    content: `
Email attachments, upload forms, and cloud storage all have file size limits. Compressing PDFs helps you stay within those limits without losing important content.

## Understanding PDF Compression Levels

4uPDF offers three compression levels:

### High Quality (Recommended)
- Minimal visual difference
- Best for documents with photos or graphics
- Typically 20-40% size reduction

### Medium Quality
- Good balance of size and quality
- Suitable for most business documents
- Typically 40-70% size reduction

### Low Quality
- Maximum size reduction
- Text remains readable, images may lose detail
- Typically 70-90% size reduction

## How to Compress a PDF

1. Go to [Compress PDF](/compress-pdf)
2. Upload your PDF file
3. Choose your compression level
4. Click "Compress" and download the result

## When to Use Each Level

- **Emailing a report** → Medium quality
- **Archiving scanned documents** → Low quality (saves storage)
- **Sharing design files** → High quality (preserves visuals)
- **Uploading to a web form** → Medium or Low, depending on the size limit

## Tips for Smaller PDFs

- **Remove unnecessary pages** first with [Delete Pages](/delete-pages)
- **Convert images to lower DPI** before creating the PDF
- **Use PDF/A format** for archival (removes interactive elements)
- **Merge then compress** — compressing a merged file is more efficient than compressing individual files

## Size Limits

Free accounts can compress files up to 50MB. [Pro accounts](/pricing) support files up to 200MB.
    `,
  },
  "organize-scanned-document-archives": {
    title: "How to Organize Scanned Document Archives",
    description: "Automate the classification, splitting, and renaming of large scanned document collections using OCR and AI detection tools.",
    date: "2026-03-18",
    readTime: "5 min read",
    tools: [
      { slug: "process-archive", label: "Process Archive" },
      { slug: "detect-type", label: "Detect Type" },
      { slug: "auto-rename", label: "Auto-Rename" },
    ],
    content: `
Digitizing paper archives often results in thousands of scanned PDFs with meaningless filenames like "scan001.pdf". Here's how to automatically organize them.

## The Problem

After scanning, you typically have:
- Hundreds of PDFs named sequentially (scan001, scan002...)
- Mixed document types in the same folder
- No way to search or categorize

## The Solution: Automated Processing

### Step 1: Detect Document Types

Use [Detect Type](/detect-type) to analyze each PDF:
- **Invoice** — detected by amounts, tax IDs, "invoice" keywords
- **Contract** — detected by legal language, signature blocks
- **Delivery Note** — detected by shipping terms, item lists
- **Other** — anything that doesn't match known patterns

### Step 2: Auto-Rename by Content

Use [Auto-Rename](/auto-rename) to extract meaningful names:
- Extracts dates, invoice numbers, company names from text
- Renames "scan042.pdf" to "2026-03-15_Invoice_CompanyXYZ.pdf"
- Works with OCR for scanned (image-based) documents

### Step 3: Batch Process Archives

For large collections, [Process Archive](/process-archive) handles everything:
1. Upload a ZIP file containing all your PDFs
2. The tool automatically detects, classifies, splits, and renames
3. Download the organized result

## Workflow for Large Archives

1. Scan all documents to a single folder
2. ZIP the folder
3. Upload to [Process Archive](/process-archive)
4. Download the organized output
5. Move to your document management system

## Best Practices

- **Scan at 300 DPI** for reliable OCR
- **Use color scanning** for documents with stamps or signatures
- **Process in batches** of 50-100 documents for best results
- **Verify a sample** after processing to check accuracy
    `,
  },
  "best-free-pdf-tools-2026": {
    title: "Best Free PDF Tools in 2026",
    description: "A comprehensive comparison of the best free online PDF tools in 2026 for merge, split, compress, convert, sign, and more.",
    date: "2026-03-18",
    readTime: "7 min read",
    tools: [],
    content: `
The market for online PDF tools has grown significantly. Here's our honest comparison of the best free options available in 2026.

## What to Look For

- **No registration required** for basic operations
- **File privacy** — processing without uploading to cloud servers
- **Speed** — tools should complete in seconds, not minutes
- **Feature depth** — beyond basic merge/split

## Top Free PDF Tools

### 4uPDF
- **Best for**: All-in-one PDF processing including OCR automation
- **Unique features**: Barcode splitting, invoice detection, auto-rename, archive processing
- **Free tier**: 5 operations/day, 50MB file limit
- **Pro**: €5/month for 1,000 daily operations
- **Privacy**: Files processed on-server, auto-deleted after download

### iLovePDF
- **Best for**: Simple merge/split/compress
- **Free tier**: Limited daily operations
- **Pro**: From €4/month
- **Note**: Uploads to cloud servers

### Smallpdf
- **Best for**: Clean UI and ease of use
- **Free tier**: 2 operations/day
- **Pro**: From €9/month
- **Note**: More expensive but polished interface

### PDF24
- **Best for**: Completely free desktop tool
- **Unique**: Offline desktop application available
- **Note**: Web version has ads

## Feature Comparison

| Feature | 4uPDF | iLovePDF | Smallpdf | PDF24 |
|---------|-------|----------|----------|-------|
| Merge | ✓ | ✓ | ✓ | ✓ |
| Split | ✓ | ✓ | ✓ | ✓ |
| Compress | ✓ | ✓ | ✓ | ✓ |
| OCR Split | ✓ | ✗ | ✗ | ✗ |
| Barcode Split | ✓ | ✗ | ✗ | ✗ |
| Invoice Detection | ✓ | ✗ | ✗ | ✗ |
| Auto-Rename | ✓ | ✗ | ✗ | ✗ |
| Archive Processing | ✓ | ✗ | ✗ | ✗ |
| Sign PDF | ✓ | ✓ | ✓ | ✓ |
| Free Tier | 5/day | Limited | 2/day | Unlimited |

## Our Recommendation

For basic tasks (merge, split, compress), any tool works. For **document automation** — OCR splitting, invoice detection, archive processing — [4uPDF](/) is the only free option with these capabilities.

If you regularly process more than 5 documents per day, a [Pro subscription](/pricing) at €5/month is the best value compared to competitors charging €9+/month for fewer features.
    `,
  },
};

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = POSTS[params.slug];
  if (!post) return {};
  return {
    title: `${post.title} | 4uPDF Blog`,
    description: post.description,
    alternates: { canonical: `https://4updf.com/blog/${params.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://4updf.com/blog/${params.slug}`,
      siteName: "4uPDF",
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = POSTS[params.slug];
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto p-6 mt-8">
      <Link href="/blog" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
        &larr; All articles
      </Link>
      <h1 className="text-3xl font-bold mb-3">{post.title}</h1>
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
        <span>{post.date}</span>
        <span>{post.readTime}</span>
      </div>

      <div
        className="prose prose-invert prose-gray max-w-none
          prose-headings:text-gray-100 prose-p:text-gray-300 prose-li:text-gray-300
          prose-a:text-blue-400 prose-strong:text-gray-200
          prose-table:text-sm prose-th:text-left prose-th:py-2 prose-th:px-3 prose-td:py-2 prose-td:px-3
          prose-th:bg-gray-800 prose-tr:border-gray-800"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
      />

      {post.tools.length > 0 && (
        <div className="mt-10 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="font-bold mb-3">Related Tools</h3>
          <div className="flex flex-wrap gap-3">
            {post.tools.map((tool) => (
              <Link
                key={tool.slug}
                href={`/${tool.slug}`}
                className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {tool.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            author: { "@type": "Organization", name: "4uPDF" },
            publisher: { "@type": "Organization", name: "4uPDF", url: "https://4updf.com" },
            url: `https://4updf.com/blog/${params.slug}`,
          }),
        }}
      />
    </article>
  );
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/^\| (.+)/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.every(c => c.match(/^-+$/))) return '';
      const tag = match.includes('---') ? 'th' : 'td';
      return '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
    })
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hulo]|<tr|<li|<\/)/gm, (match) => match ? `<p>${match}` : '')
    .replace(new RegExp('<tr>.*<\\/tr>', 'gs'), (match) => `<table>${match}</table>`)
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s*<\/p>/g, '');
}
