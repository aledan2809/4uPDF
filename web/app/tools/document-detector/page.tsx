"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How does document detection work?",
    answer:
      "Our system scans your PDF using OCR and analyzes the text for keywords associated with different document types. It uses pattern matching to classify documents into categories like invoices, contracts, receipts, forms, and more.",
  },
  {
    question: "What document types can be detected?",
    answer:
      "We can detect: Invoices, Contracts, Receipts, Forms, Letters, Reports, ID Documents, and Bank Statements. The system works with documents in multiple languages including English and Romanian.",
  },
  {
    question: "How accurate is the detection?",
    answer:
      "Accuracy varies based on document clarity and content. We provide confidence levels (High, Medium, Low) to indicate how certain we are about the classification. High confidence means strong keyword matches.",
  },
  {
    question: "Can I see which keywords were matched?",
    answer:
      "Yes! The results show all matched keywords for each document type, helping you understand why a particular classification was made.",
  },
];

const relatedTools = [
  { name: "Auto-Rename PDF", href: "/tools/auto-rename-pdf", description: "Rename by document content" },
  { name: "Split Invoices", href: "/tools/split-invoices", description: "Split by invoice numbers" },
  { name: "Extract Text", href: "/tools/extract-text-from-pdf", description: "Extract text with OCR" },
];

const benefits = [
  "8+ document types detected",
  "Multi-language support (EN/RO)",
  "Confidence level scoring",
  "Keyword match details",
  "Works with scanned PDFs",
  "Fast processing",
];

const documentTypeColors: Record<string, string> = {
  invoice: "text-green-400 bg-green-400/20",
  contract: "text-blue-400 bg-blue-400/20",
  receipt: "text-yellow-400 bg-yellow-400/20",
  form: "text-purple-400 bg-purple-400/20",
  letter: "text-pink-400 bg-pink-400/20",
  report: "text-orange-400 bg-orange-400/20",
  id_document: "text-red-400 bg-red-400/20",
  bank_statement: "text-cyan-400 bg-cyan-400/20",
  unknown: "text-gray-400 bg-gray-400/20",
};

const documentTypeLabels: Record<string, string> = {
  invoice: "Invoice / Factura",
  contract: "Contract / Agreement",
  receipt: "Receipt / Bon Fiscal",
  form: "Form / Application",
  letter: "Letter / Correspondence",
  report: "Report / Analysis",
  id_document: "ID Document",
  bank_statement: "Bank Statement",
  unknown: "Unknown Document",
};

export default function DocumentDetectorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState(150);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    document_type: string;
    confidence: string;
    all_scores: Record<string, { score: number; keywords: string[] }>;
    pages_scanned: number;
    filename: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleDetect = async () => {
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
      formData.append("dpi", String(dpi));

      const response = await fetch("/api/document-detector", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to analyze document");
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

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "text-green-400 bg-green-400/20";
      case "medium":
        return "text-yellow-400 bg-yellow-400/20";
      default:
        return "text-red-400 bg-red-400/20";
    }
  };

  return (
    <ToolPageLayout
      title="Document Detector"
      description="Upload any PDF and let AI classify it. Detect invoices, contracts, receipts, forms, and more using intelligent text analysis."
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
                <div className="w-16 h-16 bg-cyan-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <p className="text-lg text-white mb-2">
                  Drop your PDF here or <span className="text-blue-400">browse</span>
                </p>
                <p className="text-sm text-gray-500">We'll detect what type of document it is</p>
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
                    OCR Quality (DPI)
                  </label>
                  <select
                    value={dpi}
                    onChange={(e) => setDpi(Number(e.target.value))}
                    className="w-full sm:w-48 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
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
                    className="h-full bg-cyan-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={handleDetect}
                disabled={!file || isProcessing}
                className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Analyzing..." : "Detect Document Type"}
              </button>
            </div>
          </>
        ) : (
          <div className="py-8">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-4 ${getConfidenceColor(result.confidence)}`}>
                <span className="capitalize">{result.confidence} Confidence</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Document Detected</h3>
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-lg font-medium ${documentTypeColors[result.document_type] || documentTypeColors.unknown}`}>
                {documentTypeLabels[result.document_type] || "Unknown Document"}
              </div>
            </div>

            <div className="max-w-2xl mx-auto mb-8">
              <p className="text-sm text-gray-400 mb-4 text-center">
                Analysis based on {result.pages_scanned} page{result.pages_scanned !== 1 ? "s" : ""} scanned
              </p>

              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-3">All Document Type Scores:</p>
                <div className="space-y-3">
                  {Object.entries(result.all_scores)
                    .sort((a, b) => b[1].score - a[1].score)
                    .map(([type, data]) => (
                      <div key={type} className="flex items-center gap-3">
                        <div className="w-32 flex-shrink-0">
                          <span className={`text-sm px-2 py-1 rounded ${documentTypeColors[type] || documentTypeColors.unknown}`}>
                            {type.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${type === result.document_type ? "bg-cyan-500" : "bg-gray-600"}`}
                              style={{ width: `${Math.min(100, data.score * 10)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-400 w-8 text-right">{data.score}</span>
                      </div>
                    ))}
                </div>
              </div>

              {result.all_scores[result.document_type]?.keywords.length > 0 && (
                <div className="mt-4 bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Matched Keywords:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.all_scores[result.document_type].keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-700 text-gray-300 text-sm rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Analyze Another Document
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
