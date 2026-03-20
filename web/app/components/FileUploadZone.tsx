"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth, getUsageStatus, PlanLimits } from "../lib/auth";

interface FileUploadZoneProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesSelected: (files: File[]) => void;
  children?: React.ReactNode;
}

export default function FileUploadZone({
  accept = ".pdf",
  multiple = false,
  maxSizeMB,
  onFilesSelected,
  children,
}: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();

  // Fetch user limits on mount
  useEffect(() => {
    async function fetchLimits() {
      try {
        const status = await getUsageStatus(getToken());
        setLimits(status.limits);
      } catch {
        // Use default free limits
        setLimits({
          max_file_size_mb: 50,
          pages_per_day: 200,
          has_ads: true,
          batch_processing: false,
          smart_tools: false,
          api_access: false,
        });
      }
    }
    fetchLimits();
  }, [getToken]);

  // Use plan-based limit or prop override
  const effectiveMaxSizeMB = maxSizeMB ?? limits?.max_file_size_mb ?? 50;

  const validateFiles = (files: File[]): File[] => {
    const maxBytes = effectiveMaxSizeMB * 1024 * 1024;
    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > maxBytes) {
        setError(`File "${file.name}" exceeds ${effectiveMaxSizeMB}MB limit for your plan`);
        continue;
      }
      validFiles.push(file);
    }

    return validFiles;
  };

  const handleFileSelect = (fileList: FileList | null) => {
    if (!fileList) return;
    setError(null);

    const files = Array.from(fileList);
    const validFiles = validateFiles(files);

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onTouchStart={(e) => {
          e.currentTarget.classList.add('bg-blue-950/20');
        }}
        onTouchEnd={(e) => {
          e.currentTarget.classList.remove('bg-blue-950/20');
        }}
        className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all touch-manipulation active:scale-[0.98] ${
          dragOver
            ? "border-blue-400 bg-blue-950/30"
            : "border-gray-700 hover:border-gray-500 bg-gray-900"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {children || (
          <>
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-lg text-white mb-2">
              Drop your {accept === ".pdf" ? "PDF" : "file"} here or{" "}
              <span className="text-blue-400">browse</span>
            </p>
            <p className="text-sm text-gray-500">
              {multiple ? "Multiple files supported" : "Single file"} - Max {effectiveMaxSizeMB}MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
