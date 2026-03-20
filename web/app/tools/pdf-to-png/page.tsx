"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How do I convert PDF pages to PNG images?",
    answer:
      "Upload your PDF file and our tool will convert each page to a high-quality PNG image. You can download all images as a ZIP file.",
  },
  {
    question: "What DPI/resolution options are available?",
    answer:
      "We use 150 DPI by default which provides a good balance of quality and file size. Higher DPI options are available for premium users.",
  },
  {
    question: "Can I convert specific pages only?",
    answer:
      "Yes, you can specify which pages to convert using page ranges like '1-3,5,7-10' or convert all pages at once.",
  },
  {
    question: "Why choose PNG over JPG?",
    answer:
      "PNG supports transparency and lossless compression, making it ideal for documents with text, logos, or graphics. JPG is better for photos.",
  },
  {
    question: "Are my files secure?",
    answer:
      "Yes, all uploads are encrypted using SSL/TLS. Files are processed on secure servers and automatically deleted after 24 hours.",
  },
];

const relatedTools = [
  { name: "PNG to PDF", href: "/tools/png-to-pdf", description: "Convert PNG images to PDF" },
  { name: "PDF to JPG", href: "/tools/pdf-to-jpg", description: "Convert PDF to JPG images" },
  { name: "Compress PDF", href: "/tools/compress-pdf", description: "Reduce PDF file size" },
];

export default function PDFToPNGPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    downloadUrl: string;
    filename: string;
    totalImages?: number;
    files?: Array<{ filename: string; download_url: string }>;
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
      formData.append("dpi", "150");
      formData.append("pages", "all");

      const response = await fetch("/api/pdf-to-png", {
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
        totalImages: data.total_images,
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
      title="PDF to PNG"
      description="Convert PDF pages to high-quality PNG images. Perfect for extracting graphics, creating thumbnails, or sharing individual pages."
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
                <div className="w-16 h-16 bg-cyan-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-cyan-400"
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
                  Drop your PDF here or <span className="text-cyan-400">browse</span>
                </p>
                <p className="text-sm text-gray-500">Max 50MB for free users</p>
              </FileUploadZone>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg mb-6">
                <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-red-400">PDF</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <div className="w-10 h-10 bg-cyan-600/20 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-cyan-400">PNG</span>
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
            )}

            {error && (
              <div className="mt-4 bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            {isProcessing && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Converting to PNG...</span>
                  <span className="text-sm text-gray-400">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={handleConvert}
                disabled={!file || isProcessing}
                className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Converting..." : "Convert to PNG"}
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
            {result.totalImages && (
              <p className="text-gray-400 mb-4">Created {result.totalImages} PNG image{result.totalImages > 1 ? "s" : ""}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <a
                href={result.downloadUrl}
                download={result.filename}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {result.totalImages && result.totalImages > 1 ? "Download All (ZIP)" : "Download PNG"}
              </a>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
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
