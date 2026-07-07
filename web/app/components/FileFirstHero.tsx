"use client";

// File-first homepage entry: drop a file first, THEN choose what to do with it.
// The chosen tool page auto-loads the file via the pendingFile stash (client-side
// navigation), so the user never uploads twice. Additive — the classic tool
// navigation below stays exactly as it is.
import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUploadZone from "./FileUploadZone";
import { stashPendingFiles } from "../lib/pendingFile";

interface Intent {
  label: string;
  href: string;
  icon: string;
  why: string;
}

const ext = (f: File) => (f.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "");
const isPdf = (f: File) => ext(f) === ".pdf";
const isWord = (f: File) => ext(f) === ".doc" || ext(f) === ".docx";
const isImage = (f: File) => [".jpg", ".jpeg", ".png"].includes(ext(f));

function intentsFor(files: File[]): Intent[] {
  if (files.every(isPdf)) {
    if (files.length > 1) {
      return [
        { label: "Merge into one PDF", href: "/tools/merge-pdf", icon: "📑", why: `Combine your ${files.length} files into a single document` },
      ];
    }
    return [
      { label: "Edit text", href: "/tools/edit-pdf", icon: "✏️", why: "Change the words right on the page" },
      { label: "Compress", href: "/tools/compress-pdf", icon: "📉", why: "Make it lighter to share" },
      { label: "Split", href: "/tools/split-pdf", icon: "✂️", why: "Break it into separate files" },
      { label: "Convert to Word", href: "/tools/pdf-to-word", icon: "📝", why: "Get an editable .docx" },
      { label: "Sign", href: "/tools/sign-pdf", icon: "✍️", why: "Add your signature" },
      { label: "Make it searchable", href: "/tools/ocr-pdf", icon: "🔍", why: "Recognize text in scans" },
    ];
  }
  if (files.every(isWord)) {
    return [{ label: "Convert to PDF", href: "/tools/word-to-pdf", icon: "📄", why: "Turn your Word document into a PDF" }];
  }
  if (files.every(isImage)) {
    const allPng = files.every((f) => ext(f) === ".png");
    return [
      allPng
        ? { label: "Convert to PDF", href: "/tools/png-to-pdf", icon: "🖼️", why: "Turn your images into a PDF" }
        : { label: "Convert to PDF", href: "/tools/jpg-to-pdf", icon: "🖼️", why: "Turn your images into a PDF" },
    ];
  }
  return [];
}

const fmtSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function FileFirstHero() {
  const [files, setFiles] = useState<File[] | null>(null);
  const router = useRouter();

  const start = (intent: Intent) => {
    if (!files) return;
    stashPendingFiles(files);
    router.push(intent.href);
  };

  if (!files) {
    return (
      <div className="max-w-2xl mx-auto mb-8">
        <FileUploadZone
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          multiple={true}
          onFilesSelected={(f) => setFiles(f)}
        >
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="text-lg text-white mb-2">
            Drop your file here or <span className="text-blue-400">browse</span>
          </p>
          <p className="text-sm text-gray-500">
            PDF, Word or images — we&apos;ll show you what you can do with it
          </p>
        </FileUploadZone>
      </div>
    );
  }

  const intents = intentsFor(files);

  return (
    <div className="max-w-2xl mx-auto mb-8 bg-gray-900 border border-gray-800 rounded-xl p-6 text-left">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl" aria-hidden>
            📄
          </span>
          <span className="text-sm text-white truncate">
            {files.length === 1 ? files[0].name : `${files.length} files`}
          </span>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {fmtSize(files.reduce((s, f) => s + f.size, 0))}
          </span>
        </div>
        <button
          onClick={() => setFiles(null)}
          className="text-xs text-gray-400 hover:text-white whitespace-nowrap"
        >
          Start over
        </button>
      </div>

      {intents.length > 0 ? (
        <>
          <p className="text-sm font-medium text-gray-300 mb-3">What do you want to do with it?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {intents.map((it) => (
              <button
                key={it.href}
                onClick={() => start(it)}
                className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
              >
                <span className="text-xl flex-shrink-0" aria-hidden>
                  {it.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-white">{it.label}</span>
                  <span className="block text-xs text-gray-500">{it.why}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-400">
          Mixed file types — pick a tool from{" "}
          <a href="#tools" className="text-blue-400 hover:underline">
            all tools
          </a>{" "}
          below.
        </p>
      )}
    </div>
  );
}
