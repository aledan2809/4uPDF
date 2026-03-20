"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How do I convert PDF to JPG?",
    answer:
      "Upload your PDF file, select the pages you want to convert (or all pages), choose your preferred quality, and click Convert. Your images will be ready in seconds.",
  },
  {
    question: "Can I convert specific pages only?",
    answer:
      "Yes! You can convert all pages or specify page ranges like '1-3, 5, 7-10' to convert only the pages you need.",
  },
  {
    question: "What image quality is available?",
    answer:
      "Choose from 72 DPI (web quality), 150 DPI (standard), or 300 DPI (high quality for printing).",
  },
  {
    question: "How do I download multiple images?",
    answer:
      "When converting multiple pages, we provide a ZIP file containing all images for easy download.",
  },
  {
    question: "Are my files secure?",
    answer:
      "Yes, all uploads are encrypted and files are automatically deleted from our servers after 24 hours.",
  },
];

const relatedTools = [
  { name: "JPG to PDF", href: "/tools/jpg-to-pdf", description: "Convert images to PDF" },
  { name: "Compress PDF", href: "/tools/compress-pdf", description: "Reduce PDF file size" },
  { name: "Split PDF", href: "/tools/split-pdf", description: "Split PDF into multiple files" },
];

type DPIOption = 72 | 150 | 300;

export default function PDFToJPGPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState<DPIOption>(150);
  const [pages, setPages] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    downloadUrl: string;
    filename: string;
    files?: Array<{ filename: string; download_url: string }>;
    totalImages: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleConvert = async () => {
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
      formData.append("dpi", String(dpi));
      formData.append("pages", pages);

      const response = await fetch("/api/pdf-to-jpg", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to convert PDF");
      }

      const data = await response.json();
      setProgress(100);
      setResult({
        downloadUrl: data.download_url,
        filename: data.filename,
        files: data.files,
        totalImages: data.total_images,
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
      title="PDF to JPG"
      description="Convert PDF pages to high-quality JPG images. Extract all pages or select specific pages to convert."
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
                <div className="w-16 h-16 bg-yellow-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
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
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <div className="w-10 h-10 bg-yellow-600/20 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-yellow-400">JPG</span>
                    </div>
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
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Image Quality (DPI)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setDpi(72)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        dpi === 72
                          ? "bg-yellow-600/20 border-yellow-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="font-medium">72 DPI</div>
                      <div className="text-xs opacity-70">Web quality</div>
                    </button>
                    <button
                      onClick={() => setDpi(150)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        dpi === 150
                          ? "bg-yellow-600/20 border-yellow-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="font-medium">150 DPI</div>
                      <div className="text-xs opacity-70">Recommended</div>
                    </button>
                    <button
                      onClick={() => setDpi(300)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        dpi === 300
                          ? "bg-yellow-600/20 border-yellow-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="font-medium">300 DPI</div>
                      <div className="text-xs opacity-70">High quality</div>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pages to Convert
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPages("all")}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        pages === "all"
                          ? "bg-yellow-600/20 border-yellow-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      All pages
                    </button>
                    <input
                      type="text"
                      value={pages === "all" ? "" : pages}
                      onChange={(e) => setPages(e.target.value || "all")}
                      placeholder="e.g., 1-3, 5"
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Leave empty for all pages or specify ranges like "1-3, 5, 7-10"
                  </p>
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
                  <span className="text-sm text-gray-400">Converting PDF to images...</span>
                  <span className="text-sm text-gray-400">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={handleConvert}
                disabled={!file || isProcessing}
                className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Converting..." : "Convert to JPG"}
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
            <h3 className="text-xl font-semibold text-white mb-2">PDF Converted Successfully!</h3>
            <p className="text-gray-400 mb-6">
              Created {result.totalImages} image{result.totalImages > 1 ? "s" : ""}
            </p>

            {result.files && result.files.length > 1 ? (
              <>
                <a
                  href={result.downloadUrl}
                  download={result.filename}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors mb-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download All (ZIP)
                </a>

                <div className="mt-6">
                  <p className="text-sm text-gray-400 mb-3">Or download individually:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                    {result.files.map((f, index) => (
                      <a
                        key={index}
                        href={f.download_url}
                        download={f.filename}
                        className="p-2 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors text-center group"
                      >
                        <div className="w-10 h-10 bg-yellow-600/20 rounded mx-auto mb-1 flex items-center justify-center">
                          <span className="text-xs font-bold text-yellow-400">JPG</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate group-hover:text-white">{f.filename}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <a
                href={result.downloadUrl}
                download={result.filename}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Image
              </a>
            )}

            <div className="mt-6">
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setPages("all");
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Convert Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
