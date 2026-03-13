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
    id: "nr_comanda_8",
    label: "Nr. comanda + 8 cifre",
    description: "Ex: Nr. comanda: 72544251",
    pattern: "(?:Nr\\.?\\s*comanda:?\\s*)(\\d{8})",
  },
  {
    id: "nr_comanda_any",
    label: "Nr. comanda + orice numar",
    description: "Ex: Nr. comanda: 123, Nr. comanda: 999999",
    pattern: "(?:Nr\\.?\\s*comanda:?\\s*)(\\d{3,12})",
  },
  {
    id: "any_8_digits",
    label: "Orice numar de 8 cifre",
    description: "Primul numar de 8 cifre gasit in zona scanata",
    pattern: "(\\d{8})",
  },
  {
    id: "keyword_number",
    label: "Cuvant cheie + numar",
    description: "Specifica un cuvant (ex: Comanda, Order, Factura)",
    pattern: "",
    needsKeyword: true,
  },
  {
    id: "custom",
    label: "Regex personalizat (avansat)",
    description: "Scrie propriul regex - grupul (1) = valoarea extrasa",
    pattern: "",
    isCustom: true,
  },
] as const;

const CROP_PRESETS = [
  { id: "top_right", label: "Dreapta sus", cropLeft: 0.5, cropTop: 0.0, cropRight: 1.0, cropBottom: 0.2 },
  { id: "top_left", label: "Stanga sus", cropLeft: 0.0, cropTop: 0.0, cropRight: 0.5, cropBottom: 0.2 },
  { id: "top_full", label: "Sus (toata latimea)", cropLeft: 0.0, cropTop: 0.0, cropRight: 1.0, cropBottom: 0.2 },
  { id: "bottom_right", label: "Dreapta jos", cropLeft: 0.5, cropTop: 0.8, cropRight: 1.0, cropBottom: 1.0 },
  { id: "bottom_left", label: "Stanga jos", cropLeft: 0.0, cropTop: 0.8, cropRight: 0.5, cropBottom: 1.0 },
  { id: "bottom_full", label: "Jos (toata latimea)", cropLeft: 0.0, cropTop: 0.8, cropRight: 1.0, cropBottom: 1.0 },
  { id: "center", label: "Centru", cropLeft: 0.25, cropTop: 0.3, cropRight: 0.75, cropBottom: 0.7 },
  { id: "full_page", label: "Toata pagina", cropLeft: 0.0, cropTop: 0.0, cropRight: 1.0, cropBottom: 1.0 },
  { id: "custom", label: "Personalizat..." },
] as const;

interface BrowseItem { name: string; type: string; path: string }

const DEFAULT_CONFIG = {
  inputPath: "D:\\Projects\\PDF-split\\input",
  outputDir: "D:\\Projects\\PDF-split\\output",
  patternPreset: "nr_comanda_8",
  patternKeyword: "",
  patternCustom: "",
  cropPreset: "top_right",
  cropLeft: 0.5,
  cropTop: 0.0,
  cropRight: 1.0,
  cropBottom: 0.2,
  dpi: 150,
  ocrModel: "rapidocr",
  fileNameTemplate: "{order}",
};

export default function Home() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [files, setFiles] = useState<{ name: string; path: string; size_mb?: number }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [currentJobIdx, setCurrentJobIdx] = useState(0);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [allResults, setAllResults] = useState<FileInfo[]>([]);
  const [polling, setPolling] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [browsing, setBrowsing] = useState<"input" | "output" | null>(null);
  const [browseItems, setBrowseItems] = useState<BrowseItem[]>([]);
  const [browsePath, setBrowsePath] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  // Compute the actual regex pattern from preset
  const getPattern = () => {
    const preset = PATTERN_PRESETS.find((p) => p.id === config.patternPreset);
    if (!preset) return DEFAULT_CONFIG.patternCustom;
    if ("needsKeyword" in preset && preset.needsKeyword) {
      const kw = config.patternKeyword.trim() || "Comanda";
      return `(?:${kw}:?\\s*)(\\d{3,12})`;
    }
    if ("isCustom" in preset && preset.isCustom) {
      return config.patternCustom;
    }
    return preset.pattern;
  };

  // Open folder browser
  const openBrowser = async (target: "input" | "output") => {
    const startPath = target === "input" ? config.inputPath : config.outputDir;
    setBrowsing(target);
    setBrowsePath(startPath);
    try {
      const res = await fetch(`/api/browse?path=${encodeURIComponent(startPath)}`);
      const data = await res.json();
      if (data.items) {
        setBrowseItems(data.items.filter((i: BrowseItem) => i.type === "dir"));
      }
    } catch { /* ignore */ }
  };

  const navigateTo = async (path: string) => {
    setBrowsePath(path);
    try {
      const res = await fetch(`/api/browse?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.items) {
        setBrowseItems(data.items.filter((i: BrowseItem) => i.type === "dir"));
        setBrowsePath(data.current);
      }
    } catch { /* ignore */ }
  };

  const selectFolder = () => {
    if (browsing === "input") {
      setConfig({ ...config, inputPath: browsePath });
    } else if (browsing === "output") {
      setConfig({ ...config, outputDir: browsePath });
    }
    setBrowsing(null);
  };

  const setCropPreset = (presetId: string) => {
    const preset = CROP_PRESETS.find((p) => p.id === presetId);
    if (preset && "cropLeft" in preset) {
      setConfig({
        ...config,
        cropPreset: presetId,
        cropLeft: preset.cropLeft,
        cropTop: preset.cropTop,
        cropRight: preset.cropRight,
        cropBottom: preset.cropBottom,
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

  // Browse input folder
  useEffect(() => {
    if (!config.inputPath) return;
    fetch(`/api/browse?path=${encodeURIComponent(config.inputPath)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          const pdfs = data.items.filter((i: { type: string }) => i.type === "pdf");
          setFiles(pdfs);
          if (pdfs.length === 1 && selectedFiles.length === 0) {
            setSelectedFiles([pdfs[0].path]);
          }
        }
      })
      .catch(() => {});
  }, [config.inputPath]);

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
            // Collect results
            setAllResults((prev) => [...prev, ...data.files]);
            // Start next file if any
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

  const outputWithModel = `${config.outputDir}\\${config.ocrModel}`;

  const startJobs = async () => {
    if (selectedFiles.length === 0) return;
    setAllResults([]);
    setCurrentJobIdx(0);
    setStatus(null);

    const pattern = getPattern();
    const ids: string[] = [];

    for (const filePath of selectedFiles) {
      const params = new URLSearchParams({
        input_path: filePath,
        output_dir: outputWithModel,
        pattern,
        crop_left: String(config.cropLeft),
        crop_top: String(config.cropTop),
        crop_right: String(config.cropRight),
        crop_bottom: String(config.cropBottom),
        dpi: String(config.dpi),
        filename_template: config.fileNameTemplate,
      });

      const res = await fetch(`/api/split?${params}`, { method: "POST" });
      const data = await res.json();
      if (data.job_id) {
        ids.push(data.job_id);
      }
    }

    setJobIds(ids);
    setPolling(true);
  };

  const toggleFile = (path: string) => {
    setSelectedFiles((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const selectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((f) => f.path));
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
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
        {apiOk === null && (
          <span className="text-yellow-400">Checking API...</span>
        )}
        {apiOk === false && (
          <span className="text-red-400">
            API offline - run start.bat
          </span>
        )}
        {apiOk === true && (
          <span className="text-green-400">API connected</span>
        )}
      </div>

      {/* Configuration */}
      <div className="bg-gray-900 rounded-lg p-5 mb-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Input Folder
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                value={config.inputPath}
                onChange={(e) =>
                  setConfig({ ...config, inputPath: e.target.value })
                }
              />
              <button
                onClick={() => openBrowser("input")}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm whitespace-nowrap"
              >
                Browse
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Output Folder
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                value={config.outputDir}
                onChange={(e) =>
                  setConfig({ ...config, outputDir: e.target.value })
                }
              />
              <button
                onClick={() => openBrowser("output")}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm whitespace-nowrap"
              >
                Browse
              </button>
            </div>
            <span className="text-xs text-gray-500">
              Final: {outputWithModel}
            </span>
          </div>

          {/* Pattern Preset - friendly dropdown */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Ce caut in pagina?
            </label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              value={config.patternPreset}
              onChange={(e) =>
                setConfig({ ...config, patternPreset: e.target.value })
              }
            >
              {PATTERN_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500">
              {currentPreset?.description}
            </span>
          </div>

          {/* Keyword input - only for keyword preset */}
          {currentPreset && "needsKeyword" in currentPreset && currentPreset.needsKeyword && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Cuvant cheie
              </label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                placeholder="Ex: Comanda, Order, Factura..."
                value={config.patternKeyword}
                onChange={(e) =>
                  setConfig({ ...config, patternKeyword: e.target.value })
                }
              />
              <span className="text-xs text-gray-500">
                Va cauta: {config.patternKeyword || "Comanda"}: 12345
              </span>
            </div>
          )}

          {/* Custom regex - only for advanced */}
          {currentPreset && "isCustom" in currentPreset && currentPreset.isCustom && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Regex personalizat
              </label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
                placeholder="(?:Nr\.?\s*comanda:?\s*)(\d{8})"
                value={config.patternCustom}
                onChange={(e) =>
                  setConfig({ ...config, patternCustom: e.target.value })
                }
              />
              <span className="text-xs text-gray-500">
                Grupul (1) = valoarea extrasa pentru numele fisierului
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              OCR Model
            </label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              value={config.ocrModel}
              onChange={(e) =>
                setConfig({ ...config, ocrModel: e.target.value })
              }
            >
              <option value="rapidocr">RapidOCR (fast, ONNX)</option>
              <option value="easyocr">EasyOCR (PyTorch, slower)</option>
              <option value="tesseract">Tesseract (if installed)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              DPI (scan quality)
            </label>
            <input
              type="number"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              value={config.dpi}
              onChange={(e) =>
                setConfig({ ...config, dpi: parseInt(e.target.value) || 150 })
              }
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              File Name Template
            </label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono"
              value={config.fileNameTemplate}
              onChange={(e) =>
                setConfig({ ...config, fileNameTemplate: e.target.value })
              }
            />
            <span className="text-xs text-gray-500">
              Variables: {"{order}"} {"{pages}"} {"{index}"} → Preview: {config.fileNameTemplate.replace("{order}", "72544251").replace("{pages}", "5").replace("{index}", "1")}.pdf
            </span>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Zona de scanare OCR
            </label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              value={config.cropPreset}
              onChange={(e) => setCropPreset(e.target.value)}
            >
              {CROP_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            {config.cropPreset === "custom" && (
              <div className="flex gap-2 mt-2">
                {(["cropLeft", "cropTop", "cropRight", "cropBottom"] as const).map(
                  (key) => (
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
                          setConfig({
                            ...config,
                            [key]: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Selection - Multi-select */}
      <div className="bg-gray-900 rounded-lg p-5 mb-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Select PDFs</h2>
          {files.length > 1 && (
            <button
              onClick={selectAll}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {selectedFiles.length === files.length ? "Deselect all" : "Select all"}
            </button>
          )}
        </div>
        {files.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No PDF files found in input folder
          </p>
        ) : (
          <div className="space-y-2">
            {files.map((f) => (
              <label
                key={f.path}
                className={`flex items-center gap-3 p-3 rounded cursor-pointer border ${
                  selectedFiles.includes(f.path)
                    ? "border-blue-500 bg-blue-950/30"
                    : "border-gray-800 hover:border-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-blue-500"
                  checked={selectedFiles.includes(f.path)}
                  onChange={() => toggleFile(f.path)}
                />
                <span className="font-mono text-sm">{f.name}</span>
                {f.size_mb && (
                  <span className="text-gray-500 text-xs ml-auto">
                    {f.size_mb} MB
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={startJobs}
            disabled={selectedFiles.length === 0 || !apiOk || polling}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 px-6 py-2 rounded font-medium transition-colors"
          >
            {polling
              ? `Processing ${currentJobIdx + 1}/${jobIds.length}...`
              : `Start Split${selectedFiles.length > 1 ? ` (${selectedFiles.length} files)` : ""}`}
          </button>
          {selectedFiles.length > 0 && !polling && (
            <span className="text-sm text-gray-500">
              {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
            </span>
          )}
        </div>
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

          {/* Multi-file indicator */}
          {jobIds.length > 1 && (
            <p className="text-sm text-gray-400 mb-3">
              File {currentJobIdx + 1} of {jobIds.length}
              {status.input_file && ` — ${status.input_file.split("\\").pop()}`}
            </p>
          )}

          {/* Progress bar */}
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
              Page {status.current_page} / {status.total_pages} (
              {status.progress}%)
            </span>
            <span>Orders found: {status.orders_found}</span>
            <span>
              Elapsed: {formatTime(status.elapsed_seconds)} | ETA:{" "}
              {formatTime(status.eta_seconds)}
            </span>
          </div>

          {status.error && (
            <div className="bg-red-900/30 border border-red-800 rounded p-3 mb-4 text-red-300 text-sm">
              {status.error}
            </div>
          )}

          {/* Recent log */}
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

      {/* Results - shows accumulated results from all files */}
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
                        href={`/api/download/${f.name}?output_dir=${encodeURIComponent(outputWithModel)}`}
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
        </div>
      )}
      {/* Folder Browser Modal */}
      {browsing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-[600px] max-h-[500px] flex flex-col">
            <div className="p-4 border-b border-gray-800">
              <h3 className="font-semibold mb-2">
                Select {browsing === "input" ? "Input" : "Output"} Folder
              </h3>
              <div className="bg-gray-800 rounded px-3 py-2 text-sm font-mono text-gray-300 truncate">
                {browsePath}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {browseItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigateTo(item.path)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-sm flex items-center gap-2"
                >
                  <span className="text-yellow-400">
                    {item.name === ".." ? "^" : "/"}
                  </span>
                  <span>{item.name}</span>
                </button>
              ))}
              {browseItems.length === 0 && (
                <p className="text-gray-500 text-sm p-3">No subfolders</p>
              )}
            </div>
            <div className="p-4 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setBrowsing(null)}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={selectFolder}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm font-medium"
              >
                Select This Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
