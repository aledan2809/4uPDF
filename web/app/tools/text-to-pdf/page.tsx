"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How do I create a PDF from text?",
    answer:
      "You can either paste text directly into the text area or upload a .txt file. Our tool will convert it to a properly formatted PDF document.",
  },
  {
    question: "Can I customize the font size?",
    answer:
      "Yes, you can choose from different font sizes to make your PDF more readable. The default is 12pt which works well for most documents.",
  },
  {
    question: "What about text formatting?",
    answer:
      "The tool preserves line breaks and paragraphs. For more advanced formatting, consider using Word to PDF conversion.",
  },
  {
    question: "Is there a character limit?",
    answer:
      "There is no strict character limit for free users, but very large text files may take longer to process.",
  },
  {
    question: "Are my files secure?",
    answer:
      "Yes, all uploads are encrypted using SSL/TLS. Files are processed on secure servers and automatically deleted after 24 hours.",
  },
];

const relatedTools = [
  { name: "PDF to Text", href: "/tools/pdf-to-text", description: "Extract text from PDF" },
  { name: "Word to PDF", href: "/tools/word-to-pdf", description: "Convert Word to PDF" },
  { name: "Merge PDF", href: "/tools/merge-pdf", description: "Combine multiple PDFs" },
];

export default function TextToPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(12);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    downloadUrl: string;
    filename: string;
    pages?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      setText("");
      setResult(null);
      setError(null);
    }
  }, []);

  const handleConvert = async () => {
    if (!file && !text.trim()) {
      setError("Please upload a text file or enter some text");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      } else {
        formData.append("text", text);
      }
      formData.append("font_size", fontSize.toString());

      const response = await fetch("/api/text-to-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to create PDF");
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
      title="Text to PDF"
      description="Create PDF documents from plain text. Convert your text files or paste content directly to generate a professional PDF."
      faqs={faqs}
      relatedTools={relatedTools}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        {!result ? (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Option 1: Upload a text file
              </label>
              {!file ? (
                <FileUploadZone
                  accept=".txt"
                  multiple={false}
                  maxSizeMB={10}
                  onFilesSelected={handleFilesSelected}
                >
                  <div className="py-6">
                    <p className="text-sm text-gray-400">
                      Drop a .txt file here or <span className="text-blue-400">browse</span>
                    </p>
                  </div>
                </FileUploadZone>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                  <div className="w-10 h-10 bg-gray-600/20 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-gray-400">TXT</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Option 2: Enter text directly
                </label>
                {file && (
                  <span className="text-xs text-gray-500">(disabled when file is uploaded)</span>
                )}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!!file}
                placeholder="Paste or type your text here..."
                className="w-full h-48 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Font Size: {fontSize}pt
              </label>
              <input
                type="range"
                min="8"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>8pt</span>
                <span>24pt</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            {isProcessing && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Creating PDF...</span>
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

            <div className="text-center">
              <button
                onClick={handleConvert}
                disabled={(!file && !text.trim()) || isProcessing}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Creating PDF..." : "Create PDF"}
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
            <h3 className="text-xl font-semibold text-white mb-2">PDF Created Successfully!</h3>
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
                  setFile(null);
                  setText("");
                  setResult(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Create Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
