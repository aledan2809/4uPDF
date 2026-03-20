"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How does invoice splitting work?",
    answer:
      "Our OCR engine scans each page looking for invoice numbers (Factura, Invoice, Nr. fact, etc.). When a new invoice number is detected, it creates a new PDF file for that invoice.",
  },
  {
    question: "What invoice formats are supported?",
    answer:
      "We detect various invoice formats including 'Factura', 'Invoice', 'Nr. factura', 'Invoice Number', 'Invoice #', and similar patterns in multiple languages.",
  },
  {
    question: "Can I customize the detection pattern?",
    answer:
      "Yes! Advanced users can customize the regex pattern for invoice detection to match their specific invoice format.",
  },
  {
    question: "What happens if some pages have no invoice number?",
    answer:
      "Pages without a detected invoice number are grouped with the previous invoice. If no invoice was detected before them, they're saved as a separate 'no invoice detected' file.",
  },
];

const relatedTools = [
  { name: "Split by Text", href: "/tools/split-by-text", description: "Split by any text pattern" },
  { name: "Auto-Rename PDF", href: "/tools/auto-rename-pdf", description: "Rename by document content" },
  { name: "Document Detector", href: "/tools/document-detector", description: "Detect document types" },
];

const benefits = [
  "Automatic invoice detection",
  "Multi-language support (EN/RO)",
  "Preserves document quality",
  "Custom pattern support",
  "Named files by invoice number",
  "Handles multi-page invoices",
];

export default function SplitInvoicesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [filenameTemplate, setFilenameTemplate] = useState("{invoice}");
  const [useCustomPattern, setUseCustomPattern] = useState(false);
  const [customPattern, setCustomPattern] = useState("");
  const [dpi, setDpi] = useState(150);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    files: Array<{ filename: string; download_url: string; invoice: string; pages: number }>;
    total_invoices: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleSplit = async () => {
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
      formData.append("filename_template", filenameTemplate);
      formData.append("dpi", String(dpi));

      if (useCustomPattern && customPattern.trim()) {
        formData.append("invoice_pattern", customPattern);
      }

      const response = await fetch("/api/split-invoices", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to split invoices");
      }

      const data = await response.json();
      setProgress(100);
      setResult({
        files: data.files,
        total_invoices: data.total_invoices,
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
      title="Split Invoices"
      description="Automatically split multi-invoice PDFs by detecting invoice numbers. Perfect for accounting, bookkeeping, and batch invoice processing."
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
                <div className="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-400"
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
                  Drop your multi-invoice PDF here or <span className="text-blue-400">browse</span>
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

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Output Filename Template
                  </label>
                  <input
                    type="text"
                    value={filenameTemplate}
                    onChange={(e) => setFilenameTemplate(e.target.value)}
                    placeholder="{invoice}"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Variables: {"{invoice}"} = invoice number, {"{pages}"} = page count, {"{index}"} = file index
                  </p>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomPattern}
                      onChange={(e) => setUseCustomPattern(e.target.checked)}
                      className="w-4 h-4 text-green-600 bg-gray-800 border-gray-700 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-300">Use custom invoice pattern (advanced)</span>
                  </label>
                </div>

                {useCustomPattern && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Custom Invoice Pattern (Regex)
                    </label>
                    <input
                      type="text"
                      value={customPattern}
                      onChange={(e) => setCustomPattern(e.target.value)}
                      placeholder="(?:Factura|Invoice)[:\s]*([A-Z0-9\-]+)"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-green-500"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Use capturing group () for the invoice number
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    OCR Quality (DPI)
                  </label>
                  <select
                    value={dpi}
                    onChange={(e) => setDpi(Number(e.target.value))}
                    className="w-full sm:w-48 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                  >
                    <option value={100}>Fast (100 DPI)</option>
                    <option value={150}>Standard (150 DPI)</option>
                    <option value={200}>High (200 DPI)</option>
                    <option value={300}>Best (300 DPI)</option>
                  </select>
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
                  <span className="text-sm text-gray-400">Detecting invoices...</span>
                  <span className="text-sm text-gray-400">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={handleSplit}
                disabled={!file || isProcessing}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Processing..." : "Split Invoices"}
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
            <h3 className="text-xl font-semibold text-white mb-2">Invoices Split Successfully!</h3>
            <p className="text-gray-400 mb-6">
              Detected {result.total_invoices} invoice{result.total_invoices !== 1 ? "s" : ""}, created {result.files.length} file{result.files.length !== 1 ? "s" : ""}
            </p>

            <div className="space-y-2 max-w-lg mx-auto mb-6">
              {result.files.map((f, index) => (
                <a
                  key={index}
                  href={f.download_url}
                  download={f.filename}
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors group"
                >
                  <div className="w-8 h-8 bg-green-600/20 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm text-white truncate">{f.filename}</p>
                    <p className="text-xs text-gray-500">
                      Invoice: {f.invoice} | {f.pages} page{f.pages !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              ))}
            </div>

            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Split More Invoices
            </button>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
