"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<"low" | "medium" | "high">("medium");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; name: string; ratio: string } | null>(null);
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

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("level", level);

    try {
      const res = await fetch("/api/compress", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Compression failed" }));
        throw new Error(data.detail || "Compression failed");
      }
      const blob = await res.blob();
      const originalSize = file.size;
      const compressedSize = blob.size;
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      const url = URL.createObjectURL(blob);
      setResult({ url, name: `compressed_${file.name}`, ratio });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const levels = [
    { id: "low" as const, label: "Low", desc: "Smaller file, lower image quality" },
    { id: "medium" as const, label: "Medium", desc: "Good balance of size and quality" },
    { id: "high" as const, label: "High", desc: "Best quality, moderate compression" },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">&larr; All tools</Link>
      <h1 className="text-3xl font-bold mb-2">Compress PDF</h1>
      <p className="text-gray-400 mb-6">Reduce PDF file size while maintaining readable quality.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? "border-green-400 bg-green-950/30" : "border-gray-700 hover:border-gray-500"
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
            <p className="text-gray-500 text-sm">Select the PDF to compress</p>
          </div>
        )}
      </div>

      {file && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Compression level</h2>
          <div className="flex gap-3">
            {levels.map((l) => (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`flex-1 p-3 rounded-lg border text-left transition-colors ${
                  level === l.id ? "border-green-500 bg-green-950/30" : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <p className="font-medium">{l.label}</p>
                <p className="text-xs text-gray-400">{l.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleCompress}
        disabled={!file || processing}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
      >
        {processing ? "Compressing..." : "Compress PDF"}
      </button>

      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 text-red-300 text-sm">{error}</div>
      )}

      {result && (
        <div className="mt-6 bg-green-900/20 border border-green-800 rounded-lg p-5">
          <p className="text-green-300 font-medium mb-1">PDF compressed successfully!</p>
          <p className="text-gray-400 text-sm mb-3">Reduced by {result.ratio}%</p>
          <a href={result.url} download={result.name} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium inline-block">
            Download compressed PDF
          </a>
        </div>
      )}
    </div>
  );
}
