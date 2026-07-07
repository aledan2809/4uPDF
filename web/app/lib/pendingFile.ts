"use client";

// File-first entry handoff: the homepage dropzone stashes the dropped file(s) here,
// navigates client-side to the chosen tool, and the tool page picks them up on mount.
// Module state survives client-side navigation only — on a hard reload the stash is
// empty and the tool page simply shows its normal upload zone (graceful no-op).
import { useEffect, useRef } from "react";

let pending: File[] | null = null;

export function stashPendingFiles(files: File[]): void {
  pending = files;
}

export function takePendingFiles(): File[] | null {
  const p = pending;
  pending = null;
  return p;
}

/** Call once in a tool page: feeds stashed homepage files into the page's file handler. */
export function usePendingFiles(onFiles: (files: File[]) => void): void {
  const cb = useRef(onFiles);
  cb.current = onFiles;
  useEffect(() => {
    const p = takePendingFiles();
    if (p && p.length > 0) cb.current(p);
    // mount-only: the stash is a one-shot handoff
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
