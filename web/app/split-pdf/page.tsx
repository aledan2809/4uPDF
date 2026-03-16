"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"pages" | "ranges">("pages");
  const [ranges, setRanges] = useState("");
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
    if (pdf) {
      setFile(pdf);
      setResult(null);
      setError(null);
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);
    if (mode === "ranges" && ranges) {
      formData.append("ranges", ranges);
    }

    try {
      const res = await fetch("/api/split", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Split failed" }));
        throw new Error(data.detail || "Split failed");
      }

      const blob = await res.blob();
      const ct = res.headers.get("content-type") || "";
      const isPdf = ct.includes("pdf");
      const name = isPdf ? "split_page.pdf" : "split_pages.zip";
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
      <h1 className="text-3xl font-bold mb-2">Split PDF</h1>
      <p className="text-gray-400 mb-6">Split a PDF into individual pages or by custom ranges.</p>

      {/* Upload */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? "border-purple-400 bg-purple-950/30" : "border-gray-700 hover:border-gray-500"
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
            <p className="text-gray-500 text-sm">Select the PDF to split</p>
          </div>
        )}
      </div>

      {/* Options */}
      {file && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Split mode</h2>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="mode" checked={mode === "pages"} onChange={() => setMode("pages")} className="accent-purple-500" />
              <span>Every page</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="mode" checked={mode === "ranges"} onChange={() => setMode("ranges")} className="accent-purple-500" />
              <span>Custom ranges</span>
            </label>
          </div>
          {mode === "ranges" && (
            <div>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
                placeholder="e.g. 1-3, 5, 7-9"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Separate ranges with commas. Example: 1-3, 5, 7-9</p>
            </div>
          )}
        </div>
      )}

      {/* Action */}
      <button
        onClick={handleSplit}
        disabled={!file || processing || (mode === "ranges" && !ranges)}
        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
      >
        {processing ? "Splitting..." : "Split PDF"}
      </button>

      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 text-red-300 text-sm">{error}</div>
      )}

      {result && (
        <div className="mt-6 bg-green-900/20 border border-green-800 rounded-lg p-5">
          <p className="text-green-300 font-medium mb-3">PDF split successfully!</p>
          <a href={result.url} download={result.name} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium inline-block">
            Download {result.name}
          </a>
        </div>
      )}
    </div>
  );
}
