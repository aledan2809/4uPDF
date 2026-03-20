"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";
import { useAuth } from "../../lib/auth";

const faqs = [
  {
    question: "How does batch document splitting work?",
    answer:
      "Upload multiple large PDFs and we'll automatically detect document boundaries (like invoices, orders, or sections) using OCR, then split them into separate files. Perfect for processing scanned archives.",
  },
  {
    question: "What boundary patterns can be detected?",
    answer:
      "The default pattern detects common markers like 'Page 1', 'Document #', or 'Order #'. You can also provide custom regex patterns to match your specific document structure.",
  },
  {
    question: "How many files can I process at once?",
    answer:
      "You can batch process up to 100 PDF files in a single operation. All split results are packaged into a ZIP file for easy download.",
  },
  {
    question: "Is this feature free?",
    answer:
      "Batch document splitting is a premium feature available to Silver and Gold plan subscribers. It's designed for users who need to process large volumes of documents.",
  },
];

const relatedTools = [
  { name: "Archive Processor", href: "/tools/archive-processor", description: "Organize PDFs by document type" },
  { name: "Split by Text", href: "/tools/split-by-text", description: "Split PDFs by text markers" },
  { name: "Split Invoices", href: "/tools/split-invoices", description: "Auto-split invoice batches" },
];

const benefits = [
  "Process up to 100 PDFs simultaneously",
  "Automatic boundary detection via OCR",
  "Custom regex pattern support",
  "Download all results as ZIP",
  "Real-time progress tracking",
  "Save hours on manual splitting",
];

export default function BatchDocumentSplitterPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [splitPattern, setSplitPattern] = useState<"order" | "page">("order");
  const [dpi, setDpi] = useState(150);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    job_id: string;
    download_url: string;
    zip_filename: string;
    total_source_files: number;
    total_split_files: number;
    files: Array<{ marker: string; pages: number; filename: string }>;
    errors: Array<{ file: string; error: string }>;
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
      setError("Please upload at least one PDF file");
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
      formData.append("split_pattern", splitPattern);

      const token = getToken();
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const uploadResponse = await fetch("http://localhost:3099/api/batch-document-splitter/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.detail || "Failed to upload documents");
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

      const total_split_files = data.results?.reduce((sum: number, r: any) => sum + (r.files?.length || 0), 0) || 0;

      setResult({
        job_id: data.id,
        download_url: data.download_url,
        zip_filename: data.output_file,
        total_source_files: data.total_files,
        total_split_files: total_split_files,
        files: [],
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

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <ToolPageLayout
      title="Batch Document Splitter"
      description="Upload multiple large PDFs and automatically split them by detected document boundaries. Perfect for processing scanned archives, invoices, or multi-document files."
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
            {files.length === 0 ? (
              <FileUploadZone
                accept=".pdf"
                multiple={true}
                maxSizeMB={300}
                onFilesSelected={handleFilesSelected}
              >
                <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg text-white mb-2">
                  Drop your PDF files here or <span className="text-purple-400">browse</span>
                </p>
                <p className="text-sm text-gray-500">Multiple PDFs, up to 100 files, 300MB each</p>
              </FileUploadZone>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">
                      Files to Process ({files.length})
                    </label>
                    <button
                      onClick={() => setFiles([])}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        <div className="w-8 h-8 bg-red-600/20 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
                          </svg>
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
                </div>

                <div className="grid grid-cols-1 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Split Pattern
                    </label>
                    <select
                      value={splitPattern}
                      onChange={(e) => setSplitPattern(e.target.value as "order" | "page")}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="order">By Order/Invoice Number (OCR Detection)</option>
                      <option value="page">By Single Pages</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      Order mode detects invoice/order numbers and groups pages together
                    </p>
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
                  <span className="text-sm text-gray-400">Processing documents...</span>
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
                {isProcessing ? "Processing..." : `Split ${files.length} File${files.length !== 1 ? "s" : ""}`}
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
            <h3 className="text-xl font-semibold text-white mb-2">Batch Splitting Complete!</h3>
            <p className="text-gray-400 mb-4">
              Processed {result.total_source_files} source files into {result.total_split_files} split documents
            </p>

            {result.errors.length > 0 && (
              <div className="mb-6 bg-yellow-900/30 border border-yellow-800 rounded-lg p-3 text-yellow-300 text-sm text-left max-w-lg mx-auto">
                <p className="font-medium mb-2">{result.errors.length} files had issues:</p>
                <ul className="list-disc pl-5 space-y-1">
                  {result.errors.slice(0, 3).map((err, i) => (
                    <li key={i}>{err.error}</li>
                  ))}
                  {result.errors.length > 3 && (
                    <li>...and {result.errors.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            <a
              href={result.download_url}
              download={result.zip_filename}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download ZIP ({result.total_split_files} files)
            </a>

            <div className="mt-4">
              <button
                onClick={() => {
                  setFiles([]);
                  setResult(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Process More Documents
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
