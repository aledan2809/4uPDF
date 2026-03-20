"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";
import { useAuth } from "../../lib/auth";

const faqs = [
  {
    question: "What data can be extracted from receipts?",
    answer:
      "The Receipt Extractor uses OCR to automatically extract merchant name, transaction date, and total amount from PDF receipts.",
  },
  {
    question: "What export formats are supported?",
    answer:
      "You can export extracted data to Excel (.xlsx) for expense tracking in spreadsheet tools, or JSON for programmatic processing and integrations.",
  },
  {
    question: "How many receipts can I process at once?",
    answer:
      "You can upload up to 100 PDF receipts in a single batch. The system processes them concurrently using multiple workers for maximum speed.",
  },
  {
    question: "Which plans include this feature?",
    answer:
      "Receipt extraction is a smart tool available exclusively for Silver and Gold plan subscribers. Perfect for expense tracking and accounting.",
  },
];

const relatedTools = [
  { name: "Invoice Extractor", href: "/tools/invoice-extractor", description: "Extract invoice data to Excel/JSON" },
  { name: "Archive Processor", href: "/tools/archive-processor", description: "Organize PDFs by type" },
  { name: "Document Detector", href: "/tools/document-detector", description: "Auto-detect document types" },
];

const benefits = [
  "Extract from 100+ receipts at once",
  "OCR-powered automatic detection",
  "Export to Excel or JSON",
  "Merchant, date, and amount fields",
  "Concurrent processing",
  "Automate expense tracking",
];

export default function ReceiptExtractorPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [exportFormat, setExportFormat] = useState<"excel" | "json">("excel");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    download_url: string;
    filename: string;
    total_files: number;
    successful: number;
    failed: number;
    export_format: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setResult(null);
    setError(null);
  }, []);

  const handleProcess = async () => {
    if (files.length === 0) {
      setError("Please upload at least one receipt PDF");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("export_format", exportFormat);

      const token = getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const uploadResponse = await fetch("http://localhost:3099/api/receipt-extractor/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.detail || "Failed to upload receipts");
      }

      const { job_id } = await uploadResponse.json();

      const pollStatus = async () => {
        const statusResponse = await fetch(`http://localhost:3099/api/batch-processing/status/${job_id}`);
        const statusData = await statusResponse.json();

        setProgress(statusData.progress || 0);

        if (statusData.status === "done") {
          return statusData;
        } else if (statusData.status === "error") {
          throw new Error(statusData.error || "Processing failed");
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return pollStatus();
        }
      };

      const data = await pollStatus();
      setProgress(100);
      setResult({
        download_url: data.download_url,
        filename: data.output_file,
        total_files: data.total_files,
        successful: data.total_files - data.errors.length,
        failed: data.errors.length,
        export_format: data.export_format
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
      title="Receipt Extractor"
      description="Upload multiple receipt PDFs and automatically extract key data (merchant name, date, amount) using OCR. Export results to Excel or JSON for expense tracking and accounting."
      faqs={faqs}
      relatedTools={relatedTools}
      benefits={benefits}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        <div className="mb-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <div>
              <p className="text-purple-300 font-medium">Smart Tool - Premium Feature</p>
              <p className="text-sm text-gray-400">Available for Silver & Gold subscribers</p>
            </div>
          </div>
        </div>

        {!result ? (
          <>
            {files.length === 0 ? (
              <FileUploadZone
                accept=".pdf"
                multiple={true}
                maxSizeMB={300}
                onFilesSelected={handleFilesSelected}
              >
                <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-lg text-white mb-2">
                  Drop receipt PDFs here or <span className="text-purple-400">browse</span>
                </p>
                <p className="text-sm text-gray-500">Up to 100 PDF files (300MB max per file)</p>
              </FileUploadZone>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium">{files.length} receipt{files.length > 1 ? 's' : ''} selected</h3>
                    <button
                      onClick={() => setFiles([])}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Export Format
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setExportFormat("excel")}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        exportFormat === "excel"
                          ? "border-purple-500 bg-purple-600/20"
                          : "border-gray-700 bg-gray-800 hover:border-gray-600"
                      }`}
                    >
                      <div className="text-white font-medium mb-1">Excel (.xlsx)</div>
                      <div className="text-sm text-gray-400">For expense tracking</div>
                    </button>
                    <button
                      onClick={() => setExportFormat("json")}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        exportFormat === "json"
                          ? "border-purple-500 bg-purple-600/20"
                          : "border-gray-700 bg-gray-800 hover:border-gray-600"
                      }`}
                    >
                      <div className="text-white font-medium mb-1">JSON</div>
                      <div className="text-sm text-gray-400">For API integration</div>
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
                  <span className="text-sm text-gray-400">Extracting receipt data...</span>
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
                onClick={handleProcess}
                disabled={files.length === 0 || isProcessing}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Extracting..." : "Extract Receipt Data"}
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
            <h3 className="text-xl font-semibold text-white mb-2">Data Extracted!</h3>
            <p className="text-gray-400 mb-4">
              Successfully processed {result.successful} of {result.total_files} receipts
            </p>

            {result.failed > 0 && (
              <div className="mb-6 bg-yellow-900/30 border border-yellow-800 rounded-lg p-3 text-yellow-300 text-sm max-w-lg mx-auto">
                <p>{result.failed} receipt{result.failed > 1 ? 's' : ''} could not be processed</p>
              </div>
            )}

            <a
              href={result.download_url}
              download={result.filename}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download {result.export_format === "excel" ? "Excel" : "JSON"} File
            </a>

            <div className="mt-4">
              <button
                onClick={() => {
                  setFiles([]);
                  setResult(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Extract More Receipts
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
