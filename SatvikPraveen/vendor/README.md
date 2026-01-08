If you have local builds of PDF.js (for example `pdf.mjs` and `pdf.worker.mjs`), you can place them
in this `vendor/` directory and the application will attempt to use them instead of the CDN copy.

How it works

- The application includes `vendor/load-local-pdfjs.js` which checks for `vendor/pdf.mjs`.
- If `vendor/pdf.mjs` exists it will be injected into the page and the loader will try to set
  `pdfjsLib.GlobalWorkerOptions.workerSrc` to `vendor/pdf.worker.mjs` (if present).
- If the local files are not present the loader falls back to the CDN version of PDF.js.

To use your local files

1. Copy your `pdf.mjs` to `vendor/pdf.mjs`.
2. Copy your `pdf.worker.mjs` to `vendor/pdf.worker.mjs`.
3. Reload the page served from the repo root. The loader will detect and load the local files.

Notes

- The loader tries to be tolerant of different PDF.js builds, but some builds are provided as ESM modules
  while others are UMD bundles. If you encounter errors after placing your local files here, please
  paste the first console error and I can adapt the loader to your specific build.
