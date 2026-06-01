"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function MergePdf() {
  const [files, setFiles] = useState<File[]>([]);
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

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveFile = (idx: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const arr = [...prev];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/merge", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Merge failed" }));
        throw new Error(data.detail || "Merge failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResult({ url, name: "merged.pdf" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">&larr; All tools</Link>
      <h1 className="text-3xl font-bold mb-2">Merge PDF</h1>
      <p className="text-gray-400 mb-6">Combine multiple PDF files into a single document. Drag to reorder.</p>

      {/* Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${
          dragOver ? "border-blue-400 bg-blue-950/30" : "border-gray-700 hover:border-gray-500"
        }`}
      >
        <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <p className="text-lg text-gray-400 mb-1">Click or drag PDF files here</p>
        <p className="text-gray-500 text-sm">Select 2 or more PDF files to merge</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 space-y-2">
          {files.map((f, i) => (
            <div key={f.name + f.size} className="flex items-center gap-3 p-2 rounded bg-gray-800/50">
              <div className="flex flex-col gap-1">
                <button onClick={() => moveFile(i, -1)} disabled={i === 0} className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none">&uarr;</button>
                <button onClick={() => moveFile(i, 1)} disabled={i === files.length - 1} className="text-gray-500 hover:text-white disabled:opacity-20 text-xs leading-none">&darr;</button>
              </div>
              <span className="text-gray-500 text-sm w-6 text-center">{i + 1}</span>
              <span className="font-mono text-sm flex-1">{f.name}</span>
              <span className="text-gray-500 text-xs">{formatSize(f.size)}</span>
              <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-400 text-xs">X</button>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      <button
        onClick={handleMerge}
        disabled={files.length < 2 || processing}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
      >
        {processing ? "Merging..." : `Merge ${files.length} files`}
      </button>

      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 text-red-300 text-sm">{error}</div>
      )}

      {result && (
        <div className="mt-6 bg-green-900/20 border border-green-800 rounded-lg p-5">
          <p className="text-green-300 font-medium mb-3">PDF merged successfully!</p>
          <a
            href={result.url}
            download={result.name}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium inline-block"
          >
            Download merged.pdf
          </a>
        </div>
      )}
    </div>
  );
}
