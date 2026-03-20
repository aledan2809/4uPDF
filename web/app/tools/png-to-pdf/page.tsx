"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How do I convert PNG images to PDF?",
    answer:
      "Upload one or more PNG images and our tool will combine them into a single PDF document. You can reorder images before conversion.",
  },
  {
    question: "Can I combine multiple PNG files?",
    answer:
      "Yes! Upload multiple PNG images and they will all be included in the PDF, with each image on its own page.",
  },
  {
    question: "What page size options are available?",
    answer:
      "We support A4, Letter, and original image size. A4 is the default and works well for most use cases.",
  },
  {
    question: "Is the image quality preserved?",
    answer:
      "Yes, PNG images are converted at full quality. The PDF will maintain the original image resolution.",
  },
  {
    question: "Are my files secure?",
    answer:
      "Yes, all uploads are encrypted using SSL/TLS. Files are processed on secure servers and automatically deleted after 24 hours.",
  },
];

const relatedTools = [
  { name: "PDF to PNG", href: "/tools/pdf-to-png", description: "Convert PDF to PNG images" },
  { name: "JPG to PDF", href: "/tools/jpg-to-pdf", description: "Convert JPG images to PDF" },
  { name: "Merge PDF", href: "/tools/merge-pdf", description: "Combine multiple PDFs" },
];

export default function PNGToPDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    downloadUrl: string;
    filename: string;
    pages?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles((prev) => [...prev, ...selectedFiles]);
    setResult(null);
    setError(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      setError("Please upload at least one PNG file");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("page_size", "a4");

      const response = await fetch("/api/png-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to convert images");
      }

      const data = await response.json();
      setProgress(100);
      setResult({
        downloadUrl: data.download_url,
        filename: data.filename,
        pages: data.pages,
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
      title="PNG to PDF"
      description="Convert PNG images to PDF documents. Combine multiple images into a single PDF file for easy sharing and printing."
      faqs={faqs}
      relatedTools={relatedTools}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        {!result ? (
          <>
            <FileUploadZone
              accept=".png"
              multiple={true}
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
                Drop PNG images here or <span className="text-cyan-400">browse</span>
              </p>
              <p className="text-sm text-gray-500">Select multiple images to combine into one PDF</p>
            </FileUploadZone>

            {files.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-sm text-gray-400 mb-2">{files.length} image{files.length > 1 ? "s" : ""} selected</p>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                    <div className="w-10 h-10 bg-cyan-600/20 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-cyan-400">PNG</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
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
                  <span className="text-sm text-gray-400">Converting to PDF...</span>
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
                disabled={files.length === 0 || isProcessing}
                className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Converting..." : "Convert to PDF"}
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
            <h3 className="text-xl font-semibold text-white mb-2">Images Converted Successfully!</h3>
            {result.pages && (
              <p className="text-gray-400 mb-4">Created PDF with {result.pages} page{result.pages > 1 ? "s" : ""}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <a
                href={result.downloadUrl}
                download={result.filename}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </a>
              <button
                onClick={() => {
                  setFiles([]);
                  setResult(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Convert More Images
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
