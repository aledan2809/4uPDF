"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function WatermarkPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.15);
  const [angle, setAngle] = useState(45);
  const [fontSize, setFontSize] = useState(60);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (fileList: FileList | null) => {
    if (!fileList) return;
    const pdf = Array.from(fileList).find(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdf) { setFile(pdf); setResult(null); setError(null); }
  };

  const handleWatermark = async () => {
    if (!file || !text.trim()) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("text", text);
    formData.append("opacity", String(opacity));
    formData.append("angle", String(angle));
    formData.append("font_size", String(fontSize));

    try {
      const res = await fetch("/api/watermark", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Watermark failed" }));
        throw new Error(data.detail || "Watermark failed");
      }
      const blob = await res.blob();
      setResult({ url: URL.createObjectURL(blob), name: "watermarked.pdf" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">&larr; All tools</Link>
      <h1 className="text-3xl font-bold mb-2">Watermark PDF</h1>
      <p className="text-gray-400 mb-6">Add a text watermark to every page of a PDF document.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? "border-violet-400 bg-violet-950/30" : "border-gray-700 hover:border-gray-500"
        }`}
      >
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files)} />
        {file ? (
          <div><p className="text-lg text-white">{file.name}</p><p className="text-gray-500 text-sm">{(file.size / (1024 * 1024)).toFixed(1)} MB - Click to change</p></div>
        ) : (
          <div><p className="text-lg text-gray-400 mb-1">Click or drag a PDF file here</p><p className="text-gray-500 text-sm">Select the PDF to watermark</p></div>
        )}
      </div>

      {file && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Watermark settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Watermark text</label>
              <input className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="CONFIDENTIAL" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Opacity ({Math.round(opacity * 100)}%)</label>
              <input type="range" min="0.01" max="1" step="0.01" className="w-full" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Angle ({angle}&deg;)</label>
              <input type="range" min="0" max="90" step="5" className="w-full" value={angle} onChange={(e) => setAngle(parseInt(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Font size</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}>
                <option value={30}>Small (30)</option>
                <option value={60}>Medium (60)</option>
                <option value={90}>Large (90)</option>
                <option value={120}>Extra Large (120)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <button onClick={handleWatermark} disabled={!file || !text.trim() || processing}
        className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors">
        {processing ? "Adding watermark..." : "Add Watermark"}
      </button>

      {error && <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 text-red-300 text-sm">{error}</div>}
      {result && (
        <div className="mt-6 bg-green-900/20 border border-green-800 rounded-lg p-5">
          <p className="text-green-300 font-medium mb-3">Watermark added successfully!</p>
          <a href={result.url} download={result.name} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium inline-block">Download watermarked.pdf</a>
        </div>
      )}
    </div>
  );
}
