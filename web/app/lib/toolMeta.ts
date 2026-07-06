// Tool metadata + operation mapping for the workspace home ("Recent") and next-step chaining.
// Operations in usage_history are derived from the API path (e.g. "merge", "split-pages",
// "edit-pdf-text"), so we match by keyword — robust to exact endpoint naming — and fall back to a
// humanized label linking to the tools index. Keep the ordered list specific-before-generic
// (e.g. "split-invoices" before "split").

export interface ToolMeta {
  label: string;
  href: string;
  icon: string;
}

const OPERATION_MAP: { test: RegExp; meta: ToolMeta }[] = [
  { test: /merge/i, meta: { label: "Merge PDF", href: "/tools/merge-pdf", icon: "📑" } },
  { test: /split[-_]?invoice/i, meta: { label: "Split Invoices", href: "/tools/split-invoices", icon: "🧾" } },
  { test: /split/i, meta: { label: "Split PDF", href: "/tools/split-pdf", icon: "✂️" } },
  { test: /compress/i, meta: { label: "Compress PDF", href: "/tools/compress-pdf", icon: "📉" } },
  { test: /edit/i, meta: { label: "Edit PDF", href: "/tools/edit-pdf", icon: "✏️" } },
  { test: /rotate/i, meta: { label: "Rotate PDF", href: "/tools/rotate-pdf", icon: "🔄" } },
  { test: /invoice/i, meta: { label: "Invoice Extract", href: "/tools/invoice-extractor", icon: "🧾" } },
  { test: /receipt/i, meta: { label: "Receipt Extract", href: "/tools/receipt-extractor", icon: "🧾" } },
  { test: /ocr/i, meta: { label: "OCR PDF", href: "/tools/ocr-pdf", icon: "🔍" } },
  { test: /searchable/i, meta: { label: "Searchable PDF", href: "/tools/searchable-pdf", icon: "🔎" } },
  { test: /pdf.?to.?word/i, meta: { label: "PDF → Word", href: "/tools/pdf-to-word", icon: "📝" } },
  { test: /pdf.?to.?excel/i, meta: { label: "PDF → Excel", href: "/tools/pdf-to-excel", icon: "📊" } },
  { test: /pdf.?to.?(powerpoint|pptx)/i, meta: { label: "PDF → PowerPoint", href: "/tools/pdf-to-powerpoint", icon: "📽️" } },
  { test: /pdf.?to.?(jpg|png|image)/i, meta: { label: "PDF → Image", href: "/tools/pdf-to-jpg", icon: "🖼️" } },
  { test: /pdf.?to.?text/i, meta: { label: "PDF → Text", href: "/tools/pdf-to-text", icon: "🔤" } },
  { test: /word.?to.?pdf/i, meta: { label: "Word → PDF", href: "/tools/word-to-pdf", icon: "📄" } },
  { test: /excel.?to.?pdf/i, meta: { label: "Excel → PDF", href: "/tools/excel-to-pdf", icon: "📄" } },
  { test: /(powerpoint|pptx).?to.?pdf/i, meta: { label: "PowerPoint → PDF", href: "/tools/powerpoint-to-pdf", icon: "📽️" } },
  { test: /(jpg|jpeg).?to.?pdf/i, meta: { label: "JPG → PDF", href: "/tools/jpg-to-pdf", icon: "🖼️" } },
  { test: /png.?to.?pdf/i, meta: { label: "PNG → PDF", href: "/tools/png-to-pdf", icon: "🖼️" } },
  { test: /html.?to.?pdf/i, meta: { label: "HTML → PDF", href: "/tools/html-to-pdf", icon: "🌐" } },
  { test: /text.?to.?pdf/i, meta: { label: "Text → PDF", href: "/tools/text-to-pdf", icon: "📄" } },
  { test: /repair/i, meta: { label: "Repair PDF", href: "/tools/repair-pdf", icon: "🛠️" } },
  { test: /watermark/i, meta: { label: "Watermark PDF", href: "/tools/watermark-pdf", icon: "💧" } },
  { test: /page[-_]?number/i, meta: { label: "Page Numbers", href: "/tools/add-page-numbers", icon: "#️⃣" } },
  { test: /protect/i, meta: { label: "Protect PDF", href: "/tools/protect-pdf", icon: "🔒" } },
  { test: /unlock/i, meta: { label: "Unlock PDF", href: "/tools/unlock-pdf", icon: "🔓" } },
  { test: /sign/i, meta: { label: "Sign PDF", href: "/tools/sign-pdf", icon: "✍️" } },
  { test: /redact/i, meta: { label: "Redact PDF", href: "/tools/redact-pdf", icon: "⬛" } },
  { test: /annotate/i, meta: { label: "Annotate PDF", href: "/tools/annotate-pdf", icon: "🖊️" } },
  { test: /crop/i, meta: { label: "Crop PDF", href: "/tools/crop-pdf", icon: "🔲" } },
  { test: /flatten/i, meta: { label: "Flatten PDF", href: "/tools/flatten-pdf", icon: "📄" } },
  { test: /delete[-_]?page/i, meta: { label: "Delete Pages", href: "/tools/delete-pages", icon: "🗑️" } },
  { test: /extract[-_]?page/i, meta: { label: "Extract Pages", href: "/tools/extract-pages", icon: "📄" } },
  { test: /extract[-_]?(text|region|figure)/i, meta: { label: "Extract from PDF", href: "/tools/extract-text-from-pdf", icon: "🔤" } },
  { test: /auto[-_]?rename/i, meta: { label: "Auto-Rename PDF", href: "/tools/auto-rename-pdf", icon: "🏷️" } },
];

/** Map a recorded operation name to a tool. Falls back to a humanized label + tools index. */
export function describeOperation(operation: string): ToolMeta {
  const op = (operation || "").trim();
  for (const { test, meta } of OPERATION_MAP) {
    if (test.test(op)) return meta;
  }
  const label = op.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "PDF tool";
  return { label, href: "/#tools", icon: "📄" };
}

/** SQLite CURRENT_TIMESTAMP is UTC without a zone marker ("YYYY-MM-DD HH:MM:SS"). Normalize to ISO-UTC. */
export function relativeTime(raw: string): string {
  if (!raw) return "";
  const hasZone = /[zZ]|[+-]\d\d:?\d\d$/.test(raw);
  const iso = (raw.includes("T") ? raw : raw.replace(" ", "T")) + (hasZone ? "" : "Z");
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

/** Curated quick-start tiles for the workspace home ("Start a task"). */
export const QUICK_START: ToolMeta[] = [
  { label: "Merge", href: "/tools/merge-pdf", icon: "📑" },
  { label: "Compress", href: "/tools/compress-pdf", icon: "📉" },
  { label: "Split", href: "/tools/split-pdf", icon: "✂️" },
  { label: "Edit", href: "/tools/edit-pdf", icon: "✏️" },
  { label: "PDF → Word", href: "/tools/pdf-to-word", icon: "📝" },
  { label: "Sign", href: "/tools/sign-pdf", icon: "✍️" },
];
