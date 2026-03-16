"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function SplitInvoice() {
  const [file, setFile] = useState<File | null>(null);
  const [pattern, setPattern] = useState("(?:invoice|factura|order|comanda)\\s*[:#]?\\s*(\\d+)");
  const [dpi, setDpi] = useState(150);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (fileList: FileList | null) => {
    if (!fileList) return;
    const pdf = Array.from(fileList).find(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdf) {
      setFile(pdf);
      setResult(null);
      setError(null);
    }
  };

  const handleSplit = async () => {
    if (!file) {
      setError("Please upload a PDF file");
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);
    setProgress(10);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("pattern", pattern);
    formData.append("dpi", String(dpi));

    try {
      setProgress(30);
      const res = await fetch("/api/split-invoice", { method: "POST", body: formData });
      setProgress(80);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Split failed" }));
        throw new Error(data.detail || "Split failed");
      }
      const blob = await res.blob();
      const isZip = res.headers.get("content-type")?.includes("zip");
      setProgress(100);
      setResult({
        url: URL.createObjectURL(blob),
        name: isZip ? "invoice_split.zip" : "invoice.pdf",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Split failed";
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
        &larr; All tools
      </Link>
      <h1 className="text-3xl font-bold mb-2">Split by Invoice/Order Number</h1>
      <p className="text-gray-400 mb-6">
        Automatically split a PDF by detecting invoice or order numbers using OCR.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? "border-orange-400 bg-orange-950/30" : "border-gray-700 hover:border-gray-500"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files)}
        />
        {file ? (
          <div>
            <p className="text-lg text-white">{file.name}</p>
            <p className="text-gray-500 text-sm">
              {(file.size / (1024 * 1024)).toFixed(1)} MB - Click to change
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg text-gray-400 mb-1">Click or drag a PDF file here</p>
            <p className="text-gray-500 text-sm">Upload scanned invoices or orders</p>
          </div>
        )}
      </div>

      {file && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">OCR Settings</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Invoice/Order Pattern (Regex)</label>
            <input
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Default pattern matches: Invoice 12345, Factura: 67890, Order #111, Comanda 222
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Scan Quality (DPI)</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
              >
                <option value={100}>Fast (100 DPI)</option>
                <option value={150}>Balanced (150 DPI)</option>
                <option value={200}>High Quality (200 DPI)</option>
                <option value={300}>Best Quality (300 DPI)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Higher DPI improves accuracy but takes longer
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSplit}
        disabled={!file || processing}
        className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
      >
        {processing ? "Processing with OCR..." : "Split by Invoice"}
      </button>

      {processing && (
        <div className="mt-4">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Scanning pages with OCR... This may take a while for large documents.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 bg-green-900/20 border border-green-800 rounded-lg p-5">
          <p className="text-green-300 font-medium mb-3">
            PDF split successfully by invoice/order numbers!
          </p>
          <a
            href={result.url}
            download={result.name}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium inline-block"
          >
            Download {result.name}
          </a>
        </div>
      )}
    </div>
  );
}
