"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function SplitPattern() {
  const [file, setFile] = useState<File | null>(null);
  const [pattern, setPattern] = useState("");
  const [mode, setMode] = useState("contains");
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
    if (!file || !pattern.trim()) {
      setError("Please upload a PDF and enter a search pattern");
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("pattern", pattern);
    formData.append("mode", mode);

    try {
      const res = await fetch("/api/split-pattern", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Split failed" }));
        throw new Error(data.detail || "Split failed");
      }
      const blob = await res.blob();
      const isZip = res.headers.get("content-type")?.includes("zip");
      setResult({
        url: URL.createObjectURL(blob),
        name: isZip ? "pattern_split.zip" : "section_1.pdf",
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
      <h1 className="text-3xl font-bold mb-2">Split by Text Pattern</h1>
      <p className="text-gray-400 mb-6">
        Split a PDF into sections whenever a specific text pattern is found on a page.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? "border-indigo-400 bg-indigo-950/30" : "border-gray-700 hover:border-gray-500"
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
            <p className="text-gray-500 text-sm">Select the PDF to split</p>
          </div>
        )}
      </div>

      {file && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">Split Settings</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Text Pattern</label>
            <input
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              placeholder="Enter text to search for..."
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              The PDF will be split whenever this pattern is found on a page
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Match Mode</label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "contains"}
                  onChange={() => setMode("contains")}
                  className="accent-indigo-500"
                />
                <span>Contains (case-insensitive)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "exact"}
                  onChange={() => setMode("exact")}
                  className="accent-indigo-500"
                />
                <span>Exact match</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "regex"}
                  onChange={() => setMode("regex")}
                  className="accent-indigo-500"
                />
                <span>Regex</span>
              </label>
            </div>
            {mode === "regex" && (
              <p className="text-xs text-gray-500 mt-2">
                Use regular expressions (e.g., &quot;Page\s+\d+&quot; to match &quot;Page 1&quot;, &quot;Page 2&quot;, etc.)
              </p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleSplit}
        disabled={!file || !pattern.trim() || processing}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
      >
        {processing ? "Splitting..." : "Split PDF"}
      </button>

      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 bg-green-900/20 border border-green-800 rounded-lg p-5">
          <p className="text-green-300 font-medium mb-3">PDF split successfully!</p>
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
