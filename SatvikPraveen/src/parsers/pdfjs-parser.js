/*
  PDFTextExtractor
  Lightweight wrapper around pdf.js to extract text from ArrayBuffer
  Exposes window.PDFTextExtractor.extractText(arrayBuffer) -> Promise<string>
  
  Waits for pdfjs-ready event if pdfjsLib not yet available.
*/
(function () {
  // Helper to ensure pdfjsLib is loaded
  async function ensurePdfjsReady() {
    // Check if already loaded
    if (window.pdfjsLib) {
      return;
    }

    // Check if module marked as ready
    if (window._pdfModuleReady) {
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("PDF.js did not load within 10 seconds"));
      }, 10000);

      // Try to listen for event
      const handleReady = function () {
        clearTimeout(timeout);
        window.removeEventListener("pdfjs-ready", handleReady);
        // Give module a moment to fully set window.pdfjsLib
        setTimeout(resolve, 50);
      };

      window.addEventListener("pdfjs-ready", handleReady);

      // Also set a flag that we're waiting
      window._pdfExtractorInitializing = true;
    });
  }

  // Initialize after a brief delay to ensure DOM is ready
  const initPDFExtractor = async function () {
    try {
      await ensurePdfjsReady();

      window.PDFTextExtractor = {
        extractText: async function (arrayBuffer) {
          // Re-ensure pdfjsLib is ready when called
          await ensurePdfjsReady();

          if (!window.pdfjsLib) {
            throw new Error(
              "pdfjsLib is not loaded. Ensure pdf.mjs module was loaded."
            );
          }

          const loadingTask = window.pdfjsLib.getDocument({
            data: arrayBuffer,
          });
          const pdf = await loadingTask.promise;

          let fullText = "";
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Try to order text items by vertical (y) then horizontal (x) position to improve reading order
            const items = textContent.items.slice();
            items.sort((a, b) => {
              const ay = (a.transform && a.transform[5]) || 0;
              const by = (b.transform && b.transform[5]) || 0;
              // higher y usually appears earlier on page in pdf.js coordinates
              if (Math.abs(by - ay) > 0.5) return by - ay;
              const ax = (a.transform && a.transform[4]) || 0;
              const bx = (b.transform && b.transform[4]) || 0;
              return ax - bx;
            });

            // Group text by line (y-coordinate) to preserve line breaks
            const lines = [];
            let currentLine = { y: null, text: [] };

            for (const item of items) {
              const y = (item.transform && item.transform[5]) || 0;

              // If y position changes significantly, start a new line
              if (currentLine.y !== null && Math.abs(y - currentLine.y) > 0.5) {
                if (currentLine.text.length > 0) {
                  lines.push(currentLine.text.join(" "));
                }
                currentLine = { y: y, text: [item.str] };
              } else {
                currentLine.y = y;
                currentLine.text.push(item.str);
              }
            }

            // Add the last line
            if (currentLine.text.length > 0) {
              lines.push(currentLine.text.join(" "));
            }

            const pageText = lines.join("\n");
            fullText += pageText + "\n\n";
          }

          return fullText.trim();
        },
      };

      console.log("[PDFTextExtractor] ✅ Initialized successfully");
    } catch (error) {
      console.error(
        "[PDFTextExtractor] ❌ Initialization failed:",
        error.message
      );
      window.PDFTextExtractorError = error;
    }
  };

  // Try to initialize immediately if module is ready
  if (window._pdfModuleReady || window.pdfjsLib) {
    initPDFExtractor();
  } else {
    // Otherwise wait for DOM to be ready and then initialize
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initPDFExtractor);
    } else {
      // DOM already ready
      setTimeout(initPDFExtractor, 10);
    }
  }
})();
