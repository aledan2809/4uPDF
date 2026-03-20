"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";
import { useAuth } from "../../lib/auth";

const faqs = [
  {
    question: "What types of documents can be detected?",
    answer:
      "The Archive Processor can automatically detect invoices, receipts, contracts, and other document types based on their content using OCR analysis.",
  },
  {
    question: "How are files organized?",
    answer:
      "Files are organized into folders (Invoices/, Receipts/, Contracts/, Other/) based on document type detection. You can also choose to rename files by their detected identifiers.",
  },
  {
    question: "What's the maximum archive size?",
    answer:
      "Silver plan users can upload up to 300MB archives, while Gold plan users can upload up to 500MB. The archive can contain up to 100 PDF files.",
  },
  {
    question: "Is this feature free?",
    answer:
      "Archive processing is a premium feature available exclusively to Silver and Gold plan subscribers. It's designed for power users who need to process large volumes of documents.",
  },
];

const relatedTools = [
  { name: "Invoice Extractor", href: "/tools/invoice-extractor", description: "Extract invoice data to Excel/JSON" },
  { name: "Receipt Extractor", href: "/tools/receipt-extractor", description: "Extract receipt data automatically" },
  { name: "Document Detector", href: "/tools/document-detector", description: "Detect document types" },
];

const benefits = [
  "Process 100+ PDFs at once",
  "Automatic document type detection",
  "Organize into categorized folders",
  "Auto-rename by document identifier",
  "Download organized ZIP archive",
  "Save hours of manual sorting",
];

export default function ArchiveProcessorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [organizeBy, setOrganizeBy] = useState<"type" | "identifier">("type");
  const [dpi, setDpi] = useState(150);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    download_url: string;
    filename: string;
    total_files: number;
    files_by_type: Record<string, number>;
    errors: Array<{ file: string; error: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleProcess = async () => {
    if (!file) {
      setError("Please upload a ZIP archive first");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("organize_by", organizeBy);
      formData.append("dpi", String(dpi));

      const token = getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const uploadResponse = await fetch("http://localhost:3099/api/archive-processor/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.detail || "Failed to upload archive");
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
        files_by_type: data.files_by_type || {},
        errors: data.errors || []
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
      title="Archive Processor"
      description="Upload a ZIP archive with multiple PDFs. We'll auto-detect document types, organize them into folders (Invoices, Receipts, Contracts), and create an organized archive for download."
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
              <p className="text-purple-300 font-medium">Premium Feature</p>
              <p className="text-sm text-gray-400">Available for Silver & Gold subscribers</p>
            </div>
          </div>
        </div>

        {!result ? (
          <>
            {!file ? (
              <FileUploadZone
                accept=".zip"
                multiple={false}
                maxSizeMB={300}
                onFilesSelected={handleFilesSelected}
              >
                <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <p className="text-lg text-white mb-2">
                  Drop your ZIP archive here or <span className="text-purple-400">browse</span>
                </p>
                <p className="text-sm text-gray-500">ZIP containing PDF files (max 100 files, 300MB)</p>
              </FileUploadZone>
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg mb-6">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Organize By
                    </label>
                    <select
                      value={organizeBy}
                      onChange={(e) => setOrganizeBy(e.target.value as "type" | "identifier")}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="type">Document Type (Invoices/, Receipts/)</option>
                      <option value="identifier">Document Identifier (rename files)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      OCR Quality (DPI)
                    </label>
                    <select
                      value={dpi}
                      onChange={(e) => setDpi(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value={100}>Fast (100 DPI)</option>
                      <option value={150}>Standard (150 DPI)</option>
                      <option value={200}>High (200 DPI)</option>
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
                  <span className="text-sm text-gray-400">Processing archive...</span>
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
                disabled={!file || isProcessing}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Processing..." : "Process Archive"}
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
            <h3 className="text-xl font-semibold text-white mb-2">Archive Processed!</h3>
            <p className="text-gray-400 mb-4">
              Organized {result.total_files} files into categorized folders
            </p>

            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {Object.entries(result.files_by_type).map(([type, count]) => (
                <span key={type} className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                  {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
                </span>
              ))}
            </div>

            {result.errors.length > 0 && (
              <div className="mb-6 bg-yellow-900/30 border border-yellow-800 rounded-lg p-3 text-yellow-300 text-sm text-left max-w-lg mx-auto">
                <p className="font-medium mb-2">{result.errors.length} files had issues:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {result.errors.slice(0, 3).map((err, i) => (
                    <li key={i}>{err.file}: {err.error}</li>
                  ))}
                  {result.errors.length > 3 && (
                    <li>...and {result.errors.length - 3} more</li>
                  )}
                </ul>
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
              Download Organized Archive
            </a>

            <div className="mt-4">
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Process Another Archive
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
