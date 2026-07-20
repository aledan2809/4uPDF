"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";
import { usePendingFiles } from "../../lib/pendingFile";
import NextSteps from "../../components/NextSteps";
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

// Overlay editor (add / cover) — for scanned PDFs with no clickable text layer.
type OverlayType = "text" | "cover" | "image";
interface Overlay {
  id: string;
  type: OverlayType;
  page: number;
  fx: number; // top-left fraction
  fy: number;
  fw: number; // width fraction
  fh: number; // height fraction (cover/image; text auto-sizes but stores a hint)
  text?: string;
  sizePt?: number; // text size in PDF points (scale-independent)
  color?: string; // text: hex; cover: "auto" | hex
  dataUrl?: string; // image
}

type Mode = "text" | "overlay";
type Tool = "select" | "text" | "cover";

const TEXT_COLORS = ["#111111", "#c0392b", "#1d6fb8", "#1e8449"];
const COVER_CHOICES: { key: string; label: string; swatch: string }[] = [
  { key: "#ffffff", label: "Alb", swatch: "#ffffff" },
  { key: "auto", label: "Potrivește fundalul", swatch: "linear-gradient(135deg,#eee,#cfc9bd)" },
];

const faqs = [
  {
    question: "Documentul meu e scanat (o poză) — pot să-l editez?",
    answer:
      "Da. Când PDF-ul e scanat, unealta trece automat pe modul „Adaugă / acoperă”: pui casete de text noi oriunde pe pagină, iar ca să „modifici” ceva existent tragi o casetă peste vechiul conținut și scrii deasupra. La final descarci PDF-ul cu totul aplicat.",
  },
  {
    question: "How do I edit existing text in a PDF?",
    answer:
      "If your PDF has a real text layer, stay in „Editează text”: click on any word and change it in place, keeping the same font, size and position. If the PDF is scanned, use „Adaugă / acoperă” instead.",
  },
  {
    question: "Ce înseamnă „acoperă un câmp”?",
    answer:
      "Pe un scan textul e o imagine, nu se poate rescrie „în text”. Așa că desenezi o casetă (albă sau potrivită pe fundal) peste vechea valoare, apoi pui o casetă de text deasupra cu noua valoare. Rezultatul arată curat.",
  },
  {
    question: "Se păstrează diacriticele românești?",
    answer: "Da — textul adăugat folosește un font Unicode, deci ă, â, î, ș, ț apar corect.",
  },
  {
    question: "Is my file uploaded?",
    answer:
      "The page is rendered entirely in your browser. Your file is only sent to the server when you click Save, and it is removed after processing.",
  },
];

const relatedTools = [
  { name: "Sign PDF", href: "/tools/sign-pdf", description: "Add a signature to your PDF" },
  { name: "Watermark PDF", href: "/tools/watermark-pdf", description: "Add watermarks to your PDF" },
  { name: "Searchable PDF (OCR)", href: "/tools/split-ocr", description: "Make a scan searchable" },
];

const howItWorks = [
  { title: "Open a PDF", description: "Drop your PDF anywhere on the page — it is rendered in your browser." },
  { title: "Edit or add", description: "Click existing text to change it, or add / cover boxes on a scan." },
  { title: "Save & download", description: "Click Save — your changes are applied and the file downloads." },
];

const benefits = [
  "Works on scanned PDFs — add text or cover boxes anywhere",
  "Also edits real text in place, keeping the original font",
  "Cover an old value and write the new one on top",
  "Romanian diacritics render correctly",
  "Rendered in your browser — file only sent on save",
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

  // Overlay-mode state
  const [mode, setMode] = useState<Mode>("text");
  const [tool, setTool] = useState<Tool>("select");
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [textColor, setTextColor] = useState<string>(TEXT_COLORS[0]);
  const [textSizePt, setTextSizePt] = useState<number>(14);
  const [coverColor, setCoverColor] = useState<string>("#ffffff");
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [renderScale, setRenderScale] = useState<number>(1);
  const [draft, setDraft] = useState<{ fx: number; fy: number; fw: number; fh: number } | null>(null);

  const fileRef = useRef<File | null>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<{ destroy: () => Promise<void> } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayLayerRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const skipBlurRef = useRef(false);
  const editBaselineRef = useRef<Edit | undefined>(undefined);
  const modeRef = useRef<Mode>("text");
  const lastLoadAtRef = useRef<number>(0);
  const dragRef = useRef<
    | null
    | { kind: "draw"; startFx: number; startFy: number }
    | { kind: "move"; id: string; startFx: number; startFy: number; ox: number; oy: number }
    | { kind: "resize"; id: string; startFw: number; startFh: number; ox: number; oy: number; text: boolean }
  >(null);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

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
    setCanvasSize({ w: Math.floor(viewport.width), h: Math.floor(viewport.height) });
    setRenderScale(scale);

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
      lastLoadAtRef.current = Date.now();
      setError(null);
      setLoading(true);
      setResult(null);
      setEdits({});
      setEditingId(null);
      setOverlays([]);
      setSelectedId(null);
      setEditingOverlayId(null);
      setTool("select");
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

        // Detect a scanned/image PDF (no real text layer) → default to overlay mode
        // so the user can add / cover content instead of clicking non-existent text.
        let hasText = false;
        try {
          const probePages = Math.min(doc.numPages, 3);
          for (let p = 1; p <= probePages && !hasText; p++) {
            const pg = await doc.getPage(p);
            const tc = await pg.getTextContent();
            hasText = (tc.items as unknown[]).some(
              (raw) => typeof (raw as { str?: string }).str === "string" && (raw as { str: string }).str.trim().length > 0
            );
          }
        } catch {
          hasText = true; // if probing fails, keep the classic text editor
        }
        setMode(hasText ? "text" : "overlay");

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

  // File-first entry: pick up a file stashed by the homepage dropzone.
  usePendingFiles((files) => {
    if (files[0]) loadPdf(files[0]);
  });

  // Catch a PDF dropped ANYWHERE on the page (not just inside the small zone),
  // and stop the browser from opening the file in a new tab on a near-miss drop.
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.files?.length) return;
      e.preventDefault();
      if (result) return; // don't hijack while showing the success screen
      // If the drop landed inside the upload zone, its own handler already loaded
      // the file (React's synthetic handler runs before this window listener) —
      // skip to avoid a double load.
      if (Date.now() - lastLoadAtRef.current < 800) return;
      const f = Array.from(e.dataTransfer.files).find((x) => x.type === "application/pdf" || x.name.toLowerCase().endsWith(".pdf"));
      if (f) loadPdf(f);
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [loadPdf, result]);

  const goToPage = useCallback(
    (n: number) => {
      if (n < 1 || n > numPages) return;
      setEditingId(null);
      setSelectedId(null);
      setEditingOverlayId(null);
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

  // ------- text-layer edit handlers (classic mode) -------
  const openEditor = (item: TextItem) => {
    editBaselineRef.current = edits[item.id];
    setEditingId(item.id);
  };

  const syncEdit = (item: TextItem, value: string) => {
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
  };

  const commitEdit = (item: TextItem, value: string) => {
    syncEdit(item, value);
    setEditingId(null);
  };

  const cancelEdit = (item: TextItem) => {
    setEdits((prev) => {
      const next = { ...prev };
      if (editBaselineRef.current) next[item.id] = editBaselineRef.current;
      else delete next[item.id];
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

  // ------- overlay handlers (scanned mode) -------
  const pointerToFraction = (clientX: number, clientY: number) => {
    const layer = overlayLayerRef.current;
    if (!layer) return { fx: 0, fy: 0 };
    const r = layer.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return { fx: 0, fy: 0 };
    return {
      fx: Math.min(Math.max((clientX - r.left) / r.width, 0), 1),
      fy: Math.min(Math.max((clientY - r.top) / r.height, 0), 1),
    };
  };

  const updateOverlay = (id: string, patch: Partial<Overlay>) =>
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const removeOverlay = (id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    setSelectedId((s) => (s === id ? null : s));
    setEditingOverlayId((s) => (s === id ? null : s));
  };

  const addTextOverlay = (fx: number, fy: number) => {
    const id = `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    setOverlays((prev) => [
      ...prev,
      { id, type: "text", page: pageNum, fx, fy, fw: 0.35, fh: 0.05, text: "", sizePt: textSizePt, color: textColor },
    ]);
    setSelectedId(id);
    setEditingOverlayId(id);
    setTool("select");
  };

  const onLayerPointerDown = (e: React.PointerEvent) => {
    if (mode !== "overlay") return;
    // Only react to clicks on the empty layer, not on an existing overlay.
    if (e.target !== overlayLayerRef.current) return;
    setSelectedId(null);
    setEditingOverlayId(null);
    const { fx, fy } = pointerToFraction(e.clientX, e.clientY);
    if (tool === "text") {
      addTextOverlay(fx, fy);
      return;
    }
    if (tool === "cover") {
      e.preventDefault();
      overlayLayerRef.current?.setPointerCapture(e.pointerId);
      dragRef.current = { kind: "draw", startFx: fx, startFy: fy };
      setDraft({ fx, fy, fw: 0, fh: 0 });
    }
  };

  const onLayerPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const { fx, fy } = pointerToFraction(e.clientX, e.clientY);
    if (d.kind === "draw") {
      const x = Math.min(d.startFx, fx);
      const y = Math.min(d.startFy, fy);
      setDraft({ fx: x, fy: y, fw: Math.abs(fx - d.startFx), fh: Math.abs(fy - d.startFy) });
    } else if (d.kind === "move") {
      updateOverlay(d.id, {
        fx: Math.min(Math.max(d.startFx + (fx - d.ox), 0), 1),
        fy: Math.min(Math.max(d.startFy + (fy - d.oy), 0), 1),
      });
    } else if (d.kind === "resize") {
      const nfw = Math.min(Math.max(d.startFw + (fx - d.ox), 0.02), 1);
      if (d.text) {
        updateOverlay(d.id, { fw: nfw });
      } else {
        const nfh = Math.min(Math.max(d.startFh + (fy - d.oy), 0.01), 1);
        updateOverlay(d.id, { fw: nfw, fh: nfh });
      }
    }
  };

  const onLayerPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    try {
      overlayLayerRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
    if (d?.kind === "draw" && draft) {
      if (draft.fw > 0.01 && draft.fh > 0.008) {
        const id = `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        setOverlays((prev) => [
          ...prev,
          { id, type: "cover", page: pageNum, fx: draft.fx, fy: draft.fy, fw: draft.fw, fh: draft.fh, color: coverColor },
        ]);
        setSelectedId(id);
        setTool("select");
      }
      setDraft(null);
    }
  };

  const startMove = (e: React.PointerEvent, o: Overlay) => {
    if (editingOverlayId === o.id) return; // let the textarea receive the click
    e.stopPropagation();
    setSelectedId(o.id);
    const { fx, fy } = pointerToFraction(e.clientX, e.clientY);
    dragRef.current = { kind: "move", id: o.id, startFx: o.fx, startFy: o.fy, ox: fx, oy: fy };
    overlayLayerRef.current?.setPointerCapture(e.pointerId);
  };

  const startResize = (e: React.PointerEvent, o: Overlay) => {
    e.stopPropagation();
    setSelectedId(o.id);
    const { fx, fy } = pointerToFraction(e.clientX, e.clientY);
    dragRef.current = { kind: "resize", id: o.id, startFw: o.fw, startFh: o.fh, ox: fx, oy: fy, text: o.type === "text" };
    overlayLayerRef.current?.setPointerCapture(e.pointerId);
  };

  const onImagePicked = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const img = new Image();
      img.onload = () => {
        const aspect = img.naturalHeight / (img.naturalWidth || 1);
        const fw = 0.25;
        // keep on-screen aspect: fh(frac) = fw(frac) * (canvasW/canvasH) * (natH/natW)
        const fh =
          canvasSize.w && canvasSize.h ? Math.min(fw * (canvasSize.w / canvasSize.h) * aspect, 0.6) : 0.12;
        const id = `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        setOverlays((prev) => [
          ...prev,
          { id, type: "image", page: pageNum, fx: 0.38, fy: 0.42, fw, fh, dataUrl },
        ]);
        setSelectedId(id);
        setTool("select");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const applyOverlays = useCallback(async () => {
    const file = fileRef.current;
    const usable = overlays.filter((o) => (o.type === "text" ? (o.text || "").trim() !== "" : true));
    if (!file || usable.length === 0) return;
    setApplying(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append(
        "elements",
        JSON.stringify(
          usable.map((o) => {
            if (o.type === "text") {
              return { type: "text", page: o.page, fx: o.fx, fy: o.fy, fw: o.fw, text: o.text, size: o.sizePt, color: o.color };
            }
            if (o.type === "cover") {
              return { type: "cover", page: o.page, fx: o.fx, fy: o.fy, fw: o.fw, fh: o.fh, color: o.color };
            }
            return { type: "image", page: o.page, fx: o.fx, fy: o.fy, fw: o.fw, fh: o.fh, data: o.dataUrl };
          })
        )
      );
      const res = await fetch("/api/edit-pdf-overlay", { method: "POST", body: form });
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
  }, [overlays]);

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
    setOverlays([]);
    setSelectedId(null);
    setEditingOverlayId(null);
    setTool("select");
    setResult(null);
    setError(null);
  };

  const editList = Object.values(edits);
  const editCount = editList.length;
  const overlayUsable = overlays.filter((o) => (o.type === "text" ? (o.text || "").trim() !== "" : true));
  const overlayCount = overlayUsable.length;
  const selected = overlays.find((o) => o.id === selectedId) || null;
  const canSave = mode === "text" ? editCount > 0 : overlayCount > 0;
  const pageOverlays = overlays.filter((o) => o.page === pageNum);

  return (
    <ToolPageLayout
      title="Edit PDF"
      description="Edit the text in your PDF in place, or — for scanned files — add new text and cover boxes anywhere on the page. Rendered in your browser; nothing is uploaded until you save."
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
              {result.count} {result.count === 1 ? "change was" : "changes were"} applied.
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
            <NextSteps tool="edit" />
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
              <p className="text-sm text-gray-500">Rendered in your browser · edit text or add to a scan · up to 50MB</p>
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
            {/* Mode switch */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setMode("text");
                    setSelectedId(null);
                    setEditingOverlayId(null);
                  }}
                  className={`px-3 py-2 text-sm transition-colors ${mode === "text" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                >
                  Editează text existent
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("overlay");
                    setEditingId(null);
                  }}
                  className={`px-3 py-2 text-sm transition-colors ${mode === "overlay" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                >
                  Adaugă / acoperă
                </button>
              </div>
              {mode === "text" && textItems.length === 0 && (
                <span className="text-xs text-amber-300">
                  Nu am găsit text de dat click — pare scanat. Folosește „Adaugă / acoperă”.
                </span>
              )}
            </div>

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
                  onClick={mode === "text" ? applyEdits : applyOverlays}
                  disabled={!canSave || applying}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {applying ? "Saving…" : `Save & Download${canSave ? ` (${mode === "text" ? editCount : overlayCount})` : ""}`}
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

            {mode === "text" ? (
              <p className="text-sm text-gray-400 mb-3">
                Click any word or line and type your change — it&apos;s saved automatically as you type
                (press <span className="text-gray-300">Esc</span> to discard it). When you&apos;re done, click the
                green <span className="text-green-400 font-medium">Save &amp; Download</span> button.
              </p>
            ) : (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTool(tool === "text" ? "select" : "text")}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${tool === "text" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                >
                  ✚ Adaugă text
                </button>
                <button
                  type="button"
                  onClick={() => setTool(tool === "cover" ? "select" : "cover")}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${tool === "cover" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                >
                  ▭ Acoperă
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="px-3 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  ⬈ Imagine / semnătură
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    onImagePicked(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />
                <span className="text-xs text-gray-500">
                  {tool === "text"
                    ? "Click pe pagină ca să pui o casetă de text."
                    : tool === "cover"
                    ? "Trage cu mouse-ul o casetă peste ce vrei să ascunzi."
                    : "Alege o unealtă, apoi lucrează pe pagină."}
                </span>
              </div>
            )}

            {/* Properties bar for the selected overlay */}
            {mode === "overlay" && selected && (
              <div className="mb-3 flex flex-wrap items-center gap-3 bg-gray-950 border border-gray-800 rounded-lg p-2">
                {selected.type === "text" && (
                  <>
                    <label className="text-xs text-gray-400 flex items-center gap-2">
                      Mărime
                      <input
                        type="range"
                        min={8}
                        max={48}
                        value={selected.sizePt ?? 14}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setTextSizePt(v);
                          updateOverlay(selected.id, { sizePt: v });
                        }}
                      />
                      <span className="tabular-nums text-gray-300 w-6">{selected.sizePt ?? 14}</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={`culoare ${c}`}
                          onClick={() => {
                            setTextColor(c);
                            updateOverlay(selected.id, { color: c });
                          }}
                          className={`w-6 h-6 rounded-full border ${selected.color === c ? "border-white ring-2 ring-blue-400" : "border-gray-600"}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </>
                )}
                {selected.type === "cover" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Culoare</span>
                    {COVER_CHOICES.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => {
                          setCoverColor(c.key);
                          updateOverlay(selected.id, { color: c.key });
                        }}
                        className={`px-2 h-7 rounded-md text-xs border flex items-center gap-1 ${selected.color === c.key ? "border-white ring-1 ring-blue-400 text-white" : "border-gray-600 text-gray-300"}`}
                      >
                        <span className="w-4 h-4 rounded-sm border border-gray-500" style={{ background: c.swatch }} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeOverlay(selected.id)}
                  className="ml-auto px-2 py-1 text-xs text-gray-300 hover:text-red-400 rounded-md border border-gray-700"
                >
                  ✕ Șterge elementul
                </button>
              </div>
            )}

            {/* Canvas + interaction layer */}
            <div className="overflow-auto bg-gray-950 rounded-lg border border-gray-800 p-2 max-h-[72vh]">
              <div className="relative inline-block select-none" style={{ touchAction: "none" }}>
                <canvas ref={canvasRef} className="block" />

                {mode === "text" ? (
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
                            onChange={(e) => syncEdit(item, e.currentTarget.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commitEdit(item, e.currentTarget.value);
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                skipBlurRef.current = true;
                                cancelEdit(item);
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
                              {ed.newText || " "}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    ref={overlayLayerRef}
                    className="absolute inset-0"
                    style={{ cursor: tool === "text" ? "text" : tool === "cover" ? "crosshair" : "default" }}
                    onPointerDown={onLayerPointerDown}
                    onPointerMove={onLayerPointerMove}
                    onPointerUp={onLayerPointerUp}
                  >
                    {/* draft cover rectangle while dragging */}
                    {draft && draft.fw > 0 && (
                      <div
                        className="absolute border border-blue-400 bg-blue-400/20 pointer-events-none"
                        style={{
                          left: draft.fx * canvasSize.w,
                          top: draft.fy * canvasSize.h,
                          width: draft.fw * canvasSize.w,
                          height: draft.fh * canvasSize.h,
                        }}
                      />
                    )}

                    {pageOverlays.map((o) => {
                      const left = o.fx * canvasSize.w;
                      const top = o.fy * canvasSize.h;
                      const width = o.fw * canvasSize.w;
                      const isSel = selectedId === o.id;
                      const commonHandle = isSel && (
                        <span
                          onPointerDown={(e) => startResize(e, o)}
                          className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-blue-500 border border-white rounded-sm cursor-nwse-resize"
                        />
                      );

                      if (o.type === "cover") {
                        const height = o.fh * canvasSize.h;
                        const bg = o.color === "auto" ? "#ffffff" : o.color || "#ffffff";
                        return (
                          <div
                            key={o.id}
                            onPointerDown={(e) => startMove(e, o)}
                            className={`absolute ${isSel ? "outline outline-1 outline-blue-400" : ""}`}
                            style={{ left, top, width, height, background: bg, cursor: "move" }}
                          >
                            {o.color === "auto" && (
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400 pointer-events-none">
                                fundal auto
                              </span>
                            )}
                            {commonHandle}
                          </div>
                        );
                      }

                      if (o.type === "image") {
                        const height = o.fh * canvasSize.h;
                        return (
                          <div
                            key={o.id}
                            onPointerDown={(e) => startMove(e, o)}
                            className={`absolute ${isSel ? "outline outline-1 outline-blue-400" : ""}`}
                            style={{ left, top, width, height, cursor: "move" }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={o.dataUrl} alt="" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                            {commonHandle}
                          </div>
                        );
                      }

                      // text overlay
                      const fontPx = Math.max(8, (o.sizePt ?? 14) * renderScale);
                      if (editingOverlayId === o.id) {
                        return (
                          <textarea
                            key={o.id}
                            autoFocus
                            value={o.text ?? ""}
                            onChange={(e) => updateOverlay(o.id, { text: e.target.value })}
                            onFocus={(e) => e.currentTarget.select()}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                e.preventDefault();
                                setEditingOverlayId(null);
                              }
                            }}
                            onBlur={() => setEditingOverlayId(null)}
                            placeholder="scrie aici…"
                            className="absolute z-10 bg-white text-black border border-blue-500 rounded px-1 outline-none resize-none leading-tight"
                            style={{ left, top, width: Math.max(width, 80), fontSize: fontPx, minHeight: fontPx * 1.6 }}
                          />
                        );
                      }
                      return (
                        <div
                          key={o.id}
                          onPointerDown={(e) => startMove(e, o)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(o.id);
                            setEditingOverlayId(o.id);
                          }}
                          className={`absolute whitespace-pre-wrap break-words leading-tight ${isSel ? "outline outline-1 outline-blue-400" : "hover:outline hover:outline-1 hover:outline-blue-300/60"}`}
                          style={{ left, top, width: Math.max(width, 20), fontSize: fontPx, color: o.color || "#111", cursor: "move" }}
                          title="Trage ca să muți · dublu-click ca să scrii"
                        >
                          {o.text || <span className="text-gray-400">(gol — dublu-click)</span>}
                          {commonHandle}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm" role="alert">
                {error}
              </div>
            )}

            {/* Pending text-layer changes (classic mode) */}
            {mode === "text" && editCount > 0 && (
              <div className="mt-6 bg-gray-950 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white">
                    Pending changes <span className="text-gray-500">({editCount})</span>
                  </p>
                  <button type="button" onClick={() => setEdits({})} className="text-xs text-gray-400 hover:text-red-400">
                    Clear all
                  </button>
                </div>
                <button
                  type="button"
                  onClick={applyEdits}
                  disabled={applying}
                  className="w-full mb-4 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {applying ? "Saving…" : `Save & download PDF (${editCount} ${editCount === 1 ? "change" : "changes"})`}
                </button>
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

            {/* Overlay elements list (scanned mode) */}
            {mode === "overlay" && overlays.length > 0 && (
              <div className="mt-6 bg-gray-950 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white">
                    Elemente adăugate <span className="text-gray-500">({overlays.length})</span>
                  </p>
                  <button type="button" onClick={() => setOverlays([])} className="text-xs text-gray-400 hover:text-red-400">
                    Șterge tot
                  </button>
                </div>
                <ul className="space-y-2 max-h-48 overflow-auto">
                  {overlays.map((o) => (
                    <li key={o.id} className="flex items-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          if (o.page !== pageNum) goToPage(o.page);
                          setSelectedId(o.id);
                        }}
                        className="text-xs text-gray-500 hover:text-blue-400 shrink-0 w-12 text-left"
                        title="Selectează"
                      >
                        p.{o.page}
                      </button>
                      <span className="text-gray-400 shrink-0 w-20">
                        {o.type === "text" ? "Text" : o.type === "cover" ? "Acoperire" : "Imagine"}
                      </span>
                      <span className="text-gray-300 truncate flex-1">
                        {o.type === "text" ? o.text || "(gol)" : o.type === "cover" ? (o.color === "auto" ? "fundal auto" : o.color) : "imagine"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeOverlay(o.id)}
                        className="p-1 text-gray-500 hover:text-red-400 shrink-0"
                        aria-label="Șterge"
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
