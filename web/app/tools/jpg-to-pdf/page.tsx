"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How do I convert JPG images to PDF?",
    answer:
      "Upload your JPG images, arrange them in the desired order, select your preferred page size, and click Convert. Your PDF will be ready in seconds.",
  },
  {
    question: "Can I convert multiple images at once?",
    answer:
      "Yes! You can upload multiple JPG images and combine them into a single PDF document. Drag to reorder before converting.",
  },
  {
    question: "What image formats are supported?",
    answer:
      "We support JPG, JPEG, and PNG image formats for conversion to PDF.",
  },
  {
    question: "Can I choose the page size?",
    answer:
      "Yes! Choose between A4, Letter, or Original size (maintains the image dimensions).",
  },
  {
    question: "Are my images secure?",
    answer:
      "Yes, all uploads are encrypted and files are automatically deleted from our servers after 24 hours.",
  },
];

const relatedTools = [
  { name: "PDF to JPG", href: "/tools/pdf-to-jpg", description: "Convert PDF pages to images" },
  { name: "Merge PDF", href: "/tools/merge-pdf", description: "Combine multiple PDFs" },
  { name: "Compress PDF", href: "/tools/compress-pdf", description: "Reduce PDF file size" },
];

interface UploadedFile {
  file: File;
  id: string;
  preview: string;
}

type PageSize = "a4" | "letter" | "original";

export default function JPGToPDFPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    downloadUrl: string;
    filename: string;
    pages: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    const newFiles = selectedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
    setError(null);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
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

  const handleConvert = async () => {
    if (files.length === 0) {
      setError("Please upload at least one image");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append("files", f.file);
      });
      formData.append("page_size", pageSize);

      const response = await fetch("/api/jpg-to-pdf", {
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
      title="JPG to PDF"
      description="Convert JPG images to PDF documents. Upload multiple images and combine them into a single PDF file."
      faqs={faqs}
      relatedTools={relatedTools}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        {!result ? (
          <>
            <FileUploadZone
              accept=".jpg,.jpeg,.png"
              multiple={true}
              maxSizeMB={50}
              onFilesSelected={handleFilesSelected}
            >
              <div className="w-16 h-16 bg-orange-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-orange-400"
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
                Drop images here or <span className="text-blue-400">browse</span>
              </p>
              <p className="text-sm text-gray-500">JPG, JPEG, PNG supported (Max 50MB each)</p>
            </FileUploadZone>

            {files.length > 0 && (
              <>
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-300">
                      Images to convert ({files.length})
                    </h3>
                    <p className="text-xs text-gray-500">Drag to reorder</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {files.map((f, index) => (
                      <div
                        key={f.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`relative group cursor-move ${
                          draggedIndex === index ? "opacity-50" : ""
                        }`}
                      >
                        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-800">
                          <img
                            src={f.preview}
                            alt={f.file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                          #{index + 1}
                        </div>
                        <button
                          onClick={() => removeFile(f.id)}
                          className="absolute top-2 right-2 p-1 bg-black/60 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <p className="mt-1 text-xs text-gray-500 truncate">{f.file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Page Size
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setPageSize("a4")}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        pageSize === "a4"
                          ? "bg-orange-600/20 border-orange-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="font-medium">A4</div>
                      <div className="text-xs opacity-70">210 x 297 mm</div>
                    </button>
                    <button
                      onClick={() => setPageSize("letter")}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        pageSize === "letter"
                          ? "bg-orange-600/20 border-orange-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="font-medium">Letter</div>
                      <div className="text-xs opacity-70">8.5 x 11 in</div>
                    </button>
                    <button
                      onClick={() => setPageSize("original")}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        pageSize === "original"
                          ? "bg-orange-600/20 border-orange-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
                      }`}
                    >
                      <div className="font-medium">Original</div>
                      <div className="text-xs opacity-70">Image size</div>
                    </button>
                  </div>
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
                  <span className="text-sm text-gray-400">Converting images to PDF...</span>
                  <span className="text-sm text-gray-400">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={handleConvert}
                disabled={files.length === 0 || isProcessing}
                className="px-8 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
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
            <p className="text-gray-400 mb-6">
              Created PDF with {result.pages} page{result.pages > 1 ? "s" : ""}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={result.downloadUrl}
                download={result.filename}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </a>
              <button
                onClick={() => {
                  files.forEach((f) => URL.revokeObjectURL(f.preview));
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
