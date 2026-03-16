"use client";
import { useState, useRef } from "react";
import Link from "next/link";

type DetectResult = {
  file: string;
  type: string;
  confidence: number;
  keywords: string[];
  page_count: number;
  text_preview: string;
};

export default function DetectType() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<DetectResult | null>(null);
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

  const handleDetect = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("files", file);

    try {
      const res = await fetch("/api/detect-type", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Detection failed" }));
        throw new Error(data.detail || "Detection failed");
      }
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setResult(data.results[0]);
      } else {
        throw new Error("No detection results returned");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const confidenceColor = (c: number) => {
    if (c >= 70) return "text-green-400";
    if (c >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">&larr; All tools</Link>
      <h1 className="text-3xl font-bold mb-2">Detect Document Type</h1>
      <p className="text-gray-400 mb-6">Analyze a PDF to detect its document type (invoice, contract, delivery note, etc.) using OCR and keyword matching.</p>

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
          <div><p className="text-lg text-white">{file.name}</p><p className="text-gray-500 text-sm">{(file.size / (1024 * 1024)).toFixed(1)} MB - Click to change</p></div>
        ) : (
          <div><p className="text-lg text-gray-400 mb-1">Click or drag a PDF file here</p><p className="text-gray-500 text-sm">Select a PDF to analyze</p></div>
        )}
      </div>

      <button onClick={handleDetect} disabled={!file || processing}
        className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors">
        {processing ? "Analyzing..." : "Detect Type"}
      </button>

      {error && <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 text-red-300 text-sm">{error}</div>}
      {result && (
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Detection Results</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Document Type</p>
              <p className="text-2xl font-bold capitalize">{result.type}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Confidence</p>
              <p className={`text-2xl font-bold ${confidenceColor(result.confidence)}`}>{result.confidence}%</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Pages</p>
              <p className="text-2xl font-bold">{result.page_count}</p>
            </div>
          </div>
          {result.keywords.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Matched Keywords</p>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((kw, i) => (
                  <span key={i} className="bg-pink-900/40 border border-pink-800 text-pink-300 px-3 py-1 rounded-full text-sm">{kw}</span>
                ))}
              </div>
            </div>
          )}
          {result.text_preview && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Text Preview</p>
              <pre className="bg-gray-800/50 rounded p-3 text-sm text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">{result.text_preview}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
