"use client";

import { useState, useCallback } from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import FileUploadZone from "../../components/FileUploadZone";

const faqs = [
  {
    question: "How do I add text to a PDF?",
    answer:
      "Upload your PDF file, enter the text you want to add, choose the page number, position, font size, and color, then click Add Text. Your edited PDF will be ready for download.",
  },
  {
    question: "Can I choose where the text appears on the page?",
    answer:
      "Yes! You can use preset positions (top, center, bottom) or enter custom X and Y coordinates to place text exactly where you want it.",
  },
  {
    question: "Can I change the text color?",
    answer:
      "Yes, you can pick any color using the color picker. The selected color will be applied to the text you add to the PDF.",
  },
  {
    question: "Does this tool support special characters and diacritics?",
    answer:
      "Yes! The tool uses Unicode fonts to support special characters, diacritics, and international text.",
  },
  {
    question: "Can I add text to a specific page?",
    answer:
      "Yes, you can specify the exact page number where you want the text to appear.",
  },
];

const relatedTools = [
  { name: "Watermark PDF", href: "/tools/watermark-pdf", description: "Add watermarks to your PDF" },
  { name: "Add Page Numbers", href: "/tools/add-page-numbers", description: "Number your PDF pages" },
  { name: "Extract Text", href: "/tools/extract-text-from-pdf", description: "Extract text from PDF" },
];

type PositionMode = "preset" | "custom";

const presetPositions = [
  { value: "top-left", label: "Top Left", x: 50, y: 50 },
  { value: "top-center", label: "Top Center", x: 300, y: 50 },
  { value: "top-right", label: "Top Right", x: 500, y: 50 },
  { value: "center", label: "Center", x: 300, y: 420 },
  { value: "bottom-left", label: "Bottom Left", x: 50, y: 780 },
  { value: "bottom-center", label: "Bottom Center", x: 300, y: 780 },
  { value: "bottom-right", label: "Bottom Right", x: 500, y: 780 },
];

export default function EditPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [positionMode, setPositionMode] = useState<PositionMode>("preset");
  const [presetPosition, setPresetPosition] = useState<string>("center");
  const [positionX, setPositionX] = useState<number>(300);
  const [positionY, setPositionY] = useState<number>(420);
  const [fontSize, setFontSize] = useState<number>(14);
  const [color, setColor] = useState<string>("#000000");
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

  const hexToRgb = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  };

  const handleEdit = async () => {
    if (!file) {
      setError("Please upload a PDF file");
      return;
    }
    if (!text.trim()) {
      setError("Please enter text to add");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      let finalX = positionX;
      let finalY = positionY;

      if (positionMode === "preset") {
        const preset = presetPositions.find((p) => p.value === presetPosition);
        if (preset) {
          finalX = preset.x;
          finalY = preset.y;
        }
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("text", text);
      formData.append("page_number", pageNumber.toString());
      formData.append("position_x", finalX.toString());
      formData.append("position_y", finalY.toString());
      formData.append("font_size", fontSize.toString());
      formData.append("color", hexToRgb(color));

      const response = await fetch("/api/edit-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to edit PDF");
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
      title="Edit PDF"
      description="Add text annotations to your PDF documents. Choose position, font size, color, and target page."
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
                      Text to Add
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Enter the text you want to add to the PDF"
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Page Number
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={pageNumber}
                      onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Position Mode
                    </label>
                    <select
                      value={positionMode}
                      onChange={(e) => setPositionMode(e.target.value as PositionMode)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="preset">Preset Position</option>
                      <option value="custom">Custom Coordinates</option>
                    </select>
                  </div>

                  {positionMode === "preset" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Position
                      </label>
                      <select
                        value={presetPosition}
                        onChange={(e) => setPresetPosition(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        {presetPositions.map((pos) => (
                          <option key={pos.value} value={pos.value}>
                            {pos.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          X Position (pts)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={positionX}
                          onChange={(e) => setPositionX(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Y Position (pts)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={positionY}
                          onChange={(e) => setPositionY(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Font Size
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="120"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value) || 14)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Text Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
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
                  <span className="text-sm text-gray-400">Adding text to PDF...</span>
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
                onClick={handleEdit}
                disabled={!file || !text.trim() || isProcessing}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Adding Text..." : "Add Text"}
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
            <h3 className="text-xl font-semibold text-white mb-2">Text Added Successfully!</h3>
            <p className="text-gray-400 mb-6">Your PDF has been edited with the specified text annotation.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={result.downloadUrl}
                download={result.filename}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Edited PDF
              </a>
              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setText("");
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Edit Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
