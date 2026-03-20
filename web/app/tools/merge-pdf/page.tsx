"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";
import UpgradePrompt from "../../components/UpgradePrompt";
import { useUsageCheck } from "../../lib/auth";

const faqs = [
  {
    question: "How do I merge PDF files?",
    answer:
      "Simply upload your PDF files, arrange them in the order you want, and click Merge. Your combined PDF will be ready for download in seconds.",
  },
  {
    question: "Is there a limit to how many PDFs I can merge?",
    answer:
      "Free users can merge up to 10 PDF files at once, with a total size of 50MB. Premium users can merge unlimited files up to 500MB.",
  },
  {
    question: "Will merging PDFs reduce quality?",
    answer:
      "No, merging PDFs with 4uPDF maintains the original quality of all your documents. We don't compress or modify the content.",
  },
  {
    question: "Can I rearrange the order of PDFs before merging?",
    answer:
      "Yes! After uploading, you can drag and drop to rearrange the files in any order before merging.",
  },
  {
    question: "Are my files secure?",
    answer:
      "Absolutely. All uploads are encrypted, and files are automatically deleted from our servers after 24 hours.",
  },
];

const relatedTools = [
  { name: "Split PDF", href: "/tools/split-pdf", description: "Split a PDF into multiple files" },
  { name: "Compress PDF", href: "/tools/compress-pdf", description: "Reduce PDF file size" },
  { name: "PDF to JPG", href: "/tools/pdf-to-jpg", description: "Convert PDF pages to images" },
];

interface UploadedFile {
  file: File;
  id: string;
}

export default function MergePDFPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ downloadUrl: string; filename: string; pages: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"limit_reached" | "file_too_large">("limit_reached");
  const { checkCanProcess, recordUsage } = useUsageCheck();

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    const newFiles = selectedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
    setError(null);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...files];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedFile);
    setFiles(newFiles);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Please upload at least 2 PDF files to merge");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    // Calculate total file size in MB
    const totalSizeMB = files.reduce((sum, f) => sum + f.file.size, 0) / (1024 * 1024);

    // Check limits before processing (estimate ~10 pages per file for merge)
    const estimatedPages = files.length * 10;
    const limitCheck = await checkCanProcess(estimatedPages, totalSizeMB);

    if (!limitCheck.allowed) {
      setIsProcessing(false);
      setUpgradeReason(limitCheck.reason || "limit_reached");
      setShowUpgradePrompt(true);
      return;
    }

    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append("files", f.file);
      });

      const response = await fetch("/api/merge", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to merge PDFs");
      }

      const data = await response.json();
      setProgress(100);
      setResult({
        downloadUrl: data.download_url,
        filename: data.filename,
        pages: data.pages,
      });

      // Record usage for anonymous users
      await recordUsage(data.pages || estimatedPages);
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
    <>
      {showUpgradePrompt && (
        <UpgradePrompt
          reason={upgradeReason}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
    <ToolPageLayout
      title="Merge PDF"
      description="Combine multiple PDF files into a single document. Drag and drop to arrange pages in any order."
      faqs={faqs}
      relatedTools={relatedTools}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        {!result ? (
          <>
            <FileUploadZone
              accept=".pdf"
              multiple={true}
              onFilesSelected={handleFilesSelected}
            >
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <p className="text-lg text-white mb-2">
                Drop PDFs here or <span className="text-blue-400">browse</span>
              </p>
              <p className="text-sm text-gray-500">Select multiple files to merge</p>
            </FileUploadZone>

            {files.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300">
                    Files to merge ({files.length})
                  </h3>
                  <p className="text-xs text-gray-500">Drag to reorder</p>
                </div>
                <div className="space-y-2">
                  {files.map((f, index) => (
                    <div
                      key={f.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-move group ${
                        draggedIndex === index ? "opacity-50" : ""
                      }`}
                    >
                      <div className="text-gray-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                        </svg>
                      </div>
                      <div className="w-8 h-8 bg-red-600/20 rounded flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{f.file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(f.file.size)}</p>
                      </div>
                      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-700 rounded">
                        #{index + 1}
                      </span>
                      <button
                        onClick={() => removeFile(f.id)}
                        className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
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
                  <span className="text-sm text-gray-400">Merging PDFs...</span>
                  <span className="text-sm text-gray-400">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={handleMerge}
                disabled={files.length < 2 || isProcessing}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Merging..." : "Merge PDFs"}
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
            <h3 className="text-xl font-semibold text-white mb-2">PDFs Merged Successfully!</h3>
            <p className="text-gray-400 mb-6">
              Combined {files.length} files into {result.pages} pages
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={result.downloadUrl}
                download={result.filename}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Merged PDF
              </a>
              <button
                onClick={() => {
                  setFiles([]);
                  setResult(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Merge More Files
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
    </>
  );
}
