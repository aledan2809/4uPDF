"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState(150);
  const [pages, setPages] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (fileList: FileList | null) => {
    if (!fileList) return;
    const pdf = Array.from(fileList).find(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdf) { setFile(pdf); setResult(null); setError(null); }
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("dpi", String(dpi));
    if (pages.trim()) {
      formData.append("pages", pages.trim());
    }

    try {
      const res = await fetch("/api/pdf-to-jpg", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Conversion failed" }));
        throw new Error(data.detail || "Conversion failed");
      }
      const blob = await res.blob();
      const ct = res.headers.get("content-type") || "";
      const isZip = ct.includes("zip");
      const name = isZip ? "pdf_pages.zip" : "page.jpg";
      const url = URL.createObjectURL(blob);
      setResult({ url, name });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">&larr; All tools</Link>
      <h1 className="text-3xl font-bold mb-2">PDF to JPG</h1>
      <p className="text-gray-400 mb-6">Convert PDF pages to high-quality JPG images.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? "border-yellow-400 bg-yellow-950/30" : "border-gray-700 hover:border-gray-500"
        }`}
      >
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files)} />
        {file ? (
          <div>
            <p className="text-lg text-white">{file.name}</p>
            <p className="text-gray-500 text-sm">{(file.size / (1024 * 1024)).toFixed(1)} MB - Click to change</p>
          </div>
        ) : (
          <div>
            <p className="text-lg text-gray-400 mb-1">Click or drag a PDF file here</p>
            <p className="text-gray-500 text-sm">Each page will be converted to a JPG image</p>
          </div>
        )}
      </div>

      {file && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Options</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">DPI (image quality)</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
              >
                <option value={72}>72 DPI (fast, small)</option>
                <option value={150}>150 DPI (balanced)</option>
                <option value={300}>300 DPI (high quality)</option>
                <option value={600}>600 DPI (maximum)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Pages (optional)</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
                placeholder="All pages (e.g. 1-3, 5)"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for all pages</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={!file || processing}
        className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
      >
        {processing ? "Converting..." : "Convert to JPG"}
      </button>

      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 text-red-300 text-sm">{error}</div>
      )}

      {result && (
        <div className="mt-6 bg-green-900/20 border border-green-800 rounded-lg p-5">
          <p className="text-green-300 font-medium mb-3">Converted successfully!</p>
          <a href={result.url} download={result.name} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium inline-block">
            Download {result.name}
          </a>
        </div>
      )}
    </div>
  );
}
