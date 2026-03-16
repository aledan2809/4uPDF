"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (fileList: FileList | null) => {
    if (!fileList) return;
    const doc = Array.from(fileList).find((f) =>
      f.name.toLowerCase().endsWith(".docx") || f.name.toLowerCase().endsWith(".doc")
    );
    if (doc) { setFile(doc); setResult(null); setError(null); }
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/word-to-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Conversion failed" }));
        throw new Error(data.detail || "Conversion failed");
      }
      const blob = await res.blob();
      const baseName = file.name.replace(/\.(docx?|doc)$/i, "");
      const url = URL.createObjectURL(blob);
      setResult({ url, name: `${baseName}.pdf` });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">&larr; All tools</Link>
      <h1 className="text-3xl font-bold mb-2">Word to PDF</h1>
      <p className="text-gray-400 mb-6">Convert DOCX/DOC documents to PDF format.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? "border-red-400 bg-red-950/30" : "border-gray-700 hover:border-gray-500"
        }`}
      >
        <input ref={fileInputRef} type="file" accept=".doc,.docx" className="hidden" onChange={(e) => handleFile(e.target.files)} />
        {file ? (
          <div>
            <p className="text-lg text-white">{file.name}</p>
            <p className="text-gray-500 text-sm">{(file.size / (1024 * 1024)).toFixed(1)} MB - Click to change</p>
          </div>
        ) : (
          <div>
            <p className="text-lg text-gray-400 mb-1">Click or drag a Word file here</p>
            <p className="text-gray-500 text-sm">Accepts .docx and .doc files</p>
          </div>
        )}
      </div>

      <button
        onClick={handleConvert}
        disabled={!file || processing}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
      >
        {processing ? "Converting..." : "Convert to PDF"}
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
