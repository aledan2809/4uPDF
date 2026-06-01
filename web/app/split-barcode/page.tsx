"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function SplitBarcode() {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState(200);
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

  const handleSplit = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("dpi", String(dpi));

    try {
      const res = await fetch("/api/split-barcode", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Split failed" }));
        throw new Error(data.detail || "Split failed");
      }
      const blob = await res.blob();
      const ct = res.headers.get("content-type") || "";
      const name = ct.includes("zip") ? "barcode_split.zip" : "split.pdf";
      setResult({ url: URL.createObjectURL(blob), name });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">&larr; All tools</Link>
      <h1 className="text-3xl font-bold mb-2">Split by Barcode</h1>
      <p className="text-gray-400 mb-6">Split a scanned PDF at pages containing barcodes or QR codes. Each barcode starts a new document section.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? "border-pink-400 bg-pink-950/30" : "border-gray-700 hover:border-gray-500"
        }`}
      >
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files)} />
        {file ? (
          <div><p className="text-lg text-white">{file.name}</p><p className="text-gray-500 text-sm">{(file.size / (1024 * 1024)).toFixed(1)} MB</p></div>
        ) : (
          <div><p className="text-lg text-gray-400 mb-1">Click or drag a scanned PDF here</p><p className="text-gray-500 text-sm">PDF with barcode/QR separator pages</p></div>
        )}
      </div>

      {file && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <label className="block text-sm text-gray-400 mb-1">Scan DPI (higher = more accurate, slower)</label>
          <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" value={dpi} onChange={(e) => setDpi(Number(e.target.value))}>
            <option value={150}>150 DPI (fast)</option>
            <option value={200}>200 DPI (balanced)</option>
            <option value={300}>300 DPI (accurate)</option>
          </select>
        </div>
      )}

      <button onClick={handleSplit} disabled={!file || processing}
        className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors">
        {processing ? "Scanning for barcodes..." : "Split by Barcode"}
      </button>

      {error && <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 text-red-300 text-sm">{error}</div>}
      {result && (
        <div className="mt-6 bg-green-900/20 border border-green-800 rounded-lg p-5">
          <p className="text-green-300 font-medium mb-3">Split completed!</p>
          <a href={result.url} download={result.name} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium inline-block">Download {result.name}</a>
        </div>
      )}
    </div>
  );
}
