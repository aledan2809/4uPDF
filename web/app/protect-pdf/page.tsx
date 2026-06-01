"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function ProtectPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [permissions, setPermissions] = useState("all");
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

  const handleProtect = async () => {
    if (!file || !password) return;
    setProcessing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("password", password);
    if (ownerPassword) formData.append("owner_password", ownerPassword);
    formData.append("permissions", permissions);

    try {
      const res = await fetch("/api/protect", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Protection failed" }));
        throw new Error(data.detail || "Protection failed");
      }
      const blob = await res.blob();
      setResult({ url: URL.createObjectURL(blob), name: "protected.pdf" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const permOptions = [
    { id: "all", label: "All permissions", desc: "Print, copy, annotate" },
    { id: "print", label: "Print only", desc: "Can print but not copy or edit" },
    { id: "none", label: "No permissions", desc: "View only, no print or copy" },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">&larr; All tools</Link>
      <h1 className="text-3xl font-bold mb-2">Protect PDF</h1>
      <p className="text-gray-400 mb-6">Add password protection and set permissions on a PDF document.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
          dragOver ? "border-amber-400 bg-amber-950/30" : "border-gray-700 hover:border-gray-500"
        }`}
      >
        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files)} />
        {file ? (
          <div><p className="text-lg text-white">{file.name}</p><p className="text-gray-500 text-sm">{(file.size / (1024 * 1024)).toFixed(1)} MB - Click to change</p></div>
        ) : (
          <div><p className="text-lg text-gray-400 mb-1">Click or drag a PDF file here</p><p className="text-gray-500 text-sm">Select the PDF to protect</p></div>
        )}
      </div>

      {file && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Protection settings</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">User password (required)</label>
              <input type="password" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password to open PDF" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Owner password (optional)</label>
              <input type="password" className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} placeholder="Password for full access" />
              <p className="text-xs text-gray-500 mt-1">Defaults to user password if empty</p>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Permissions</label>
            <div className="flex gap-3">
              {permOptions.map((p) => (
                <button key={p.id} onClick={() => setPermissions(p.id)}
                  className={`flex-1 p-3 rounded-lg border text-left transition-colors ${permissions === p.id ? "border-amber-500 bg-amber-950/30" : "border-gray-700 hover:border-gray-600"}`}>
                  <p className="font-medium text-sm">{p.label}</p>
                  <p className="text-xs text-gray-400">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button onClick={handleProtect} disabled={!file || !password || processing}
        className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors">
        {processing ? "Protecting..." : "Protect PDF"}
      </button>

      {error && <div className="mt-4 bg-red-900/30 border border-red-800 rounded p-3 text-red-300 text-sm">{error}</div>}
      {result && (
        <div className="mt-6 bg-green-900/20 border border-green-800 rounded-lg p-5">
          <p className="text-green-300 font-medium mb-3">PDF protected successfully!</p>
          <a href={result.url} download={result.name} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium inline-block">Download protected.pdf</a>
        </div>
      )}
    </div>
  );
}
