"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "What is OCR?",
    answer:
      "OCR (Optical Character Recognition) is technology that converts scanned documents, images, or PDFs into searchable and editable text.",
  },
  {
    question: "Which languages does your OCR support?",
    answer:
      "We support 100+ languages including English, Spanish, French, German, Chinese, Japanese, Arabic, Romanian, and many more.",
  },
  {
    question: "How accurate is the OCR?",
    answer:
      "Our OCR achieves 95-99% accuracy on clear documents. Quality depends on scan resolution, font clarity, and document condition.",
  },
  {
    question: "What's the difference between OCR PDF and Searchable PDF?",
    answer:
      "Both tools add a text layer to scanned PDFs. OCR PDF focuses on making text searchable while preserving the original look, while Searchable PDF is optimized for text selection and copying.",
  },
];

const relatedTools = [
  { name: "Extract Text", href: "/tools/extract-text-from-pdf", description: "Export OCR text to file" },
  { name: "Searchable PDF", href: "/tools/searchable-pdf", description: "Make PDFs text-searchable" },
  { name: "Document Detector", href: "/tools/document-detector", description: "Detect document types" },
];

const benefits = [
  "100+ language support",
  "High accuracy OCR engine",
  "Preserve original layout",
  "Make PDFs searchable",
  "Extract text for editing",
  "Works with scanned documents",
];

export default function OCRPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("auto");
  const [dpi, setDpi] = useState(300);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    download_url: string;
    filename: string;
    pages_processed: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleOCR = async () => {
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
      formData.append("language", language);
      formData.append("dpi", String(dpi));

      const response = await fetch("/api/ocr-layer", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to process PDF");
      }

      const data = await response.json();
      setProgress(100);
      setResult(data);
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
      title="OCR PDF"
      description="Convert scanned PDFs to searchable text. Our advanced OCR technology recognizes text in 100+ languages with high accuracy."
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
                  Drop your scanned PDF here or <span className="text-blue-400">browse</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Document Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="auto">Auto-detect</option>
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                      <option value="ro">Romanian</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      OCR Quality (DPI)
                    </label>
                    <select
                      value={dpi}
                      onChange={(e) => setDpi(Number(e.target.value))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value={150}>Fast (150 DPI)</option>
                      <option value={200}>Standard (200 DPI)</option>
                      <option value={300}>High (300 DPI) - Recommended</option>
                      <option value={400}>Best (400 DPI)</option>
                    </select>
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
                  <span className="text-sm text-gray-400">Processing OCR...</span>
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
                onClick={handleOCR}
                disabled={!file || isProcessing}
                className="px-8 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Processing..." : "Start OCR"}
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
            <h3 className="text-xl font-semibold text-white mb-2">OCR Completed Successfully!</h3>
            <p className="text-gray-400 mb-6">
              Processed {result.pages_processed} page{result.pages_processed !== 1 ? "s" : ""}. Your PDF is now searchable.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={result.download_url}
                download={result.filename}
                className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Searchable PDF
              </a>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Process Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
