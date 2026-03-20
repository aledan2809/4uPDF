"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How does text-based splitting work?",
    answer:
      "Our OCR engine scans each page of your PDF and searches for your specified text pattern. When found, the PDF is split at that page, creating separate documents.",
  },
  {
    question: "What kind of patterns can I use?",
    answer:
      "You can use plain text (e.g., 'Invoice'), or regular expressions for more complex matching (e.g., 'Page \\d+' to match 'Page 1', 'Page 2', etc.).",
  },
  {
    question: "Does it work with scanned PDFs?",
    answer:
      "Yes! Our advanced OCR technology can read text from scanned documents, making this tool work with both digital and scanned PDFs.",
  },
  {
    question: "What does 'include match in' mean?",
    answer:
      "This determines where the page with the matching text goes: 'Next section' puts it at the start of the new file, 'Previous section' keeps it with the preceding pages, 'Separate' creates its own file.",
  },
];

const relatedTools = [
  { name: "Split Invoices", href: "/tools/split-invoices", description: "Split by invoice numbers" },
  { name: "Split PDF", href: "/tools/split-pdf", description: "Split by page ranges" },
  { name: "OCR PDF", href: "/tools/ocr-pdf", description: "Make scanned PDFs searchable" },
];

const benefits = [
  "Advanced OCR text detection",
  "Regular expression support",
  "Works with scanned PDFs",
  "Flexible split options",
  "Batch processing available",
  "Preserves document quality",
];

type IncludeMatchIn = "next" | "previous" | "separate";

export default function SplitByTextPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pattern, setPattern] = useState("");
  const [includeMatchIn, setIncludeMatchIn] = useState<IncludeMatchIn>("next");
  const [dpi, setDpi] = useState(150);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    files: Array<{ filename: string; download_url: string }>;
    split_points: number[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleSplit = async () => {
    if (!file) {
      setError("Please upload a PDF file first");
      return;
    }
    if (!pattern.trim()) {
      setError("Please enter a text pattern to search for");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pattern", pattern);
      formData.append("include_match_in", includeMatchIn);
      formData.append("dpi", String(dpi));

      const response = await fetch("/api/split-by-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to split PDF");
      }

      const data = await response.json();
      setProgress(100);
      setResult({
        files: data.files,
        split_points: data.split_points,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <ToolPageLayout
      title="Split PDF by Text"
      description="Automatically split your PDF when specific text appears. Perfect for splitting documents by headers, section titles, or any recurring text pattern."
      faqs={faqs}
      relatedTools={relatedTools}
      benefits={benefits}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        {!result ? (
          <>
            {!file ? (
              <FileUploadZone
                accept=".pdf"
                multiple={false}
                maxSizeMB={50}
                onFilesSelected={handleFilesSelected}
              >
                <div className="w-16 h-16 bg-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-pink-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-lg text-white mb-2">
                  Drop your PDF here or <span className="text-blue-400">browse</span>
                </p>
                <p className="text-sm text-gray-500">Max 50MB for free users</p>
              </FileUploadZone>
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg mb-6">
                  <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Text Pattern to Find
                  </label>
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="e.g., Invoice, Chapter, Page 1, or regex like Order.*\d+"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Enter plain text or a regular expression pattern
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    When Pattern is Found, Include Match In:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setIncludeMatchIn("next")}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        includeMatchIn === "next"
                          ? "bg-pink-600/20 border-pink-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="font-medium mb-1">Next Section</div>
                      <div className="text-xs opacity-70">Match starts new file</div>
                    </button>
                    <button
                      onClick={() => setIncludeMatchIn("previous")}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        includeMatchIn === "previous"
                          ? "bg-pink-600/20 border-pink-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="font-medium mb-1">Previous Section</div>
                      <div className="text-xs opacity-70">Match ends current file</div>
                    </button>
                    <button
                      onClick={() => setIncludeMatchIn("separate")}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        includeMatchIn === "separate"
                          ? "bg-pink-600/20 border-pink-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="font-medium mb-1">Separate File</div>
                      <div className="text-xs opacity-70">Match is its own file</div>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    OCR Quality (DPI)
                  </label>
                  <select
                    value={dpi}
                    onChange={(e) => setDpi(Number(e.target.value))}
                    className="w-full sm:w-48 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value={100}>Fast (100 DPI)</option>
                    <option value={150}>Standard (150 DPI)</option>
                    <option value={200}>High (200 DPI)</option>
                    <option value={300}>Best (300 DPI)</option>
                  </select>
                </div>
              </>
            )}

            {error && (
              <div className="mt-4 bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            {isProcessing && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Scanning pages with OCR...</span>
                  <span className="text-sm text-gray-400">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={handleSplit}
                disabled={!file || isProcessing}
                className="px-8 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Processing..." : "Split by Text"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">PDF Split Successfully!</h3>
            <p className="text-gray-400 mb-2">
              Created {result.files.length} file{result.files.length > 1 ? "s" : ""}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Pattern found on page{result.split_points.length > 1 ? "s" : ""}: {result.split_points.join(", ")}
            </p>

            <div className="space-y-2 max-w-md mx-auto mb-6">
              {result.files.map((f, index) => (
                <a
                  key={index}
                  href={f.download_url}
                  download={f.filename}
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors group"
                >
                  <div className="w-8 h-8 bg-pink-600/20 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
                    </svg>
                  </div>
                  <span className="flex-1 text-sm text-white truncate text-left">{f.filename}</span>
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              ))}
            </div>

            <button
              onClick={() => {
                setFile(null);
                setResult(null);
                setPattern("");
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Split Another PDF
            </button>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
