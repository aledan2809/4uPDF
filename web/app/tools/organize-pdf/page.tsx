"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How do I reorder pages in a PDF?",
    answer:
      "Upload your PDF file, then enter the new page order as comma-separated numbers (e.g., '3,1,2,5,4'). Click 'Organize PDF' and your rearranged PDF will be ready for download.",
  },
  {
    question: "Can I reverse all pages in a PDF?",
    answer:
      "Yes! Simply toggle the 'Reverse all pages' option and all pages will be placed in reverse order without needing to specify individual page numbers.",
  },
  {
    question: "Do I need to include all pages in the order?",
    answer:
      "You can include any subset of pages. For example, if your PDF has 5 pages and you enter '1,3,5', only those 3 pages will be included in the output PDF.",
  },
  {
    question: "What happens if I enter an invalid page number?",
    answer:
      "Page numbers that exceed the total page count or are less than 1 will be flagged as invalid. Make sure all numbers are within the valid range for your PDF.",
  },
  {
    question: "Can I duplicate pages?",
    answer:
      "Yes! You can include the same page number multiple times in the order. For example, '1,1,2,3' will include page 1 twice followed by pages 2 and 3.",
  },
];

const relatedTools = [
  { name: "Merge PDF", href: "/tools/merge-pdf", description: "Combine multiple PDFs" },
  { name: "Split PDF", href: "/tools/split-pdf", description: "Split PDF into parts" },
  { name: "Delete Pages", href: "/tools/delete-pages", description: "Remove specific pages" },
];

export default function OrganizePDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageOrder, setPageOrder] = useState<string>("");
  const [reverseAll, setReverseAll] = useState<boolean>(false);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ downloadUrl: string; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResult(null);
      setError(null);
      setPageOrder("");
      setReverseAll(false);

      // Read page count from PDF
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (content && typeof content === "string") {
          // Quick regex to estimate page count from PDF binary
          const matches = content.match(/\/Type\s*\/Page[^s]/g);
          if (matches) {
            setPageCount(matches.length);
          }
        }
      };
      reader.readAsText(files[0]);
    }
  }, []);

  const handleOrganize = async () => {
    if (!file) {
      setError("Please upload a PDF file");
      return;
    }
    if (!reverseAll && !pageOrder.trim()) {
      setError("Please enter a page order or enable reverse all pages");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("page_order", reverseAll ? "" : pageOrder);
      formData.append("reverse", reverseAll.toString());

      const response = await fetch("/api/organize-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to organize PDF");
      }

      const data = await response.json();
      setProgress(100);
      setPageCount(data.total_pages || pageCount);
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
      title="Organize PDF"
      description="Reorder, rearrange, and reverse pages in your PDF documents. Full control over page order."
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
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                      {pageCount && ` \u2022 ${pageCount} pages`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setPageCount(null);
                    }}
                    className="p-1 text-gray-500 hover:text-red-400"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reverseAll}
                        onChange={(e) => setReverseAll(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <span className="text-sm text-gray-300">Reverse all pages</span>
                  </div>

                  {!reverseAll && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Page Order
                      </label>
                      <input
                        type="text"
                        value={pageOrder}
                        onChange={(e) => setPageOrder(e.target.value)}
                        placeholder={pageCount ? `e.g., ${Array.from({ length: pageCount }, (_, i) => pageCount - i).join(",")}` : "e.g., 3,1,2,5,4"}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter page numbers separated by commas in the desired order.
                        {pageCount && ` Your PDF has ${pageCount} pages.`}
                      </p>
                    </div>
                  )}
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
                  <span className="text-sm text-gray-400">Organizing PDF...</span>
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
                onClick={handleOrganize}
                disabled={!file || (!reverseAll && !pageOrder.trim()) || isProcessing}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Organizing..." : "Organize PDF"}
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
            <h3 className="text-xl font-semibold text-white mb-2">PDF Organized Successfully!</h3>
            <p className="text-gray-400 mb-6">
              {reverseAll ? "All pages have been reversed." : "Pages have been reordered as specified."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={result.downloadUrl}
                download={result.filename}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Organized PDF
              </a>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setPageCount(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Organize Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
