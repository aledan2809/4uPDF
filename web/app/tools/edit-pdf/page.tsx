"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";
import type { PDFDocumentProxy } from "pdfjs-dist";

// Lazy-load pdf.js only in the browser (it touches DOMMatrix/Worker, so it must
// never run during SSR). The worker is self-hosted at /pdf.worker.min.mjs, so
// it is same-origin + always version-matched — no CDN, CSP-friendly.
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return mod;
    });
  }
  return pdfjsPromise;
}

interface TextItem {
  id: string;
  page: number;
  left: number;
  top: number;
  width: number;
  height: number;
  str: string;
  fcx: number; // page-fraction of the item centre (top-left origin)
  fcy: number;
}

interface Edit {
  id: string;
  page: number;
  fcx: number;
  fcy: number;
  oldText: string;
  newText: string;
}

const faqs = [
  {
    question: "How do I edit existing text in a PDF?",
    answer:
      "Upload your PDF — it is rendered right in your browser. Click on any word or line and an edit box opens with its current text. Change it, press Enter, then click “Apply changes & Download”. The original wording is replaced in place, keeping the same font, size and position.",
  },
  {
    question: "Why did the old tool say it couldn't find the text?",
    answer:
      "The previous version only stamped new text at fixed coordinates — it never detected the existing text. This version reads the PDF's real text layer, so you can click directly on the words you want to change.",
  },
  {
    question: "Will the edited text match the original font?",
    answer:
      "Yes. The tool extracts the font that is already embedded in your PDF and re-draws your new text with it, at the same size and colour, so the change blends in. If a character isn't in the embedded font, a Unicode fallback font is used.",
  },
  {
    question: "Does this work on scanned PDFs?",
    answer:
      "No — a scanned PDF is just an image with no real text to click. Run it through an OCR tool first (see Searchable PDF) to add a text layer, then edit it here.",
  },
  {
    question: "Is my file uploaded?",
    answer:
      "The page is rendered entirely in your browser. Your file is only sent to the server when you click “Apply changes & Download”, and it is removed after processing.",
  },
];

const relatedTools = [
  { name: "Add Page Numbers", href: "/tools/add-page-numbers", description: "Number your PDF pages" },
  { name: "Watermark PDF", href: "/tools/watermark-pdf", description: "Add watermarks to your PDF" },
  { name: "Extract Text", href: "/tools/extract-text-from-pdf", description: "Extract text from PDF" },
];

const howItWorks = [
  { title: "Open a PDF", description: "Drop your PDF — it is rendered in your browser with its real text made clickable." },
  { title: "Click & edit", description: "Click any word or line, change the text in the box, and press Enter." },
  { title: "Apply & download", description: "Click Apply — the text is replaced in place, keeping the original font and layout." },
];

const benefits = [
  "Click directly on existing text to edit it",
  "Keeps the original font, size and colour",
  "Edit multiple words across multiple pages",
  "Live preview of every pending change",
  "Rendered in your browser — file only sent on apply",
];

export default function EditPDFPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<{ downloadUrl: string; filename: string; count: number } | null>(null);

  const fileRef = useRef<File | null>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<{ destroy: () => Promise<void> } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const skipBlurRef = useRef(false);

  const renderPage = useCallback(async (n: number) => {
    const pdf = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;

    try {
      renderTaskRef.current?.cancel();
    } catch {
      /* ignore cancellation of an already-finished task */
    }

    const pdfjs = await getPdfjs();
    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const containerWidth = containerRef.current?.clientWidth || 760;
    const scale = Math.min(Math.max((containerWidth - 4) / base.width, 0.2), 3);
    const viewport = page.getViewport({ scale });
    const outputScale = window.devicePixelRatio || 1;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const task = page.render({
      canvas,
      canvasContext: ctx,
      viewport,
      transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
    });
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch (err) {
      if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "RenderingCancelledException") {
        return;
      }
      throw err;
    }

    // Build the clickable text layer from the PDF's real text content.
    const tc = await page.getTextContent();
    const cw = viewport.width;
    const ch = viewport.height;
    const items: TextItem[] = [];
    (tc.items as unknown[]).forEach((raw, idx) => {
      const it = raw as { str?: string; width?: number; transform?: number[] };
      const str = typeof it.str === "string" ? it.str : "";
      if (!str.trim() || !it.transform) return;
      const tx = pdfjs.Util.transform(viewport.transform, it.transform);
      const fontHeight = Math.hypot(tx[2], tx[3]) || Math.abs(tx[3]) || 10;
      const left = tx[4];
      const top = tx[5] - fontHeight;
      const width = (it.width || 0) * scale;
      if (width < 1) return;
      items.push({
        id: `${n}:${idx}`,
        page: n,
        left,
        top,
        width,
        height: fontHeight,
        str,
        fcx: (left + width / 2) / cw,
        fcy: (top + fontHeight / 2) / ch,
      });
    });
    setTextItems(items);
  }, []);

  const loadPdf = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      setResult(null);
      setEdits({});
      setEditingId(null);
      try {
        const pdfjs = await getPdfjs();
        const data = await file.arrayBuffer();
        try {
          renderTaskRef.current?.cancel();
        } catch {
          /* no-op */
        }
        await loadingTaskRef.current?.destroy().catch(() => {});
        const loadingTask = pdfjs.getDocument({ data });
        loadingTaskRef.current = loadingTask;
        const doc = await loadingTask.promise;
        pdfDocRef.current = doc;
        fileRef.current = file;
        setFileName(file.name);
        setNumPages(doc.numPages);
        setPageNum(1);
        requestAnimationFrame(() => {
          renderPage(1).catch(() => setError("Could not render this PDF."));
        });
      } catch (err) {
        const name = err && typeof err === "object" && "name" in err ? (err as { name: string }).name : "";
        if (name === "PasswordException") {
          setError("This PDF is password-protected. Remove the password with the Unlock PDF tool first.");
        } else {
          setError("Could not open this file. Make sure it is a valid PDF.");
        }
        pdfDocRef.current = null;
        setFileName(null);
        setNumPages(0);
      } finally {
        setLoading(false);
      }
    },
    [renderPage]
  );

  const goToPage = useCallback(
    (n: number) => {
      if (n < 1 || n > numPages) return;
      setEditingId(null);
      setPageNum(n);
      renderPage(n).catch(() => setError("Could not render this page."));
    },
    [numPages, renderPage]
  );

  // Re-render the current page on resize so the text layer stays aligned.
  useEffect(() => {
    if (!pdfDocRef.current) return;
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setEditingId(null);
        renderPage(pageNum).catch(() => {});
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [pageNum, renderPage]);

  useEffect(() => {
    return () => {
      loadingTaskRef.current?.destroy().catch(() => {});
    };
  }, []);

  const openEditor = (item: TextItem) => {
    setEditingId(item.id);
  };

  const commitEdit = (item: TextItem, value: string) => {
    setEdits((prev) => {
      const next = { ...prev };
      if (value === item.str) {
        delete next[item.id];
      } else {
        next[item.id] = {
          id: item.id,
          page: item.page,
          fcx: item.fcx,
          fcy: item.fcy,
          oldText: item.str,
          newText: value,
        };
      }
      return next;
    });
    setEditingId(null);
  };

  const removeEdit = (id: string) =>
    setEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const applyEdits = useCallback(async () => {
    const file = fileRef.current;
    const list = Object.values(edits);
    if (!file || list.length === 0) return;
    setApplying(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append(
        "edits",
        JSON.stringify(
          list.map((e) => ({
            page: e.page,
            fx: e.fcx,
            fy: e.fcy,
            old_text: e.oldText,
            new_text: e.newText,
          }))
        )
      );
      const res = await fetch("/api/edit-pdf-text", { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.detail || "Failed to edit PDF");
      }
      const data = await res.json();
      setResult({ downloadUrl: data.download_url, filename: data.filename, count: data.edits_applied });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setApplying(false);
    }
  }, [edits]);

  const reset = () => {
    try {
      renderTaskRef.current?.cancel();
    } catch {
      /* no-op */
    }
    loadingTaskRef.current?.destroy().catch(() => {});
    loadingTaskRef.current = null;
    fileRef.current = null;
    pdfDocRef.current = null;
    setFileName(null);
    setNumPages(0);
    setPageNum(1);
    setTextItems([]);
    setEdits({});
    setEditingId(null);
    setResult(null);
    setError(null);
  };

  const editList = Object.values(edits);
  const editCount = editList.length;

  return (
    <ToolPageLayout
      title="Edit PDF"
      description="Click on the existing text in your PDF and change it in place — keeping the original font, size and position. Rendered in your browser; nothing is uploaded until you apply."
      howItWorks={howItWorks}
      benefits={benefits}
      faqs={faqs}
      relatedTools={relatedTools}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8" ref={containerRef}>
        {result ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">PDF edited successfully!</h3>
            <p className="text-gray-400 mb-6">
              {result.count} {result.count === 1 ? "change was" : "changes were"} applied in place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={result.downloadUrl}
                download={result.filename}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download edited PDF
              </a>
              <button
                onClick={reset}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Edit another PDF
              </button>
            </div>
          </div>
        ) : !fileName ? (
          <>
            <FileUploadZone accept=".pdf" multiple={false} maxSizeMB={50} onFilesSelected={(files) => files[0] && loadPdf(files[0])}>
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="text-lg text-white mb-2">
                Drop a PDF here or <span className="text-blue-400">browse</span>
              </p>
              <p className="text-sm text-gray-500">Rendered in your browser · click the text to edit · up to 50MB</p>
            </FileUploadZone>
            {loading && (
              <p className="mt-4 text-center text-gray-400" aria-live="polite">
                Opening PDF…
              </p>
            )}
            {error && (
              <div className="mt-4 bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm" role="alert">
                {error}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(pageNum - 1)}
                  disabled={pageNum <= 1}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
                  aria-label="Previous page"
                >
                  ‹ Prev
                </button>
                <span className="text-sm text-gray-300 tabular-nums">
                  Page {pageNum} / {numPages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(pageNum + 1)}
                  disabled={pageNum >= numPages}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors"
                  aria-label="Next page"
                >
                  Next ›
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={applyEdits}
                  disabled={editCount === 0 || applying}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {applying ? "Applying…" : `Apply changes & Download${editCount ? ` (${editCount})` : ""}`}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                >
                  New file
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-3">
              Click any word or line to edit it. Edited text is highlighted; press{" "}
              <span className="text-gray-300">Enter</span> to confirm or <span className="text-gray-300">Esc</span> to cancel.
            </p>

            {/* Canvas + clickable text layer */}
            <div className="overflow-auto bg-gray-950 rounded-lg border border-gray-800 p-2 max-h-[72vh]">
              <div className="relative inline-block select-none" style={{ touchAction: "none" }}>
                <canvas ref={canvasRef} className="block" />
                <div className="absolute inset-0">
                  {textItems.map((item) => {
                    const ed = edits[item.id];
                    if (editingId === item.id) {
                      return (
                        <input
                          key={item.id}
                          autoFocus
                          defaultValue={edits[item.id]?.newText ?? item.str}
                          onFocus={(e) => e.currentTarget.select()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitEdit(item, e.currentTarget.value);
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              skipBlurRef.current = true;
                              setEditingId(null);
                            }
                          }}
                          onBlur={(e) => {
                            if (skipBlurRef.current) {
                              skipBlurRef.current = false;
                              return;
                            }
                            commitEdit(item, e.currentTarget.value);
                          }}
                          className="absolute z-10 bg-white text-black border border-blue-500 rounded px-1 outline-none"
                          style={{
                            left: item.left,
                            top: item.top,
                            width: Math.max(item.width + 60, 120),
                            height: Math.max(item.height + 4, 22),
                            fontSize: Math.max(9, Math.min(item.height * 0.85, 20)),
                          }}
                        />
                      );
                    }
                    return (
                      <div
                        key={item.id}
                        onClick={() => openEditor(item)}
                        title={ed ? `Changed to: ${ed.newText}` : `Click to edit: ${item.str}`}
                        className={`absolute cursor-text ${
                          ed ? "" : "hover:bg-blue-400/20 hover:outline hover:outline-1 hover:outline-blue-400/70"
                        }`}
                        style={{ left: item.left, top: item.top, width: item.width, height: item.height }}
                      >
                        {ed && (
                          <div
                            className="absolute -inset-y-px -left-px flex items-center bg-yellow-200 text-black rounded-sm ring-1 ring-yellow-500 overflow-hidden whitespace-nowrap px-0.5"
                            style={{
                              minWidth: item.width + 2,
                              height: item.height + 2,
                              fontSize: Math.max(7, Math.min(item.height * 0.82, 20)),
                              lineHeight: `${item.height}px`,
                            }}
                          >
                            {ed.newText || " "}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm" role="alert">
                {error}
              </div>
            )}

            {/* Pending changes */}
            {editCount > 0 && (
              <div className="mt-6 bg-gray-950 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white">
                    Pending changes <span className="text-gray-500">({editCount})</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setEdits({})}
                    className="text-xs text-gray-400 hover:text-red-400"
                  >
                    Clear all
                  </button>
                </div>
                <ul className="space-y-2 max-h-48 overflow-auto">
                  {editList.map((e) => (
                    <li key={e.id} className="flex items-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => goToPage(e.page)}
                        className="text-xs text-gray-500 hover:text-blue-400 shrink-0 w-12 text-left"
                        title="Go to page"
                      >
                        p.{e.page}
                      </button>
                      <span className="text-gray-500 line-through truncate max-w-[35%]">{e.oldText}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-green-300 truncate flex-1">{e.newText || "(empty)"}</span>
                      <button
                        type="button"
                        onClick={() => removeEdit(e.id)}
                        className="p-1 text-gray-500 hover:text-red-400 shrink-0"
                        aria-label="Remove change"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </ToolPageLayout>
  );
}
