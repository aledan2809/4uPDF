"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function SignPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [signatureType, setSignatureType] = useState<"text" | "image">("text");
  const [signatureText, setSignatureText] = useState("");
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [position, setPosition] = useState("bottom-right");
  const [pages, setPages] = useState("all");
  const [fontSize, setFontSize] = useState(12);
  const [opacity, setOpacity] = useState(1.0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sigImageInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (fileList: FileList | null) => {
    if (!fileList) return;
    const pdf = Array.from(fileList).find(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdf) {
      setFile(pdf);
      setResult(null);
      setError(null);
    }
  };

  const handleSignatureImage = (fileList: FileList | null) => {
    if (!fileList) return;
    const img = Array.from(fileList).find((f) =>
      f.type.startsWith("image/") || /\.(png|jpg|jpeg|gif|bmp)$/i.test(f.name)
    );
    if (img) {
      setSignatureImage(img);
      setSignaturePreview(URL.createObjectURL(img));
    }
  };

  const handleSign = async () => {
    if (!file) return;
    if (signatureType === "text" && !signatureText.trim()) {
      setError("Please enter signature text");
      return;
    }
    if (signatureType === "image" && !signatureImage) {
      setError("Please upload a signature image");
      return;
    }

    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("signature_type", signatureType);
    formData.append("position", position);
    formData.append("pages", pages === "all" ? "" : pages);
    formData.append("font_size", String(fontSize));
    formData.append("opacity", String(opacity));

    if (signatureType === "text") {
      formData.append("signature_text", signatureText);
    } else if (signatureImage) {
      formData.append("signature_image", signatureImage);
    }

    try {
      const res = await fetch("/api/sign-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Sign failed" }));
        throw new Error(data.detail || "Sign failed");
      }
      const blob = await res.blob();
      setResult({ url: URL.createObjectURL(blob), name: "signed.pdf" });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Sign failed";
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
        &larr; All tools
      </Link>
      <h1 className="text-3xl font-bold mb-2">Sign PDF</h1>
      <p className="text-gray-400 mb-6">
        Add a digital signature to your PDF document using text or an image.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? "border-amber-400 bg-amber-950/30" : "border-gray-700 hover:border-gray-500"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files)}
        />
        {file ? (
          <div>
            <p className="text-lg text-white">{file.name}</p>
            <p className="text-gray-500 text-sm">
              {(file.size / (1024 * 1024)).toFixed(1)} MB - Click to change
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg text-gray-400 mb-1">Click or drag a PDF file here</p>
            <p className="text-gray-500 text-sm">Select the PDF to sign</p>
          </div>
        )}
      </div>

      {file && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">Signature Settings</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Signature Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sigType"
                  checked={signatureType === "text"}
                  onChange={() => setSignatureType("text")}
                  className="accent-amber-500"
                />
                <span>Text Signature</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sigType"
                  checked={signatureType === "image"}
                  onChange={() => setSignatureType("image")}
                  className="accent-amber-500"
                />
                <span>Image Signature</span>
              </label>
            </div>
          </div>

          {signatureType === "text" ? (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Signature Text</label>
              <input
                type="text"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="Enter your signature..."
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Signature Image</label>
              <div
                onClick={() => sigImageInputRef.current?.click()}
                className="border border-gray-700 rounded p-4 cursor-pointer hover:border-gray-500 transition-colors"
              >
                <input
                  ref={sigImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleSignatureImage(e.target.files)}
                />
                {signaturePreview ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={signaturePreview}
                      alt="Signature preview"
                      className="h-16 object-contain bg-white rounded p-1"
                    />
                    <span className="text-sm text-gray-400">Click to change</span>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Click to upload signature image (PNG, JPG)</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Position</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
                <option value="center">Center</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Pages</label>
              <input
                type="text"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="all or 1,3,5"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
              />
            </div>

            {signatureType === "text" && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Font Size</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                  >
                    <option value={8}>Small (8)</option>
                    <option value={12}>Medium (12)</option>
                    <option value={16}>Large (16)</option>
                    <option value={24}>Extra Large (24)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Opacity ({Math.round(opacity * 100)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    className="w-full"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleSign}
        disabled={!file || processing}
        className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
      >
        {processing ? "Signing..." : "Sign PDF"}
      </button>

      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 bg-green-900/20 border border-green-800 rounded-lg p-5">
          <p className="text-green-300 font-medium mb-3">PDF signed successfully!</p>
          <a
            href={result.url}
            download={result.name}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium inline-block"
          >
            Download signed.pdf
          </a>
        </div>
      )}
    </div>
  );
}
