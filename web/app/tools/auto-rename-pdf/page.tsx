"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How does auto-rename work?",
    answer:
      "Our OCR engine scans the first page of your PDF and extracts key information like dates, invoice numbers, order numbers, and document types. It then generates a meaningful filename based on your template.",
  },
  {
    question: "What data can be extracted?",
    answer:
      "We detect: dates (various formats), invoice/order numbers, and document types (invoice, contract, receipt, order, quote). The extracted data is used to build the filename.",
  },
  {
    question: "Can I customize the filename format?",
    answer:
      "Yes! Use our template system with variables like {date}, {type}, and {number} to create your preferred naming convention.",
  },
  {
    question: "Does it work with scanned PDFs?",
    answer:
      "Yes, our advanced OCR can read text from scanned documents, making this tool work with both digital and scanned PDFs.",
  },
];

const relatedTools = [
  { name: "Document Detector", href: "/tools/document-detector", description: "Detect document types" },
  { name: "Split Invoices", href: "/tools/split-invoices", description: "Split by invoice numbers" },
  { name: "Extract Text", href: "/tools/extract-text-from-pdf", description: "Extract text with OCR" },
];

const benefits = [
  "Intelligent data extraction",
  "Customizable filename templates",
  "Multi-language support",
  "Works with scanned PDFs",
  "Date & number detection",
  "Document type recognition",
];

export default function AutoRenamePDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [template, setTemplate] = useState("{date}_{type}_{number}");
  const [dpi, setDpi] = useState(150);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    download_url: string;
    original_name: string;
    new_name: string;
    extracted_data: {
      date: string;
      type: string;
      number: string;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleRename = async () => {
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
      formData.append("template", template);
      formData.append("dpi", String(dpi));

      const response = await fetch("/api/auto-rename", {
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

  const templatePresets = [
    { label: "Date-Type-Number", value: "{date}_{type}_{number}" },
    { label: "Type-Number-Date", value: "{type}_{number}_{date}" },
    { label: "Number Only", value: "{number}" },
    { label: "Date-Number", value: "{date}_{number}" },
  ];

  return (
    <ToolPageLayout
      title="Auto-Rename PDF"
      description="Let AI read your PDF and suggest a meaningful filename based on its content. Extract dates, invoice numbers, and document types automatically."
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
                <div className="w-16 h-16 bg-yellow-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </div>
                <p className="text-lg text-white mb-2">
                  Drop your PDF here or <span className="text-blue-400">browse</span>
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
                    Filename Template
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {templatePresets.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setTemplate(preset.value)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          template === preset.value
                            ? "bg-yellow-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    placeholder="{date}_{type}_{number}"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Variables: {"{date}"} = detected date, {"{type}"} = document type, {"{number}"} = invoice/order number
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    OCR Quality (DPI)
                  </label>
                  <select
                    value={dpi}
                    onChange={(e) => setDpi(Number(e.target.value))}
                    className="w-full sm:w-48 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
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
                  <span className="text-sm text-gray-400">Analyzing document...</span>
                  <span className="text-sm text-gray-400">{progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={handleRename}
                disabled={!file || isProcessing}
                className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Analyzing..." : "Auto-Rename PDF"}
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
            <h3 className="text-xl font-semibold text-white mb-4">PDF Renamed Successfully!</h3>

            <div className="max-w-md mx-auto mb-6 space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-500 mb-1">Original filename</p>
                <p className="text-gray-400 line-through truncate">{result.original_name}</p>
              </div>
              <div className="flex justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-4 text-left">
                <p className="text-sm text-yellow-400 mb-1">New filename</p>
                <p className="text-white font-medium truncate">{result.new_name}</p>
              </div>
            </div>

            <div className="max-w-md mx-auto mb-6">
              <p className="text-sm text-gray-400 mb-3">Extracted Data:</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Date</p>
                  <p className="text-white">{result.extracted_data.date}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Type</p>
                  <p className="text-white">{result.extracted_data.type}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Number</p>
                  <p className="text-white">{result.extracted_data.number}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={result.download_url}
                download={result.new_name}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Renamed PDF
              </a>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Rename Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
