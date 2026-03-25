"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How do I sign a PDF online?",
    answer:
      "Upload your PDF file, enter your name and signature text, choose the position and page, then click Sign PDF. Your signed document will be ready for download.",
  },
  {
    question: "Can I sign specific pages only?",
    answer:
      "Yes! You can apply the signature to all pages or specify individual pages (e.g., '1,3,5') or page ranges (e.g., '1-5').",
  },
  {
    question: "Is my signature secure?",
    answer:
      "Your files are processed securely and automatically deleted after processing. We do not store your documents or signatures.",
  },
  {
    question: "Can I change the signature position?",
    answer:
      "Yes, you can place your signature at the top-left, top-right, center, bottom-left, or bottom-right of the page.",
  },
  {
    question: "What font size should I use for my signature?",
    answer:
      "The default size of 14pt works well for most documents. Use smaller sizes (10-12pt) for subtle signatures or larger sizes (18-24pt) for prominent ones.",
  },
];

const relatedTools = [
  { name: "Watermark PDF", href: "/tools/watermark-pdf", description: "Add watermarks to your PDF" },
  { name: "Protect PDF", href: "/tools/protect-pdf", description: "Add password protection" },
  { name: "Edit PDF", href: "/tools/edit-pdf", description: "Edit text and images" },
];

export default function SignPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [signerName, setSignerName] = useState<string>("");
  const [signatureText, setSignatureText] = useState<string>("");
  const [position, setPosition] = useState<string>("bottom-right");
  const [pages, setPages] = useState<string>("all");
  const [fontSize, setFontSize] = useState<number>(14);
  const [opacity, setOpacity] = useState<number>(1.0);
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

  const handleSignerNameChange = (name: string) => {
    setSignerName(name);
    if (!signatureText || signatureText === "" || signatureText.startsWith("Signed by: ")) {
      setSignatureText(`Signed by: ${name}`);
    }
  };

  const handleSign = async () => {
    if (!file) {
      setError("Please upload a PDF file");
      return;
    }
    if (!signatureText.trim()) {
      setError("Please enter signature text");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature_text", signatureText);
      formData.append("position", position);
      formData.append("page", pages);
      formData.append("font_size", fontSize.toString());
      formData.append("opacity", opacity.toString());

      const response = await fetch("/api/sign-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to sign PDF");
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

  const positions = [
    { value: "bottom-right", label: "Bottom Right" },
    { value: "bottom-left", label: "Bottom Left" },
    { value: "top-left", label: "Top Left" },
    { value: "top-right", label: "Top Right" },
    { value: "center", label: "Center" },
  ];

  return (
    <ToolPageLayout
      title="Sign PDF"
      description="Add a text signature to your PDF documents. Choose position, page, and customize the appearance."
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
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Signer Name
                    </label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => handleSignerNameChange(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Signature Text
                    </label>
                    <input
                      type="text"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="e.g., Signed by: John Doe"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Position
                    </label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      {positions.map((pos) => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Font Size
                    </label>
                    <input
                      type="number"
                      min="8"
                      max="72"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value) || 14)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Opacity: {(opacity * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Signature Preview */}
                {signatureText && (
                  <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Signature Preview:</p>
                    <p
                      className="text-blue-300 italic"
                      style={{ fontSize: `${Math.min(fontSize, 32)}px`, opacity: opacity }}
                    >
                      {signatureText}
                    </p>
                  </div>
                )}
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
                  <span className="text-sm text-gray-400">Signing PDF...</span>
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
                onClick={handleSign}
                disabled={!file || !signatureText.trim() || isProcessing}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Signing PDF..." : "Sign PDF"}
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
            <h3 className="text-xl font-semibold text-white mb-2">PDF Signed Successfully!</h3>
            <p className="text-gray-400 mb-6">Your PDF has been signed with &quot;{signatureText}&quot;</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={result.downloadUrl}
                download={result.filename}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Signed PDF
              </a>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setSignerName("");
                  setSignatureText("");
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Sign Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
