"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How do I split a PDF file?",
    answer:
      "Upload your PDF, select the pages you want to extract or choose to split by page ranges, then download your split files.",
  },
  {
    question: "Can I extract specific pages from a PDF?",
    answer:
      "Yes! You can select individual pages, page ranges (e.g., 1-5, 10-15), or split every X pages automatically.",
  },
  {
    question: "What happens to my original PDF?",
    answer:
      "Your original PDF remains unchanged. We create new PDF files from the pages you select.",
  },
  {
    question: "Can I split a PDF into individual pages?",
    answer:
      "Absolutely! Select the 'Single pages' option to split your PDF into one file per page.",
  },
  {
    question: "Are my files secure during splitting?",
    answer:
      "Yes, all files are processed securely and automatically deleted from our servers after 24 hours.",
  },
];

const relatedTools = [
  { name: "Merge PDF", href: "/tools/merge-pdf", description: "Combine multiple PDFs into one" },
  { name: "Compress PDF", href: "/tools/compress-pdf", description: "Reduce PDF file size" },
  { name: "PDF to JPG", href: "/tools/pdf-to-jpg", description: "Convert PDF pages to images" },
];

type SplitMode = "ranges" | "every" | "single";

export default function SplitPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<SplitMode>("ranges");
  const [ranges, setRanges] = useState("");
  const [everyN, setEveryN] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ files: Array<{ filename: string; download_url: string }> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      setResult(null);
      setError(null);
      setTotalPages(0);
    }
  }, []);

  const handleSplit = async () => {
    if (!file) {
      setError("Please upload a PDF file first");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("split_mode", splitMode);

      if (splitMode === "ranges") {
        if (!ranges.trim()) {
          throw new Error("Please enter page ranges (e.g., 1-3, 5, 7-10)");
        }
        formData.append("ranges", ranges);
      } else if (splitMode === "every") {
        formData.append("ranges", String(everyN));
      } else {
        formData.append("ranges", "1");
      }

      const response = await fetch("/api/split-pages", {
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
      title="Split PDF"
      description="Split a PDF into multiple files or extract specific pages. Choose page ranges or split by intervals."
      faqs={faqs}
      relatedTools={relatedTools}
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
                <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
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
                  <label className="block text-sm font-medium text-gray-300 mb-3">Split Mode</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setSplitMode("ranges")}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        splitMode === "ranges"
                          ? "bg-purple-600/20 border-purple-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="font-medium mb-1">Page Ranges</div>
                      <div className="text-xs opacity-70">e.g., 1-3, 5, 7-10</div>
                    </button>
                    <button
                      onClick={() => setSplitMode("every")}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        splitMode === "every"
                          ? "bg-purple-600/20 border-purple-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="font-medium mb-1">Every N Pages</div>
                      <div className="text-xs opacity-70">Split at intervals</div>
                    </button>
                    <button
                      onClick={() => setSplitMode("single")}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        splitMode === "single"
                          ? "bg-purple-600/20 border-purple-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="font-medium mb-1">Single Pages</div>
                      <div className="text-xs opacity-70">One file per page</div>
                    </button>
                  </div>
                </div>

                {splitMode === "ranges" && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Page Ranges
                    </label>
                    <input
                      type="text"
                      value={ranges}
                      onChange={(e) => setRanges(e.target.value)}
                      placeholder="e.g., 1-3, 5, 7-10"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Each range creates a separate PDF file
                    </p>
                  </div>
                )}

                {splitMode === "every" && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Split every N pages
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={everyN}
                      onChange={(e) => setEveryN(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
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
                  <span className="text-sm text-gray-400">Splitting PDF...</span>
                  <span className="text-sm text-gray-400">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={handleSplit}
                disabled={!file || isProcessing}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Splitting..." : "Split PDF"}
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
            <p className="text-gray-400 mb-6">
              Created {result.files.length} file{result.files.length > 1 ? "s" : ""}
            </p>

            <div className="space-y-2 max-w-md mx-auto mb-6">
              {result.files.map((f, index) => (
                <a
                  key={index}
                  href={f.download_url}
                  download={f.filename}
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors group"
                >
                  <div className="w-8 h-8 bg-purple-600/20 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
                    </svg>
                  </div>
                  <span className="flex-1 text-sm text-white truncate text-left">{f.filename}</span>
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              ))}
            </div>

            <button
              onClick={() => {
                setFile(null);
                setResult(null);
                setRanges("");
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
