/**
 * PdfAdvancedExtractor
 *
 * Advanced PDF text and metadata extraction using full pdf.mjs capabilities
 * - Text extraction with layout analysis
 * - Metadata extraction (title, author, subject)
 * - Page analysis (dimensions, text density)
 * - Rich text content detection
 * - Structured content ordering
 */

class PdfAdvancedExtractor {
  constructor() {
    this.pdf = null;
    this.textContent = [];
    this.metadata = {};
    this.pageMetrics = [];
  }

  /**
   * Wait for pdfjsLib to be available
   */
  async ensurePdfjsReady() {
    if (window.pdfjsLib) {
      return window.pdfjsLib;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("PDF.js did not load within 10 seconds"));
      }, 10000);

      window.addEventListener(
        "pdfjs-ready",
        function onReady() {
          clearTimeout(timeout);
          window.removeEventListener("pdfjs-ready", onReady);
          resolve(window.pdfjsLib);
        },
        { once: true }
      );
    });
  }

  /**
   * Load PDF from ArrayBuffer
   */
  async loadPDF(arrayBuffer) {
    const pdfjsLib = await this.ensurePdfjsReady();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    this.pdf = await loadingTask.promise;
    return this.pdf;
  }

  /**
   * Extract metadata from PDF
   */
  async extractMetadata() {
    if (!this.pdf) throw new Error("PDF not loaded");

    try {
      const meta = await this.pdf.getMetadata();
      this.metadata = {
        title: meta.info?.Title || "",
        author: meta.info?.Author || "",
        subject: meta.info?.Subject || "",
        keywords: meta.info?.Keywords || "",
        producer: meta.info?.Producer || "",
        creationDate: meta.info?.CreationDate || "",
        modificationDate: meta.info?.ModDate || "",
        pages: this.pdf.numPages,
      };
      return this.metadata;
    } catch (error) {
      console.warn("Could not extract metadata:", error);
      return this.metadata;
    }
  }

  /**
   * Extract text from all pages with advanced layout analysis
   */
  async extractAllText(options = {}) {
    if (!this.pdf) throw new Error("PDF not loaded");

    const { includeLayout = true, normalizeSpacing = true } = options;
    let fullText = "";
    const structuredContent = [];

    for (let pageNum = 1; pageNum <= this.pdf.numPages; pageNum++) {
      const pageContent = await this.extractPageContent(pageNum, {
        includeLayout,
        normalizeSpacing,
      });

      structuredContent.push({
        page: pageNum,
        content: pageContent,
      });

      fullText += pageContent.text + "\n\n";
    }

    this.textContent = structuredContent;
    return {
      text: fullText.trim(),
      structured: structuredContent,
    };
  }

  /**
   * Extract content from a single page with detailed analysis
   */
  async extractPageContent(pageNum, options = {}) {
    const { includeLayout = true, normalizeSpacing = true } = options;

    const page = await this.pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });

    // Get page dimensions
    const pageMetrics = {
      page: pageNum,
      width: viewport.width,
      height: viewport.height,
      itemCount: textContent.items.length,
    };
    this.pageMetrics.push(pageMetrics);

    // Process text items
    const items = textContent.items.slice();

    // Sort by position (y first, then x) for natural reading order
    if (includeLayout) {
      items.sort((a, b) => {
        const ay = (a.transform && a.transform[5]) || 0;
        const by = (b.transform && b.transform[5]) || 0;

        // Group by vertical position (tolerance: 1.5)
        if (Math.abs(by - ay) > 1.5) {
          return by - ay; // Higher y = earlier on page in pdf.js coords
        }

        const ax = (a.transform && a.transform[4]) || 0;
        const bx = (b.transform && b.transform[4]) || 0;
        return ax - bx;
      });
    }

    // Extract text with formatting info
    const lines = [];
    let currentLine = [];
    let lastY = null;

    for (const item of items) {
      const y = (item.transform && item.transform[5]) || 0;

      // Detect line breaks (vertical change > tolerance)
      if (lastY !== null && Math.abs(y - lastY) > 1.5) {
        if (currentLine.length > 0) {
          lines.push({
            text: currentLine.map((x) => x.str).join(" "),
            items: currentLine,
            y: lastY,
          });
          currentLine = [];
        }
      }

      currentLine.push(item);
      lastY = y;
    }

    // Add final line
    if (currentLine.length > 0) {
      lines.push({
        text: currentLine.map((x) => x.str).join(" "),
        items: currentLine,
        y: lastY,
      });
    }

    // Build page text
    let pageText = lines.map((line) => line.text).join("\n");

    // Normalize spacing if requested
    if (normalizeSpacing) {
      pageText = pageText
        .replace(/\s+/g, " ") // Multiple spaces to single
        .replace(/\n\s*\n/g, "\n") // Remove blank lines
        .trim();
    }

    return {
      text: pageText,
      lines: lines,
      metrics: pageMetrics,
      rawItems: items,
    };
  }

  /**
   * Extract text by regions (useful for structured data)
   */
  async extractRegions(pageNum, regions) {
    const page = await this.pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const results = {};

    for (const [name, region] of Object.entries(regions)) {
      const itemsInRegion = textContent.items.filter((item) => {
        const x = (item.transform && item.transform[4]) || 0;
        const y = (item.transform && item.transform[5]) || 0;
        return (
          x >= region.x &&
          x <= region.x + region.width &&
          y >= region.y &&
          y <= region.y + region.height
        );
      });

      results[name] = itemsInRegion.map((item) => item.str).join(" ");
    }

    return results;
  }

  /**
   * Extract structured data (headings, paragraphs, etc.)
   */
  async extractStructuredData() {
    const allText = await this.extractAllText();
    const structured = {
      headings: [],
      sections: [],
      lists: [],
      emails: [],
      phones: [],
      urls: [],
    };

    const lines = allText.text.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect email
      const emailMatch = trimmed.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      );
      if (emailMatch) structured.emails.push(...emailMatch);

      // Detect phone
      const phoneMatch = trimmed.match(
        /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
      );
      if (phoneMatch) structured.phones.push(...phoneMatch);

      // Detect URL
      const urlMatch = trimmed.match(/https?:\/\/[^\s]+|www\.[^\s]+/gi);
      if (urlMatch) structured.urls.push(...urlMatch);

      // Detect headings (ALL CAPS or ends with colon)
      if (
        trimmed === trimmed.toUpperCase() &&
        trimmed.length > 3 &&
        !trimmed.match(/^\d/)
      ) {
        structured.headings.push(trimmed);
      }

      // Detect list items (start with bullet or dash)
      if (trimmed.match(/^[-•*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
        structured.lists.push(trimmed);
      }
    }

    return {
      ...structured,
      emails: [...new Set(structured.emails)],
      phones: [...new Set(structured.phones)],
      urls: [...new Set(structured.urls)],
      headings: [...new Set(structured.headings)],
    };
  }

  /**
   * Get PDF statistics
   */
  getStatistics() {
    return {
      metadata: this.metadata,
      pageCount: this.pdf.numPages,
      pageMetrics: this.pageMetrics,
      totalItems: this.pageMetrics.reduce((sum, p) => sum + p.itemCount, 0),
      averageItemsPerPage:
        this.pageMetrics.length > 0
          ? this.pageMetrics.reduce((sum, p) => sum + p.itemCount, 0) /
            this.pageMetrics.length
          : 0,
    };
  }

  /**
   * Render page to canvas (optional - for preview)
   */
  async renderPageToCanvas(pageNum, canvasElement, scale = 1.5) {
    const page = await this.pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const context = canvasElement.getContext("2d");
    canvasElement.width = viewport.width;
    canvasElement.height = viewport.height;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.pdf) {
      this.pdf.destroy();
    }
    this.pdf = null;
    this.textContent = [];
    this.metadata = {};
    this.pageMetrics = [];
  }
}

// Export for use
window.PdfAdvancedExtractor = PdfAdvancedExtractor;
