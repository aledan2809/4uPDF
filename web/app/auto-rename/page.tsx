"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function AutoRename() {
  const [files, setFiles] = useState<File[]>([]);
  const [region, setRegion] = useState("top");
  const [pattern, setPattern] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const pdfs = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...pdfs.filter((f) => !existing.has(f.name + f.size))];
    });
    setResult(null);
    setError(null);
  };

  const handleRename = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("region", region);
    if (pattern.trim()) formData.append("pattern", pattern.trim());

    try {
      const res = await fetch("/api/auto-rename", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Rename failed" }));
        throw new Error(data.detail || "Rename failed");
      }
      const blob = await res.blob();
      const ct = res.headers.get("content-type") || "";
      const name = ct.includes("zip") ? "renamed_pdfs.zip" : "renamed.pdf";
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
      <h1 className="text-3xl font-bold mb-2">Auto-Rename PDF</h1>
      <p className="text-gray-400 mb-6">Automatically rename PDF files based on text detected via OCR from the first page.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${
          dragOver ? "border-sky-400 bg-sky-950/30" : "border-gray-700 hover:border-gray-500"
        }`}
      >
        <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <p className="text-lg text-gray-400 mb-1">Click or drag PDF files here</p>
        <p className="text-gray-500 text-sm">Upload one or more PDFs to auto-rename</p>
      </div>

      {files.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4 space-y-1">
          {files.map((f, i) => (
            <div key={f.name + f.size} className="flex items-center gap-3 p-2 rounded bg-gray-800/50 text-sm">
              <span className="font-mono flex-1">{f.name}</span>
              <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400 text-xs">X</button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Options</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">OCR region (first page)</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="top">Top 25% of page</option>
                <option value="bottom">Bottom 25% of page</option>
                <option value="full">Full page</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Regex pattern (optional)</label>
              <input className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono" placeholder="e.g. Invoice\s*(\d+)" value={pattern} onChange={(e) => setPattern(e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">Group (1) becomes filename. Leave empty for auto-detect.</p>
            </div>
          </div>
        </div>
      )}

      <button onClick={handleRename} disabled={files.length === 0 || processing}
        className="bg-sky-600 hover:bg-sky-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors">
        {processing ? "Processing OCR..." : `Rename ${files.length} file${files.length !== 1 ? "s" : ""}`}
      </button>

      {error && <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 text-red-300 text-sm">{error}</div>}
      {result && (
        <div className="mt-6 bg-green-900/20 border border-green-800 rounded-lg p-5">
          <p className="text-green-300 font-medium mb-3">Files renamed successfully!</p>
          <a href={result.url} download={result.name} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium inline-block">Download {result.name}</a>
        </div>
      )}
    </div>
  );
}
