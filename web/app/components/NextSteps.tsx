"use client";

import Link from "next/link";
import { nextStepsFor } from "../lib/toolMeta";

// "What's next?" — shown in a tool's result state to chain the user into the
// natural follow-up step for the document they just produced (e.g. merge → compress → sign).
export default function NextSteps({ tool }: { tool: string }) {
  const steps = nextStepsFor(tool);
  if (steps.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-gray-800 max-w-md mx-auto">
      <p className="text-sm font-medium text-gray-300 mb-3 text-center">
        What&apos;s next for this document?
      </p>
      <div className="space-y-2">
        {steps.map((s) => (
          <Link
            key={s.meta.href}
            href={s.meta.href}
            className="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group text-left"
          >
            <span className="text-xl flex-shrink-0" aria-hidden>
              {s.meta.icon}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm text-white">{s.meta.label}</span>
              <span className="block text-xs text-gray-500">{s.why}</span>
            </span>
            <svg
              className="w-4 h-4 text-gray-500 group-hover:text-blue-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
