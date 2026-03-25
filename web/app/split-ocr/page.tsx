"use client";
import { useState, useEffect, useRef } from "react";

interface LogEntry {
  page: number;
  order: string | null;
  text: string;
}

interface FileInfo {
  name: string;
  order: string;
  pages: number;
  size_mb: number;
}

interface JobStatus {
  id: string;
  status: string;
  progress: number;
  current_page: number;
  total_pages: number;
  orders_found: number;
  elapsed_seconds: number;
  eta_seconds: number;
  files: FileInfo[];
  groups: Record<string, number[]>;
  error: string | null;
  recent_log: LogEntry[];
  input_file?: string;
}

// Pattern presets - friendly names hiding regex complexity
const PATTERN_PRESETS = [
  {
    id: "order_8",
    label: "Order number + 8 digits",
    description: "Ex: Order No: 72544251",
    pattern: "(?:Order\\s*(?:No\\.?|#|:)?\\s*)(\\d{8})",
  },
  {
    id: "order_any",
    label: "Order number + any digits",
    description: "Ex: Order No: 123, Order #999999",
    pattern: "(?:Order\\s*(?:No\\.?|#|:)?\\s*)(\\d{3,12})",
  },
  {
    id: "any_8_digits",
    label: "Any 8-digit number",
    description: "First 8-digit number found in the scanned area",
    pattern: "(\\d{8})",
  },
  {
    id: "keyword",
    label: "Keyword + number",
    description: "Search for a keyword followed by a number",
    needsKeyword: true,
    pattern: "",
  },
  {
    id: "custom",
    label: "Custom regex",
    description: "Write your own regex (advanced)",
    isCustom: true,
    pattern: "",
  },
];

const CROP_PRESETS = [
  { id: "top_right", label: "Top right", cropLeft: 0.5, cropTop: 0.0, cropRight: 1.0, cropBottom: 0.2 },
  { id: "top_left", label: "Top left", cropLeft: 0.0, cropTop: 0.0, cropRight: 0.5, cropBottom: 0.2 },
  { id: "top_full", label: "Top (full width)", cropLeft: 0.0, cropTop: 0.0, cropRight: 1.0, cropBottom: 0.2 },
  { id: "bottom_right", label: "Bottom right", cropLeft: 0.5, cropTop: 0.8, cropRight: 1.0, cropBottom: 1.0 },
  { id: "bottom_left", label: "Bottom left", cropLeft: 0.0, cropTop: 0.8, cropRight: 0.5, cropBottom: 1.0 },
  { id: "full_page", label: "Full page", cropLeft: 0.0, cropTop: 0.0, cropRight: 1.0, cropBottom: 1.0 },
  { id: "custom", label: "Custom (manual)" },
];

const DEFAULT_CONFIG = {
  patternPreset: "order_8",
  patternKeyword: "",
  patternCustom: "",
  cropPreset: "top_right",
  cropLeft: 0.5,
  cropTop: 0.0,
  cropRight: 1.0,
  cropBottom: 0.2,
  dpi: 150,
  fileNameTemplate: "{order}",
  outputFolder: "output",
};

export default function Home() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [currentJobIdx, setCurrentJobIdx] = useState(0);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [allResults, setAllResults] = useState<FileInfo[]>([]);
  const [polling, setPolling] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [autoDownload, setAutoDownload] = useState(true);
  const [outputDirHandle, setOutputDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [outputDirName, setOutputDirName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const downloadedRef = useRef<Set<string>>(new Set());

  const getPattern = () => {
    const preset = PATTERN_PRESETS.find((p) => p.id === config.patternPreset);
    if (!preset) return "";
    if ("needsKeyword" in preset && preset.needsKeyword) {
      const kw = config.patternKeyword.trim() || "Order";
      return `(?:${kw}:?\\s*)(\\d{3,12})`;
    }
    if ("isCustom" in preset && preset.isCustom) {
      return config.patternCustom;
    }
    return preset.pattern;
  };

  const setCropPreset = (presetId: string) => {
    const preset = CROP_PRESETS.find((p) => p.id === presetId);
    if (preset && "cropLeft" in preset && preset.cropLeft !== undefined) {
      setConfig({
        ...config,
        cropPreset: presetId,
        cropLeft: preset.cropLeft as number,
        cropTop: preset.cropTop as number,
        cropRight: preset.cropRight as number,
        cropBottom: preset.cropBottom as number,
      });
    } else {
      setConfig({ ...config, cropPreset: presetId });
    }
  };

  // Check API health
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
  }, []);

  // Poll job status
  useEffect(() => {
    if (jobIds.length === 0 || !polling) return;
    const currentJobId = jobIds[currentJobIdx];
    if (!currentJobId) return;

    const interval = setInterval(() => {
      fetch(`/api/status/${currentJobId}`)
        .then((r) => r.json())
        .then((data: JobStatus) => {
          setStatus(data);
          if (data.status === "done") {
            setAllResults((prev) => [...prev, ...data.files]);
            if (currentJobIdx + 1 < jobIds.length) {
              setCurrentJobIdx((prev) => prev + 1);
            } else {
              setPolling(false);
            }
          } else if (data.status === "error") {
            setPolling(false);
          }
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [jobIds, currentJobIdx, polling]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [status?.recent_log]);

  // Auto-download new files as they appear
  useEffect(() => {
    if (!autoDownload || allResults.length === 0) return;
    for (const file of allResults) {
      if (downloadedRef.current.has(file.name)) continue;
      downloadedRef.current.add(file.name);
      const url = `/api/download/${encodeURIComponent(file.name)}?output_dir=${encodeURIComponent(config.outputFolder)}`;
      if (outputDirHandle) {
        // Save directly to selected folder
        (async () => {
          try {
            const res = await fetch(url);
            const blob = await res.blob();
            const fileHandle = await outputDirHandle.getFileHandle(file.name, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
          } catch (err) {
            console.error("Failed to save to folder:", err);
          }
        })();
      } else {
        // Fallback: browser download
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  }, [allResults, autoDownload, config.outputFolder, outputDirHandle]);

  // Handle file selection from input
  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList) return;
    const pdfs = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfs.length === 0) return;
    setUploadedFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const newFiles = pdfs.filter((f) => !existing.has(f.name + f.size));
      const all = [...prev, ...newFiles];
      // Auto-select all
      setSelectedFiles(all.map((_, i) => i));
      return all;
    });
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
    setSelectedFiles((prev) =>
      prev.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i))
    );
  };

  const toggleFile = (idx: number) => {
    setSelectedFiles((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const selectAll = () => {
    if (selectedFiles.length === uploadedFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(uploadedFiles.map((_, i) => i));
    }
  };

  // Upload files and start processing
  const startJobs = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setAllResults([]);
    downloadedRef.current.clear();
    setCurrentJobIdx(0);
    setStatus(null);

    const pattern = getPattern();
    const ids: string[] = [];

    for (const fileIdx of selectedFiles) {
      const file = uploadedFiles[fileIdx];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("output_dir", config.outputFolder);
      formData.append("pattern", pattern);
      formData.append("crop_left", String(config.cropLeft));
      formData.append("crop_top", String(config.cropTop));
      formData.append("crop_right", String(config.cropRight));
      formData.append("crop_bottom", String(config.cropBottom));
      formData.append("dpi", String(config.dpi));
      formData.append("filename_template", config.fileNameTemplate);

      try {
        const res = await fetch("/api/split-ocr", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.job_id) {
          ids.push(data.job_id);
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }

    setUploading(false);
    setJobIds(ids);
    setPolling(true);
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const currentPreset = PATTERN_PRESETS.find((p) => p.id === config.patternPreset);
  const isDone = !polling && allResults.length > 0;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">PDF Splitter</h1>
      <p className="text-gray-400 mb-6">
        Split scanned PDFs by order number using OCR
      </p>

      {/* API Status */}
      <div className="mb-4">
        {apiOk === null && <span className="text-yellow-400">Checking API...</span>}
        {apiOk === false && <span className="text-red-400">API offline</span>}
        {apiOk === true && <span className="text-green-400">API connected</span>}
      </div>

      {/* Upload PDFs */}
      <div className="bg-gray-900 rounded-lg p-5 mb-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upload PDFs</h2>
          {uploadedFiles.length > 1 && (
            <button
              onClick={selectAll}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {selectedFiles.length === uploadedFiles.length ? "Deselect all" : "Select all"}
            </button>
          )}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${
            dragOver
              ? "border-blue-400 bg-blue-950/30"
              : "border-gray-700 hover:border-gray-500"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <div className="text-gray-400 text-sm">
            <p className="text-lg mb-1">Click or drag PDF files here</p>
            <p className="text-gray-500">You can select multiple files</p>
          </div>
        </div>

        {/* File list */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            {uploadedFiles.map((f, i) => (
              <label
                key={f.name + f.size}
                className={`flex items-center gap-3 p-3 rounded cursor-pointer border ${
                  selectedFiles.includes(i)
                    ? "border-blue-500 bg-blue-950/30"
                    : "border-gray-800 hover:border-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-blue-500"
                  checked={selectedFiles.includes(i)}
                  onChange={() => toggleFile(i)}
                />
                <span className="font-mono text-sm">{f.name}</span>
                <span className="text-gray-500 text-xs ml-auto">
                  {formatSize(f.size)}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="text-gray-500 hover:text-red-400 text-xs ml-2"
                >
                  X
                </button>
              </label>
            ))}
          </div>
        )}

      </div>

      {/* Configuration */}
      <div className="bg-gray-900 rounded-lg p-5 mb-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Pattern Preset */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              What to search for?
            </label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              value={config.patternPreset}
              onChange={(e) => setConfig({ ...config, patternPreset: e.target.value })}
            >
              {PATTERN_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <span className="text-xs text-gray-500">{currentPreset?.description}</span>
          </div>

          {/* Keyword input */}
          {currentPreset && "needsKeyword" in currentPreset && currentPreset.needsKeyword && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Keyword</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="Ex: Order, Invoice, PO..."
                value={config.patternKeyword}
                onChange={(e) => setConfig({ ...config, patternKeyword: e.target.value })}
              />
              <span className="text-xs text-gray-500">
                Will search for: {config.patternKeyword || "Order"}: 12345
              </span>
            </div>
          )}

          {/* Custom regex */}
          {currentPreset && "isCustom" in currentPreset && currentPreset.isCustom && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Custom regex</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
                placeholder="(?:Order\\s*#?:?\\s*)(\\d{8})"
                value={config.patternCustom}
                onChange={(e) => setConfig({ ...config, patternCustom: e.target.value })}
              />
              <span className="text-xs text-gray-500">
                Group (1) = value extracted for the file name
              </span>
            </div>
          )}

          {/* OCR scan zone */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">OCR scan zone</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              value={config.cropPreset}
              onChange={(e) => setCropPreset(e.target.value)}
            >
              {CROP_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            {config.cropPreset === "custom" && (
              <div className="flex gap-2 mt-2">
                {(["cropLeft", "cropTop", "cropRight", "cropBottom"] as const).map((key) => (
                  <div key={key} className="w-1/4">
                    <span className="text-xs text-gray-500 block text-center">
                      {key.replace("crop", "").toLowerCase()}
                    </span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-center"
                      value={config[key]}
                      onChange={(e) =>
                        setConfig({ ...config, [key]: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Output Folder - local */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Output Folder (local)</label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                value={outputDirName || "Downloads (default)"}
                readOnly
                placeholder="Select folder..."
              />
              <button
                onClick={async () => {
                  try {
                    if (typeof (window as any).showDirectoryPicker !== "function") {
                      alert("Folder selection requires Chrome or Edge (on HTTPS).\nIn this browser, files will download automatically to Downloads.");
                      return;
                    }
                    const handle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
                    setOutputDirHandle(handle);
                    setOutputDirName(handle.name);
                  } catch { /* user cancelled */ }
                }}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm whitespace-nowrap"
              >
                Browse
              </button>
            </div>
            <span className="text-xs text-gray-500">
              {outputDirHandle
                ? `Files will be saved automatically to: ${outputDirName}/`
                : "Folder selection is only available in Chrome/Edge. Files will download to Downloads."}
            </span>
          </div>

          {/* DPI */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">DPI (scan quality)</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              value={config.dpi}
              onChange={(e) => setConfig({ ...config, dpi: parseInt(e.target.value) })}
            >
              <option value={100}>100 DPI - Fast (lower quality)</option>
              <option value={150}>150 DPI - Standard (recommended)</option>
              <option value={200}>200 DPI - Good (slower)</option>
              <option value={300}>300 DPI - High (slowest)</option>
            </select>
          </div>

          {/* File Name Template */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">File Name Template</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
              value={config.fileNameTemplate}
              onChange={(e) => setConfig({ ...config, fileNameTemplate: e.target.value })}
            />
            <span className="text-xs text-gray-500">
              Variables: {"{order}"} {"{pages}"} {"{index}"} → Preview:{" "}
              {config.fileNameTemplate
                .replace("{order}", "72544251")
                .replace("{pages}", "5")
                .replace("{index}", "1")}
              .pdf
            </span>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={startJobs}
          disabled={selectedFiles.length === 0 || !apiOk || polling || uploading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
        >
          {uploading
            ? "Uploading..."
            : polling
            ? `Processing ${currentJobIdx + 1}/${jobIds.length}...`
            : `Start Split${selectedFiles.length > 1 ? ` (${selectedFiles.length} files)` : ""}`}
        </button>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="accent-green-500"
            checked={autoDownload}
            onChange={(e) => setAutoDownload(e.target.checked)}
          />
          <span className="text-sm text-gray-400">Auto-download</span>
        </label>
        {selectedFiles.length > 0 && !polling && !uploading && (
          <span className="text-sm text-gray-500">
            {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
          </span>
        )}
        {selectedFiles.length === 0 && !polling && (
          <span className="text-sm text-gray-500">
            Upload PDF files to begin
          </span>
        )}
      </div>

      {/* Progress */}
      {status && (
        <div className="bg-gray-900 rounded-lg p-5 mb-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-2">
            Progress
            <span
              className={`ml-3 text-sm font-normal px-2 py-0.5 rounded ${
                status.status === "done"
                  ? "bg-green-900 text-green-300"
                  : status.status === "error"
                  ? "bg-red-900 text-red-300"
                  : "bg-blue-900 text-blue-300"
              }`}
            >
              {status.status}
            </span>
          </h2>

          {jobIds.length > 1 && (
            <p className="text-sm text-gray-400 mb-3">
              File {currentJobIdx + 1} of {jobIds.length}
            </p>
          )}

          <div className="w-full bg-gray-800 rounded-full h-4 mb-3">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                isDone ? "bg-green-500" : status.status === "error" ? "bg-red-500" : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(status.progress, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-sm text-gray-400 mb-4">
            <span>
              Page {status.current_page} / {status.total_pages} ({status.progress}%)
            </span>
            <span>Orders found: {status.orders_found}</span>
            <span>
              Elapsed: {formatTime(status.elapsed_seconds)} | ETA: {formatTime(status.eta_seconds)}
            </span>
          </div>

          {status.error && (
            <div className="bg-red-900/30 border border-red-800 rounded p-3 mb-4 text-red-300 text-sm">
              {status.error}
            </div>
          )}

          {status.recent_log && status.recent_log.length > 0 && (
            <div
              ref={logRef}
              className="bg-gray-950 rounded p-3 font-mono text-xs max-h-40 overflow-y-auto"
            >
              {status.recent_log.map((log, i) => (
                <div key={i} className="mb-1">
                  <span className="text-gray-500">Page {log.page}:</span>{" "}
                  {log.order ? (
                    <span className="text-green-400">#{log.order}</span>
                  ) : (
                    <span className="text-gray-600">--</span>
                  )}{" "}
                  <span className="text-gray-600">{log.text?.slice(0, 80)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {allResults.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-5 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">
            Results ({allResults.length} files)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-800">
                  <th className="pb-2">File</th>
                  <th className="pb-2">Order #</th>
                  <th className="pb-2">Pages</th>
                  <th className="pb-2">Size</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {allResults.map((f, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="py-2 font-mono">{f.name}</td>
                    <td className="py-2">{f.order}</td>
                    <td className="py-2">{f.pages}</td>
                    <td className="py-2">{f.size_mb} MB</td>
                    <td className="py-2">
                      <a
                        href={`/api/download/${encodeURIComponent(f.name)}?output_dir=${encodeURIComponent(config.outputFolder)}`}
                        className="text-blue-400 hover:text-blue-300"
                        download
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {allResults.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <a
                href={`/api/download-all?output_dir=${encodeURIComponent(config.outputFolder)}`}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-medium"
              >
                Download All (ZIP)
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
