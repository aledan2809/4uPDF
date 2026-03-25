"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How do I annotate a PDF?",
    answer:
      "Upload your PDF file, enter the text you want to highlight, choose a highlight color, and optionally specify which pages to annotate. Click 'Annotate PDF' and your highlighted PDF will be ready for download.",
  },
  {
    question: "What colors are available for highlighting?",
    answer:
      "You can choose from yellow, green, blue, and pink highlight colors to annotate your PDF text.",
  },
  {
    question: "Can I highlight text on specific pages only?",
    answer:
      "Yes! You can apply annotations to all pages or specify individual pages (e.g., '1,3,5') or page ranges (e.g., '1-5').",
  },
  {
    question: "Does this modify the original text?",
    answer:
      "No, highlighting adds an annotation layer on top of the text. The original text content remains unchanged.",
  },
  {
    question: "What if the text is not found in the PDF?",
    answer:
      "If the search text is not found on the specified pages, the PDF will be returned without annotations. Make sure the text matches exactly as it appears in the document.",
  },
];

const relatedTools = [
  { name: "Redact PDF", href: "/tools/redact-pdf", description: "Black out sensitive text" },
  { name: "Edit PDF", href: "/tools/edit-pdf", description: "Edit text and images" },
  { name: "Watermark PDF", href: "/tools/watermark-pdf", description: "Add watermarks to PDF" },
];

export default function AnnotatePDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [annotationText, setAnnotationText] = useState<string>("");
  const [pages, setPages] = useState<string>("all");
  const [color, setColor] = useState<string>("yellow");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ downloadUrl: string; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleAnnotate = async () => {
    if (!file) {
      setError("Please upload a PDF file");
      return;
    }
    if (!annotationText.trim()) {
      setError("Please enter text to highlight");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("annotation_text", annotationText);
      formData.append("pages", pages);
      formData.append("color", color);

      const response = await fetch("/api/annotate-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to annotate PDF");
      }

      const data = await response.json();
      setProgress(100);
      setResult({
        downloadUrl: data.download_url,
        filename: data.filename,
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

  const colors = [
    { value: "yellow", label: "Yellow", bg: "bg-yellow-400" },
    { value: "green", label: "Green", bg: "bg-green-400" },
    { value: "blue", label: "Blue", bg: "bg-blue-400" },
    { value: "pink", label: "Pink", bg: "bg-pink-400" },
  ];

  return (
    <ToolPageLayout
      title="Annotate PDF"
      description="Add highlight annotations to your PDF documents. Search for text and highlight it in your chosen color."
      faqs={faqs}
      relatedTools={relatedTools}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        {!result ? (
          <>
            <FileUploadZone
              accept=".pdf"
              multiple={false}
              maxSizeMB={50}
              onFilesSelected={handleFilesSelected}
            />

            {file && (
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  <div className="w-10 h-10 bg-red-600/20 rounded flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 text-gray-500 hover:text-red-400"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Text to Highlight
                    </label>
                    <input
                      type="text"
                      value={annotationText}
                      onChange={(e) => setAnnotationText(e.target.value)}
                      placeholder="Enter text to search and highlight"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Highlight Color
                    </label>
                    <div className="flex gap-3">
                      {colors.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setColor(c.value)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                            color === c.value
                              ? "border-blue-500 bg-gray-700"
                              : "border-gray-700 bg-gray-800 hover:border-gray-600"
                          }`}
                        >
                          <span className={`w-4 h-4 rounded ${c.bg}`} />
                          <span className="text-sm text-white">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Pages
                    </label>
                    <input
                      type="text"
                      value={pages}
                      onChange={(e) => setPages(e.target.value)}
                      placeholder="all, 1-5, 1,3,5"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
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
                  <span className="text-sm text-gray-400">Annotating PDF...</span>
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
                onClick={handleAnnotate}
                disabled={!file || !annotationText.trim() || isProcessing}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Annotating..." : "Annotate PDF"}
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
            <h3 className="text-xl font-semibold text-white mb-2">PDF Annotated Successfully!</h3>
            <p className="text-gray-400 mb-6">Your PDF has been highlighted with the specified text.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={result.downloadUrl}
                download={result.filename}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Annotated PDF
              </a>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Annotate Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
