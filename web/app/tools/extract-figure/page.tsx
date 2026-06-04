"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";
import { useAuth, shouldShowAds } from "../../lib/auth";
import type { PDFDocumentProxy } from "pdfjs-dist";

// Lazy-load pdf.js only in the browser (it touches DOMMatrix/Worker, so it must
// never run during SSR). The worker is self-hosted at /pdf.worker.min.mjs
// (copied from node_modules by scripts/copy-pdf-worker.mjs on pre(dev|build)),
// so it is same-origin + always version-matched — no CDN, CSP-friendly.
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

interface Selection {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_SELECTION_PX = 6;

const faqs = [
  {
    question: "How is this different from 'PDF to JPG'?",
    answer:
      "PDF to JPG renders whole pages. This tool lets you draw a box around just one figure, chart, table or drawing and export only that region as an image — including vector drawings that 'extract images' tools miss.",
  },
  {
    question: "Is my PDF uploaded to a server?",
    answer:
      "The free, screen-resolution export runs entirely in your browser — your file never leaves your device. High-DPI export (Pro) sends the file to our server to render it at full resolution, then removes it.",
  },
  {
    question: "What resolution is the exported image?",
    answer:
      "The free export uses your screen resolution. Pro plans can export the selected region at 300, 600 or 1200 DPI — crisp enough for print or slides. Pro also adds batch extraction (the same region across a page range, downloaded as a ZIP) and OCR of the selected region (recognise its text).",
  },
  {
    question: "Does it work with scanned or password-protected PDFs?",
    answer:
      "Scanned PDFs work (you snip the rendered page). Password-protected PDFs are not supported in the free tool — remove the password first with the Unlock PDF tool.",
  },
];

const relatedTools = [
  { name: "PDF to JPG", href: "/tools/pdf-to-jpg", description: "Convert whole PDF pages to images" },
  { name: "Crop PDF", href: "/tools/crop-pdf", description: "Trim page margins across a PDF" },
  { name: "Extract Pages", href: "/tools/extract-pages", description: "Pull selected pages into a new PDF" },
];

const benefits = [
  "Snip any figure, chart or drawing — not whole pages",
  "Captures vector drawings, not just embedded photos",
  "100% in your browser — nothing is uploaded",
  "Private and instant, no registration",
  "Export the selected region as a PNG",
  "Works on any device",
];

const howItWorks = [
  { title: "Open a PDF", description: "Drop your PDF — it is rendered right in your browser, never uploaded." },
  { title: "Draw a Box", description: "Drag a rectangle around the figure or region you want to keep." },
  { title: "Download PNG", description: "Export just that region as a PNG image with one click." },
];

export default function ExtractFigurePage() {
  const { user, getToken } = useAuth();
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [sel, setSel] = useState<Selection | null>(null);
  const [dpi, setDpi] = useState(300);
  // Output options ("Extra"): raster format + transparent bg + auto-trim border.
  const [fmt, setFmt] = useState<"png" | "tiff" | "svg">("png");
  const [transparent, setTransparent] = useState(false);
  const [trim, setTrim] = useState(false);
  const [hiExporting, setHiExporting] = useState(false);
  const [upsell, setUpsell] = useState<string | null>(null);
  // Batch (same region across a page range → ZIP) + OCR (text of the region).
  const [batchAll, setBatchAll] = useState(true);
  const [batchFrom, setBatchFrom] = useState(1);
  const [batchTo, setBatchTo] = useState(1);
  const [batchExporting, setBatchExporting] = useState(false);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [ocrCopied, setOcrCopied] = useState(false);

  const fileRef = useRef<File | null>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<{ destroy: () => Promise<void> } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const outputScaleRef = useRef(1);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  // Tracks the in-flight pdf.js render so a fast page switch can cancel the
  // previous render instead of letting two writes race onto the same canvas.
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const clampToCanvas = (x: number, y: number) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(x - rect.left, rect.width)),
      y: Math.max(0, Math.min(y - rect.top, rect.height)),
    };
  };

  const renderPage = useCallback(async (n: number) => {
    const pdf = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;

    try {
      renderTaskRef.current?.cancel();
    } catch {
      // ignore cancellation of an already-finished task
    }

    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const containerWidth = containerRef.current?.clientWidth || 760;
    // Fit the page width to the container (with a little breathing room),
    // clamped so tiny/huge pages stay usable.
    const scale = Math.min(Math.max((containerWidth - 4) / base.width, 0.2), 4);
    const viewport = page.getViewport({ scale });
    const outputScale = window.devicePixelRatio || 1;
    outputScaleRef.current = outputScale;

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
      // RenderingCancelledException is expected when switching pages quickly.
      if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "RenderingCancelledException") {
        return;
      }
      throw err;
    }
  }, []);

  const loadPdf = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      setSel(null);
      try {
        const pdfjs = await getPdfjs();
        const data = await file.arrayBuffer();
        // Cancel any in-flight render + tear down the previous document before
        // swapping, so a slow render of the old PDF can't write onto the new
        // canvas after the worker is replaced.
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
        setBatchFrom(1);
        setBatchTo(doc.numPages);
        setBatchAll(true);
        setOcrText(null);
        // Wait a tick so the canvas is mounted before the first render.
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
      setSel(null);
      setOcrText(null);
      setPageNum(n);
      renderPage(n).catch(() => setError("Could not render this page."));
    },
    [numPages, renderPage]
  );

  // Re-render the current page when the container is resized so the canvas
  // stays responsive. Selection is cleared because its coordinates are tied
  // to the previous render size.
  useEffect(() => {
    if (!pdfDocRef.current) return;
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setSel(null);
        renderPage(pageNum).catch(() => {});
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [pageNum, renderPage]);

  // Clean up the pdf.js document on unmount to free worker resources.
  useEffect(() => {
    return () => {
      loadingTaskRef.current?.destroy().catch(() => {});
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!pdfDocRef.current) return;
    e.preventDefault();
    try {
      overlayRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    const p = clampToCanvas(e.clientX, e.clientY);
    dragStartRef.current = p;
    setSel({ x: p.x, y: p.y, w: 0, h: 0 });
    // The previous OCR text belonged to the previous selection — drop it.
    setOcrText(null);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const start = dragStartRef.current;
    if (!start) return;
    const p = clampToCanvas(e.clientX, e.clientY);
    setSel({
      x: Math.min(start.x, p.x),
      y: Math.min(start.y, p.y),
      w: Math.abs(p.x - start.x),
      h: Math.abs(p.y - start.y),
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    dragStartRef.current = null;
    try {
      overlayRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    setSel((cur) => (cur && cur.w >= MIN_SELECTION_PX && cur.h >= MIN_SELECTION_PX ? cur : null));
  };

  const exportPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sel || sel.w < MIN_SELECTION_PX || sel.h < MIN_SELECTION_PX) return;
    const os = outputScaleRef.current;
    const sx = Math.max(0, Math.round(sel.x * os));
    const sy = Math.max(0, Math.round(sel.y * os));
    // Clamp the source rect to the canvas so rounding can never read past the
    // backing-store edge (which would paint a transparent strip into the PNG).
    const sw = Math.min(Math.round(sel.w * os), canvas.width - sx);
    const sh = Math.min(Math.round(sel.h * os), canvas.height - sy);
    if (sw <= 0 || sh <= 0) return;

    const out = document.createElement("canvas");
    out.width = sw;
    out.height = sh;
    const octx = out.getContext("2d");
    if (!octx) return;
    octx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);

    out.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = (fileName || "figure").replace(/\.pdf$/i, "");
      a.href = url;
      a.download = `${base}-p${pageNum}-figure.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [sel, fileName, pageNum]);

  // Builds the FormData common to all Advanced (Pro) endpoints: the file plus
  // the selection as page fractions (0..1, top-left origin) so the backend maps
  // it onto fitz page.rect without coordinate-system guesswork. Returns null
  // when there is no usable selection. Callers add page/dpi/range as needed.
  const buildRegionForm = useCallback((): FormData | null => {
    const canvas = canvasRef.current;
    const file = fileRef.current;
    if (!canvas || !file || !sel || sel.w < MIN_SELECTION_PX || sel.h < MIN_SELECTION_PX) return null;
    const cw = canvas.clientWidth || 1;
    const ch = canvas.clientHeight || 1;
    const clamp01 = (v: number) => Math.max(0, Math.min(v, 1));
    const form = new FormData();
    form.append("file", file);
    form.append("fx0", String(clamp01(sel.x / cw)));
    form.append("fy0", String(clamp01(sel.y / ch)));
    form.append("fx1", String(clamp01((sel.x + sel.w) / cw)));
    form.append("fy1", String(clamp01((sel.y + sel.h) / ch)));
    return form;
  }, [sel]);

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Advanced (Pro): server-side high-DPI render of the selected region.
  const exportHighDpi = useCallback(async () => {
    const form = buildRegionForm();
    if (!form) return;
    if (!user) {
      setUpsell("Sign in with a Pro plan to export high-DPI images.");
      return;
    }
    form.append("page", String(pageNum));
    // SVG is a vector export with its own endpoint (no dpi / raster options).
    const isSvg = fmt === "svg";
    if (!isSvg) {
      form.append("dpi", String(dpi));
      form.append("fmt", fmt);
      form.append("transparent", String(transparent));
      form.append("trim", String(trim));
    }

    setUpsell(null);
    setError(null);
    setHiExporting(true);
    try {
      const token = getToken();
      // Same-origin relative path: nginx routes /api/* to the Python backend.
      const res = await fetch(isSvg ? "/api/extract-region-svg" : "/api/extract-region", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (res.status === 401) {
        setUpsell("Your session expired. Please sign in again.");
        return;
      }
      if (res.status === 403) {
        setUpsell("High-DPI export is a Pro feature — upgrade your plan to unlock it.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "High-DPI export failed. Please try again.");
      }
      const base = (fileName || "figure").replace(/\.pdf$/i, "");
      const ext = isSvg ? "svg" : fmt === "tiff" ? "tiff" : "png";
      const tag = isSvg ? "vector" : `${dpi}dpi`;
      downloadBlob(await res.blob(), `${base}-p${pageNum}-figure-${tag}.${ext}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "High-DPI export failed.");
    } finally {
      setHiExporting(false);
    }
  }, [buildRegionForm, user, getToken, pageNum, dpi, fmt, transparent, trim, fileName]);

  // Advanced (Pro): apply the same region to a page range → ZIP of PNGs.
  const exportBatch = useCallback(async () => {
    const form = buildRegionForm();
    if (!form) return;
    if (!user) {
      setUpsell("Sign in with a Pro plan to batch-extract figures.");
      return;
    }
    // Clearing a number input yields NaN — coerce to a valid page so we never
    // POST "NaN" (which the backend would reject with a 422).
    const clampPage = (v: number) => (Number.isFinite(v) ? Math.max(1, Math.min(Math.round(v), numPages)) : 1);
    const from = batchAll ? 1 : clampPage(batchFrom);
    const to = batchAll ? numPages : Math.max(from, clampPage(batchTo));
    // Batch is raster-only — SVG has no ZIP variant, so fall back to PNG.
    const rasterFmt = fmt === "svg" ? "png" : fmt;
    form.append("dpi", String(dpi));
    form.append("page_from", String(from));
    form.append("page_to", String(to));
    form.append("fmt", rasterFmt);
    form.append("transparent", String(transparent));
    form.append("trim", String(trim));

    setUpsell(null);
    setError(null);
    setBatchExporting(true);
    try {
      const token = getToken();
      const res = await fetch("/api/extract-region-batch", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (res.status === 401) {
        setUpsell("Your session expired. Please sign in again.");
        return;
      }
      if (res.status === 403) {
        setUpsell("Batch extraction is a Pro feature — upgrade your plan to unlock it.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Batch extraction failed. Please try again.");
      }
      const base = (fileName || "figure").replace(/\.pdf$/i, "");
      downloadBlob(await res.blob(), `${base}-figures-${dpi}dpi-${rasterFmt}.zip`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch extraction failed.");
    } finally {
      setBatchExporting(false);
    }
  }, [buildRegionForm, user, getToken, batchAll, batchFrom, batchTo, numPages, dpi, fmt, transparent, trim, fileName]);

  // Advanced (Pro): OCR the selected region → recognised text.
  const runOcr = useCallback(async () => {
    const form = buildRegionForm();
    if (!form) return;
    if (!user) {
      setUpsell("Sign in with a Pro plan to OCR a region.");
      return;
    }
    form.append("page", String(pageNum));
    form.append("dpi", String(dpi));

    setUpsell(null);
    setError(null);
    setOcrText(null);
    setOcrCopied(false);
    setOcrRunning(true);
    try {
      const token = getToken();
      const res = await fetch("/api/extract-region-ocr", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (res.status === 401) {
        setUpsell("Your session expired. Please sign in again.");
        return;
      }
      if (res.status === 403) {
        setUpsell("Region OCR is a Pro feature — upgrade your plan to unlock it.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "OCR failed. Please try again.");
      }
      const data = await res.json();
      setOcrText(typeof data?.text === "string" ? data.text : "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR failed.");
    } finally {
      setOcrRunning(false);
    }
  }, [buildRegionForm, user, getToken, pageNum, dpi]);

  const copyOcr = useCallback(async () => {
    if (!ocrText) return;
    try {
      await navigator.clipboard.writeText(ocrText);
      setOcrCopied(true);
      setTimeout(() => setOcrCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; the text stays selectable in the box */
    }
  }, [ocrText]);

  const reset = () => {
    try {
      renderTaskRef.current?.cancel();
    } catch {
      /* no-op */
    }
    loadingTaskRef.current?.destroy().catch(() => {});
    loadingTaskRef.current = null;
    fileRef.current = null;
    setUpsell(null);
    pdfDocRef.current = null;
    setFileName(null);
    setNumPages(0);
    setPageNum(1);
    setSel(null);
    setError(null);
    setOcrText(null);
    setBatchAll(true);
    setBatchFrom(1);
    setBatchTo(1);
  };

  const hasSelection = !!sel && sel.w >= MIN_SELECTION_PX && sel.h >= MIN_SELECTION_PX;
  // Paid tiers (any plan that suppresses ads) get the high-DPI controls; the
  // server is still the source of truth and returns 403 if the tier lacks it.
  const isPro = !!user && !shouldShowAds(user);

  return (
    <ToolPageLayout
      title="Extract Figure from PDF"
      description="Draw a box around any figure, chart, diagram or drawing in a PDF and export just that region as a PNG image — entirely in your browser, nothing uploaded."
      howItWorks={howItWorks}
      benefits={benefits}
      faqs={faqs}
      relatedTools={relatedTools}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8" ref={containerRef}>
        {!fileName ? (
          <>
            <FileUploadZone accept=".pdf" multiple={false} maxSizeMB={100} onFilesSelected={(files) => files[0] && loadPdf(files[0])}>
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z M8 8h8v8H8z" />
                </svg>
              </div>
              <p className="text-lg text-white mb-2">
                Drop a PDF here or <span className="text-blue-400">browse</span>
              </p>
              <p className="text-sm text-gray-500">Rendered in your browser — never uploaded · up to 100MB</p>
            </FileUploadZone>
            {loading && <p className="mt-4 text-center text-gray-400" aria-live="polite">Opening PDF…</p>}
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
                  onClick={exportPng}
                  disabled={!hasSelection}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Export region as PNG
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
              {hasSelection
                ? "Region selected. Click “Export region as PNG”, or drag a new box to reselect."
                : "Drag a box around the figure you want to extract."}
            </p>

            {/* Canvas + selection overlay */}
            <div className="overflow-auto bg-gray-950 rounded-lg border border-gray-800 p-2">
              <div className="relative inline-block select-none" style={{ touchAction: "none" }}>
                <canvas ref={canvasRef} className="block" />
                <div
                  ref={overlayRef}
                  className="absolute inset-0 cursor-crosshair"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                >
                  {sel && (
                    <div
                      className="absolute border-2 border-blue-400 bg-blue-400/20 pointer-events-none"
                      style={{ left: sel.x, top: sel.y, width: sel.w, height: sel.h }}
                    />
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm" role="alert">
                {error}
              </div>
            )}

            {/* High-DPI (Pro) — server-side render of the same region at 300-1200 DPI */}
            <div className="mt-6 bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    High-DPI export <span className="text-yellow-400">Pro</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    The button above exports at screen resolution. Get a crisp 300–1200 DPI render — or a true vector SVG, with optional transparent background and auto-trim.
                  </p>
                </div>
                {isPro ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <label htmlFor="fig-fmt" className="sr-only">Format</label>
                    <select
                      id="fig-fmt"
                      value={fmt}
                      onChange={(e) => setFmt(e.target.value as "png" | "tiff" | "svg")}
                      className="bg-gray-800 border border-gray-700 rounded-lg text-white text-sm px-3 py-2"
                    >
                      <option value="png">PNG</option>
                      <option value="tiff">TIFF</option>
                      <option value="svg">SVG (vector)</option>
                    </select>
                    {fmt !== "svg" && (
                      <>
                        <label htmlFor="hi-dpi" className="sr-only">Resolution</label>
                        <select
                          id="hi-dpi"
                          value={dpi}
                          onChange={(e) => setDpi(Number(e.target.value))}
                          className="bg-gray-800 border border-gray-700 rounded-lg text-white text-sm px-3 py-2"
                        >
                          <option value={300}>300 DPI</option>
                          <option value={600}>600 DPI</option>
                          <option value={1200}>1200 DPI</option>
                        </select>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={exportHighDpi}
                      disabled={!hasSelection || hiExporting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {hiExporting ? "Rendering…" : fmt === "svg" ? "Export SVG (vector)" : `Export ${fmt.toUpperCase()}`}
                    </button>
                  </div>
                ) : user ? (
                  <Link
                    href="/pricing"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    Upgrade to unlock
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    Sign in for high-DPI
                  </Link>
                )}
              </div>

              {/* Output options (Pro): transparent background + auto-trim — raster only */}
              {isPro && fmt !== "svg" && (
                <div className="mt-3 flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-1.5 text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={transparent}
                      onChange={(e) => setTransparent(e.target.checked)}
                      className="accent-blue-600"
                    />
                    Transparent background
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={trim}
                      onChange={(e) => setTrim(e.target.checked)}
                      className="accent-blue-600"
                    />
                    Auto-trim margins
                  </label>
                </div>
              )}

              {/* Batch + OCR — available to Pro tiers; the server re-checks the plan */}
              {isPro && (
                <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                  {/* Batch: same region across a page range → ZIP */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">Batch — same region across pages</p>
                      <p className="text-xs text-gray-400">
                        Apply this exact selection to a page range and download a ZIP of images (at the DPI/format above; SVG falls back to PNG for batch).
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="flex items-center gap-1.5 text-xs text-gray-300">
                        <input
                          type="checkbox"
                          checked={batchAll}
                          onChange={(e) => setBatchAll(e.target.checked)}
                          className="accent-blue-600"
                        />
                        All pages
                      </label>
                      {!batchAll && (
                        <div className="flex items-center gap-1 text-xs text-gray-300">
                          <input
                            type="number"
                            min={1}
                            max={numPages}
                            value={batchFrom}
                            onChange={(e) => setBatchFrom(Number(e.target.value))}
                            className="w-16 bg-gray-800 border border-gray-700 rounded-lg text-white px-2 py-1.5"
                            aria-label="From page"
                          />
                          <span>–</span>
                          <input
                            type="number"
                            min={1}
                            max={numPages}
                            value={batchTo}
                            onChange={(e) => setBatchTo(Number(e.target.value))}
                            className="w-16 bg-gray-800 border border-gray-700 rounded-lg text-white px-2 py-1.5"
                            aria-label="To page"
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={exportBatch}
                        disabled={!hasSelection || batchExporting}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {batchExporting ? "Extracting…" : "Export batch (ZIP)"}
                      </button>
                    </div>
                  </div>

                  {/* OCR: recognise the text inside the region */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">OCR — read text in the region</p>
                      <p className="text-xs text-gray-400">
                        Recognise the text inside your selection — a figure caption, label or table cell.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={runOcr}
                      disabled={!hasSelection || ocrRunning}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {ocrRunning ? "Reading…" : "Extract text (OCR)"}
                    </button>
                  </div>

                  {ocrText !== null && (
                    <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Recognised text</span>
                        <button
                          type="button"
                          onClick={copyOcr}
                          disabled={!ocrText}
                          className="text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-600"
                        >
                          {ocrCopied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <textarea
                        readOnly
                        value={ocrText || ""}
                        placeholder="No text was found in this region."
                        rows={Math.min(8, Math.max(2, (ocrText || "").split("\n").length))}
                        className="w-full bg-transparent text-sm text-gray-200 resize-y outline-none placeholder:text-gray-600"
                      />
                    </div>
                  )}
                </div>
              )}

              {upsell && (
                <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-sm">
                  <span className="text-yellow-300">{upsell}</span>
                  <Link href="/pricing" className="text-blue-400 hover:text-blue-300 whitespace-nowrap">
                    View plans →
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ToolPageLayout>
  );
}
