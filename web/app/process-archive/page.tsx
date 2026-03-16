"use client";
import { useState, useRef } from "react";
import Link from "next/link";

type ClassifyItem = { file: string; type: string; confidence: number; keywords: string[] };

export default function ProcessArchive() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [action, setAction] = useState<"detect-split" | "rename" | "classify">("detect-split");
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);
  const [classifyResult, setClassifyResult] = useState<ClassifyItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const pdfs = Array.from(fileList).filter(
      (f) => f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfs.length > 0) { setFiles(pdfs); setResult(null); setError(null); setClassifyResult(null); }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setError(null);
    setResult(null);
    setClassifyResult(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("action", action);

    try {
      const res = await fetch("/api/process-archive", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Processing failed" }));
        throw new Error(data.detail || "Processing failed");
      }

      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) {
        const data = await res.json();
        if (data.results) {
          setClassifyResult(data.results);
        } else if (data.error) {
          throw new Error(data.error);
        }
      } else {
        const blob = await res.blob();
        const name = ct.includes("zip") ? "processed_archive.zip" : "processed.pdf";
        setResult({ url: URL.createObjectURL(blob), name });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">&larr; All tools</Link>
      <h1 className="text-3xl font-bold mb-2">Process Archive</h1>
      <p className="text-gray-400 mb-6">
        Upload multiple PDFs for batch processing: detect &amp; split by type, auto-rename by OCR, or classify documents.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? "border-fuchsia-400 bg-fuchsia-950/30" : "border-gray-700 hover:border-gray-500"
        }`}
      >
        <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        {files.length > 0 ? (
          <div>
            <p className="text-lg text-white">{files.length} PDF{files.length > 1 ? "s" : ""} selected</p>
            <p className="text-gray-500 text-sm">{files.map(f => f.name).join(", ")}</p>
            <p className="text-gray-600 text-xs mt-1">Click to change</p>
          </div>
        ) : (
          <div><p className="text-lg text-gray-400 mb-1">Click or drag PDF files here</p><p className="text-gray-500 text-sm">Select one or more PDFs for batch processing</p></div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Action</h2>
        <div className="flex gap-3">
          {([
            { value: "detect-split" as const, label: "Detect & Split", desc: "Split by document type" },
            { value: "rename" as const, label: "Auto Rename", desc: "Rename by OCR content" },
            { value: "classify" as const, label: "Classify", desc: "Identify document types" },
          ]).map((opt) => (
            <label key={opt.value} className={`flex-1 p-3 rounded-lg border cursor-pointer transition-colors ${
              action === opt.value ? "border-fuchsia-500 bg-fuchsia-950/30" : "border-gray-700 hover:border-gray-500"
            }`}>
              <input type="radio" name="action" className="hidden" checked={action === opt.value} onChange={() => setAction(opt.value)} />
              <p className="text-sm font-medium text-white">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </label>
          ))}
        </div>
      </div>

      <button onClick={handleProcess} disabled={files.length === 0 || processing}
        className="bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors">
        {processing ? "Processing..." : "Process Archive"}
      </button>

      {error && <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 text-red-300 text-sm">{error}</div>}

      {classifyResult && (
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-3">Classification Results</h2>
          <div className="space-y-3">
            {classifyResult.map((item, i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-white font-medium">{item.file}</p>
                  <p className="text-sm text-gray-400">Type: <span className="text-fuchsia-400 capitalize">{item.type}</span> | Confidence: {item.confidence}%</p>
                  {item.keywords.length > 0 && (
                    <div className="flex gap-1 mt-1">{item.keywords.map((kw, j) => (
                      <span key={j} className="text-xs bg-gray-700 px-2 py-0.5 rounded">{kw}</span>
                    ))}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-green-900/20 border border-green-800 rounded-lg p-5">
          <p className="text-green-300 font-medium mb-3">Archive processed successfully!</p>
          <a href={result.url} download={result.name} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium inline-block">Download {result.name}</a>
        </div>
      )}
    </div>
  );
}
