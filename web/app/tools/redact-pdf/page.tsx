"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How do I redact text in a PDF?",
    answer:
      "Upload your PDF file, enter the text you want to redact, optionally specify which pages to redact, and click 'Redact PDF'. The matching text will be permanently blacked out.",
  },
  {
    question: "Is the redaction permanent?",
    answer:
      "Yes! The redacted text is permanently removed from the PDF. It cannot be recovered or revealed by selecting, copying, or any other method.",
  },
  {
    question: "Can I redact text on specific pages only?",
    answer:
      "Yes! You can apply redactions to all pages or specify individual pages (e.g., '1,3,5') or page ranges (e.g., '1-5').",
  },
  {
    question: "Can I redact multiple different words or phrases?",
    answer:
      "Currently, you can redact one text phrase at a time. To redact multiple phrases, process the PDF multiple times with different text entries.",
  },
  {
    question: "What happens if the text is not found?",
    answer:
      "If the search text is not found on the specified pages, the PDF will be returned unchanged. Make sure the text matches exactly as it appears in the document.",
  },
];

const relatedTools = [
  { name: "Annotate PDF", href: "/tools/annotate-pdf", description: "Highlight text in PDF" },
  { name: "Protect PDF", href: "/tools/protect-pdf", description: "Add password protection" },
  { name: "Flatten PDF", href: "/tools/flatten-pdf", description: "Flatten form fields" },
];

export default function RedactPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [redactText, setRedactText] = useState<string>("");
  const [pages, setPages] = useState<string>("all");
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

  const handleRedact = async () => {
    if (!file) {
      setError("Please upload a PDF file");
      return;
    }
    if (!redactText.trim()) {
      setError("Please enter text to redact");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("redact_text", redactText);
      formData.append("pages", pages);

      const response = await fetch("/api/redact-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to redact PDF");
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

  return (
    <ToolPageLayout
      title="Redact PDF"
      description="Permanently black out sensitive text in your PDF documents. Search for text and redact it securely."
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
                      Text to Redact
                    </label>
                    <input
                      type="text"
                      value={redactText}
                      onChange={(e) => setRedactText(e.target.value)}
                      placeholder="Enter text to search and black out"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This text will be permanently removed and blacked out from the PDF.
                    </p>
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
                  <span className="text-sm text-gray-400">Redacting PDF...</span>
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
                onClick={handleRedact}
                disabled={!file || !redactText.trim() || isProcessing}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Redacting..." : "Redact PDF"}
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
            <h3 className="text-xl font-semibold text-white mb-2">PDF Redacted Successfully!</h3>
            <p className="text-gray-400 mb-6">Sensitive text has been permanently blacked out from your PDF.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={result.downloadUrl}
                download={result.filename}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Redacted PDF
              </a>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Redact Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
