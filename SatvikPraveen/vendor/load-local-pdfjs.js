/*
  Loader that prefers local vendor/pdf.mjs and vendor/pdf.worker.mjs when present.
  If local files are not found, falls back to the CDN (same versions previously used).

  Behavior:
  - Attempts to fetch 'vendor/pdf.mjs'. If the file exists, it injects it as a script.
  - After the library loads, it attempts to set pdfjsLib.GlobalWorkerOptions.workerSrc to
    'vendor/pdf.worker.mjs'. If that worker file does not exist, it falls back to the CDN worker.
  - If local vendor files are not present, the loader will inject the CDN script and set the CDN worker.

  This approach avoids committing large third-party bundles into the repo unless you explicitly want them copied.
*/
(function () {
  const CDN_SCRIPT =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
  const CDN_WORKER =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

  async function fileExists(url) {
    try {
      const res = await fetch(url, { method: "GET" });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  function injectScript(src, isModule = false) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      if (isModule) s.type = "module";
      s.src = src;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  async function load() {
    const localLib = "vendor/pdf.mjs";
    const localWorker = "vendor/pdf.worker.mjs";

    const hasLocalLib = await fileExists(localLib);

    if (hasLocalLib) {
      try {
        // First attempt: try loading as a UMD/standalone script
        try {
          await injectScript(localLib, false);
          const hasLocalWorker = await fileExists(localWorker);
          if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = hasLocalWorker
              ? localWorker
              : CDN_WORKER;
          }
          // If loaded as UMD, we're done
          if (window.pdfjsLib) {
            console.info("Loaded local pdf.mjs as UMD and configured worker.");
            window.dispatchEvent(new Event("pdfjs-ready"));
            return;
          }
        } catch (umderr) {
          console.info(
            "Local pdf.mjs not loadable as UMD, trying ESM import...",
            umderr
          );
        }

        // Second attempt: try dynamic ESM import (handles module builds)
        try {
          const moduleUrl = new URL(localLib, document.baseURI).href;
          const mod = await import(/* webpackIgnore: true */ moduleUrl);

          // Try to find the export that looks like the pdfjs namespace (has getDocument)
          let candidate = null;
          if (mod.pdfjsLib && typeof mod.pdfjsLib.getDocument === "function")
            candidate = mod.pdfjsLib;
          else if (mod.default && typeof mod.default.getDocument === "function")
            candidate = mod.default;
          else if (typeof mod.getDocument === "function") candidate = mod;
          else {
            // Inspect other exported keys
            for (const k of Object.keys(mod)) {
              if (mod[k] && typeof mod[k].getDocument === "function") {
                candidate = mod[k];
                break;
              }
            }
          }

          if (candidate) {
            window.pdfjsLib = candidate;
            const hasLocalWorker = await fileExists(localWorker);
            if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = hasLocalWorker
                ? localWorker
                : CDN_WORKER;
            }
            console.info(
              "Loaded local pdf.mjs via dynamic import and configured worker."
            );
            // notify listeners
            window.dispatchEvent(new Event("pdfjs-ready"));
            return;
          } else {
            console.warn(
              "Loaded local pdf.mjs module but could not find pdfjs namespace exports."
            );
          }
        } catch (moderr) {
          console.warn("Failed to import local pdf.mjs as ESM:", moderr);
        }
      } catch (err) {
        console.warn("Failed to load local pdf.mjs, falling back to CDN:", err);
      }
    }

    // Fallback to CDN
    try {
      await injectScript(CDN_SCRIPT, false);
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_WORKER;
      }
    } catch (err) {
      console.error("Failed to load PDF.js from CDN:", err);
    }
  }

  // Start loading immediately
  load();
})();
