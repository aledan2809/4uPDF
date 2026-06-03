// Copies the pdf.js worker out of node_modules into /public so it is served
// same-origin (no CDN, CSP-friendly) and always version-matched to the
// installed pdfjs-dist. Runs on predev + prebuild.
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const destDir = join(root, "public");
const dest = join(destDir, "pdf.worker.min.mjs");

if (!existsSync(src)) {
  // pdfjs-dist is a hard dependency; a missing worker means the Extract Figure
  // tool would silently break at runtime. Fail the build loudly instead.
  console.error("[copy-pdf-worker] pdf.js worker not found — run `npm install`:", src);
  process.exit(1);
}
mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log("[copy-pdf-worker] copied ->", dest);
