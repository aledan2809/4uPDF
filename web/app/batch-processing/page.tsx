"use client";

import { useState } from "react";
import { useAuth } from "../lib/auth";

interface BatchJob {
  id: string;
  type: string;
  status: string;
  progress: number;
  total_files: number;
  processed_files: number;
  started_at: number;
  finished_at?: number;
  download_url?: string;
}

export default function BatchProcessingDashboard() {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [batchType, setBatchType] = useState<"archive" | "split" | "invoice" | "receipt">("archive");
  const [isUploading, setIsUploading] = useState(false);
  const { getToken } = useAuth();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const formData = new FormData();

      if (batchType === "archive") {
        formData.append("file", selectedFiles[0]);
        const response = await fetch("http://localhost:3099/api/archive-processor/upload", {
          method: "POST",
          headers,
          body: formData,
        });
        const data = await response.json();
        addJobToMonitor(data.job_id, "Archive Processing");
      } else if (batchType === "split") {
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append("files", selectedFiles[i]);
        }
        formData.append("split_pattern", "order");
        const response = await fetch("http://localhost:3099/api/batch-document-splitter/upload", {
          method: "POST",
          headers,
          body: formData,
        });
        const data = await response.json();
        addJobToMonitor(data.job_id, "Batch Split");
      } else if (batchType === "invoice") {
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append("files", selectedFiles[i]);
        }
        formData.append("export_format", "excel");
        const response = await fetch("http://localhost:3099/api/invoice-extractor/upload", {
          method: "POST",
          headers,
          body: formData,
        });
        const data = await response.json();
        addJobToMonitor(data.job_id, "Invoice Extraction");
      } else if (batchType === "receipt") {
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append("files", selectedFiles[i]);
        }
        formData.append("export_format", "excel");
        const response = await fetch("http://localhost:3099/api/receipt-extractor/upload", {
          method: "POST",
          headers,
          body: formData,
        });
        const data = await response.json();
        addJobToMonitor(data.job_id, "Receipt Extraction");
      }

      setSelectedFiles(null);
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const addJobToMonitor = (jobId: string, type: string) => {
    const newJob: BatchJob = {
      id: jobId,
      type,
      status: "processing",
      progress: 0,
      total_files: 0,
      processed_files: 0,
      started_at: Date.now() / 1000,
    };
    setJobs((prev) => [newJob, ...prev]);
    pollJobStatus(jobId);
  };

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3099/api/batch-processing/status/${jobId}`);
        const data = await response.json();

        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: data.status,
                  progress: data.progress,
                  total_files: data.total_files,
                  processed_files: data.processed_files,
                  finished_at: data.finished_at,
                  download_url: data.download_url,
                }
              : job
          )
        );

        if (data.status === "done" || data.status === "error") {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Failed to poll job status:", error);
        clearInterval(interval);
      }
    }, 1000);
  };

  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Batch Processing Dashboard</h1>
          <p className="text-gray-400">Upload and monitor multiple file processing jobs in real-time</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">New Batch Job</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Job Type</label>
              <select
                value={batchType}
                onChange={(e) => setBatchType(e.target.value as any)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="archive">Archive Processor (ZIP)</option>
                <option value="split">Batch Document Splitter</option>
                <option value="invoice">Invoice Extractor</option>
                <option value="receipt">Receipt Extractor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {batchType === "archive" ? "ZIP Archive" : "PDF Files"}
              </label>
              <input
                id="file-input"
                type="file"
                accept={batchType === "archive" ? ".zip" : ".pdf"}
                multiple={batchType !== "archive"}
                onChange={handleFileSelect}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-700"
              />
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFiles || isUploading}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
          >
            {isUploading ? "Uploading..." : "Start Processing"}
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Active Jobs</h2>

          {jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No jobs yet. Upload files to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">{job.type}</h3>
                      <p className="text-sm text-gray-400">ID: {job.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === "processing" && (
                        <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full">Processing</span>
                      )}
                      {job.status === "done" && (
                        <span className="px-3 py-1 bg-green-600/20 text-green-400 text-sm rounded-full">Complete</span>
                      )}
                      {job.status === "error" && (
                        <span className="px-3 py-1 bg-red-600/20 text-red-400 text-sm rounded-full">Error</span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        {job.processed_files} / {job.total_files} files
                      </span>
                      <span className="text-sm text-gray-400">{job.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {job.finished_at
                        ? `Completed in ${formatElapsedTime(job.finished_at - job.started_at)}`
                        : `Running for ${formatElapsedTime(Date.now() / 1000 - job.started_at)}`}
                    </span>
                    {job.download_url && (
                      <a
                        href={job.download_url}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
