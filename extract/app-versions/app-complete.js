/**
 * app-complete.js
 *
 * FULLY-FEATURED APPLICATION USING ALL PDF.JS CAPABILITIES
 * Utilizes:
 * - PdfMasterApi (56+ APIs)
 * - EnhancedPdfProcessor (domain logic)
 * - PdfAdvancedFeatures (advanced operations)
 * - TemplateRenderer (template system)
 */

class CompleteApp {
  constructor() {
    // Core modules
    this.api = null;
    this.processor = null;
    this.features = null;

    // State
    this.currentPdf = null;
    this.currentResumeData = null;
    this.currentTemplate = "classic";
    this.processingResult = null;

    // UI elements
    this.pdfInput = document.getElementById("pdfInput");
    this.uploadBox = document.getElementById("uploadBox");
    this.fileInfo = document.getElementById("fileInfo");
    this.fileName = document.getElementById("fileName");
    this.parseBtn = document.getElementById("parseBtn");
    this.loadingIndicator = document.getElementById("loadingIndicator");
    this.dataPreview = document.getElementById("dataPreview");
    this.jsonOutput = document.getElementById("jsonOutput");
    this.rawOutput = document.getElementById("rawOutput");
    this.resumeContainer = document.getElementById("resumeContainer");
    this.exportBtn = document.getElementById("exportBtn");
    this.downloadJsonBtn = document.getElementById("downloadJsonBtn");
    this.printBtn = document.getElementById("printBtn");
    this.templateCards = document.querySelectorAll(".template-card");
    this.tabBtns = document.querySelectorAll(".tab-btn");

    this.init();
  }

  /**
   * Initialize application
   */
  async init() {
    try {
      console.log("Initializing Complete App with full PDF.js capabilities...");

      // Wait for pdf.js to be ready
      await this._waitForPdfjsReady();

      // Initialize core modules
      this.api = new PdfMasterApi();
      await this.api.initialize();

      this.processor = new EnhancedPdfProcessor();
      await this.processor.initialize();

      this.features = new PdfAdvancedFeatures(this.api);

      console.log("✅ All modules initialized");
      console.log("📊 Memory stats:", this.api.getMemoryStats());

      // Setup event listeners
      this._setupEventListeners();
      console.log("✅ Event listeners attached");
    } catch (error) {
      console.error("Initialization failed:", error);
      this._showError("Failed to initialize application", error);
    }
  }

  /**
   * Wait for PDF.js to be ready
   */
  _waitForPdfjsReady() {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("PDF.js did not load"));
      }, 10000);

      window.addEventListener("pdfjs-ready", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    // File upload
    this.pdfInput.addEventListener("change", (e) => this._handleFileSelect(e));
    this.uploadBox.addEventListener("dragover", (e) => this._handleDragOver(e));
    this.uploadBox.addEventListener("dragleave", (e) =>
      this._handleDragLeave(e)
    );
    this.uploadBox.addEventListener("drop", (e) => this._handleDrop(e));

    // Parse button
    this.parseBtn.addEventListener("click", () => this._handleParsePdf());

    // Remove file
    document.getElementById("removeFile").addEventListener("click", () => {
      this.pdfInput.value = "";
      this.fileInfo.classList.add("is-hidden");
      this.parseBtn.disabled = true;
      this.currentPdf = null;
    });

    // Template selection
    this.templateCards.forEach((card) => {
      card.addEventListener("click", () => this._selectTemplate(card));
    });

    // Tab switching
    this.tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => this._switchTab(btn));
    });

    // Export buttons
    this.exportBtn.addEventListener("click", () => this._handleExport());
    this.downloadJsonBtn.addEventListener("click", () =>
      this._handleDownloadJson()
    );
    this.printBtn.addEventListener("click", () => this._handlePrint());
  }

  /**
   * Handle file selection
   */
  _handleFileSelect(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    const file = files[0];

    if (!file.type.includes("pdf")) {
      this._showError("Please select a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this._showError("File size exceeds 10MB limit");
      return;
    }

    this._displayFileInfo(file);
  }

  /**
   * Handle drag over
   */
  _handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadBox.classList.add("dragover");
  }

  /**
   * Handle drag leave
   */
  _handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadBox.classList.remove("dragover");
  }

  /**
   * Handle drop
   */
  _handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadBox.classList.remove("dragover");

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      this.pdfInput.files = files;
      this._handleFileSelect({ target: { files } });
    }
  }

  /**
   * Display file info
   */
  _displayFileInfo(file) {
    this.fileName.textContent = file.name;
    this.fileInfo.classList.remove("is-hidden");
    this.parseBtn.disabled = false;
    this.currentPdf = file;
  }

  /**
   * Handle PDF parsing
   */
  async _handleParsePdf() {
    if (!this.currentPdf) return;

    try {
      this._setLoading(true);

      // Read file
      const arrayBuffer = await this.currentPdf.arrayBuffer();

      console.log("🔄 Processing PDF with COMPLETE capabilities...");

      // Process PDF with ALL features enabled
      this.processingResult = await this.processor.processPdf(arrayBuffer, {
        extractMetadata: true,
        extractText: true,
        extractAnnotations: true,
        extractForms: true,
        renderThumbnails: true,
        structuralAnalysis: true,
      });

      console.log("✅ PDF processed successfully");
      console.log("📊 Result:", this.processingResult);

      // Open document for advanced operations
      const pdfDoc = await this.processor.api.openDocument(arrayBuffer);

      // Parse resume data
      console.log("🔄 Parsing resume data...");
      this.currentResumeData = await this.processor.parseResume(pdfDoc);
      console.log("✅ Resume parsed:", this.currentResumeData);

      // Extract advanced features
      console.log("🔄 Extracting advanced features...");
      const outlineData = await this.features.extractOutline(pdfDoc);
      const formFields = await this.features.extractFormFieldsWithValidation(
        pdfDoc
      );

      console.log("✅ Advanced features extracted");
      console.log("📑 Outline:", outlineData);
      console.log("📋 Form fields:", formFields);

      // Generate thumbnail grid
      const thumbnails = await this.features.generateThumbnailGrid(pdfDoc, {
        thumbWidth: 120,
        columns: 3,
        maxPages: 5,
      });
      console.log("📸 Thumbnails generated:", thumbnails.thumbnails.length);

      // Update UI
      this._displayExtractedData();
      this._displayResumePreview();

      // Enable export buttons
      this.exportBtn.disabled = false;
      this.downloadJsonBtn.disabled = false;
      this.printBtn.disabled = false;

      // Log performance metrics
      console.log(
        "⏱️ Performance metrics:",
        this.features.getPerformanceMetrics()
      );
      console.log("💾 Memory stats:", this.api.getMemoryStats());

      this._setLoading(false);
    } catch (error) {
      console.error("PDF parsing failed:", error);
      this._showError("Failed to parse PDF", error);
      this._setLoading(false);
    }
  }

  /**
   * Display extracted data
   */
  _displayExtractedData() {
    if (!this.processingResult) return;

    // Update JSON output
    this.jsonOutput.value = JSON.stringify(this.currentResumeData, null, 2);

    // Update raw output
    this.rawOutput.value = this.processingResult.text;

    // Update preview
    const previewHtml = `
      <div class="extracted-summary">
        <h3>📊 Extraction Summary</h3>
        <dl>
          <dt>Total Pages</dt>
          <dd>${this.processingResult.statistics.totalPages}</dd>
          
          <dt>Processing Time</dt>
          <dd>${(
            this.processingResult.statistics.processingTime / 1000
          ).toFixed(2)}s</dd>
          
          <dt>Text Extracted</dt>
          <dd>${(
            this.processingResult.statistics.extractedTextLength / 1000
          ).toFixed(1)}KB</dd>
          
          <dt>Annotations Found</dt>
          <dd>${this.processingResult.statistics.annotationCount}</dd>
          
          <dt>Document Title</dt>
          <dd>${this.processingResult.metadata?.title || "Not available"}</dd>
          
          <dt>Document Author</dt>
          <dd>${this.processingResult.metadata?.author || "Not available"}</dd>
        </dl>
        
        ${
          this.processingResult.annotations.length > 0
            ? `
          <h4>📝 Annotations (${
            this.processingResult.annotations.length
          } found)</h4>
          <ul>
            ${this.processingResult.annotations
              .slice(0, 5)
              .map(
                (a) => `
              <li>
                <strong>${a.type}</strong> (Page ${a.page}): 
                ${a.contents || "No content"}
              </li>
            `
              )
              .join("")}
          </ul>
        `
            : ""
        }
      </div>
    `;

    this.dataPreview.innerHTML = previewHtml;
  }

  /**
   * Display resume preview
   */
  _displayResumePreview() {
    if (!this.currentResumeData) return;

    const template = TemplateRenderer.render(
      this.currentTemplate,
      this.currentResumeData
    );

    if (template) {
      this.resumeContainer.innerHTML = template.html;

      // Inject CSS
      let styleEl = document.getElementById("template-styles");
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "template-styles";
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = template.css;
    }
  }

  /**
   * Select template
   */
  _selectTemplate(card) {
    // Remove active class from all cards
    this.templateCards.forEach((c) => c.classList.remove("active"));

    // Add active class to selected card
    card.classList.add("active");

    // Get template name
    const templateName = card.getAttribute("data-template");
    this.currentTemplate = templateName;

    // Re-render if resume data exists
    if (this.currentResumeData) {
      this._displayResumePreview();
    }
  }

  /**
   * Switch tab
   */
  _switchTab(btn) {
    const tabName = btn.getAttribute("data-tab");

    // Remove active class from all buttons and contents
    this.tabBtns.forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => {
      c.classList.remove("active");
    });

    // Add active class
    btn.classList.add("active");
    const tabContent = document.getElementById(tabName + "Tab");
    if (tabContent) {
      tabContent.classList.add("active");
    }
  }

  /**
   * Handle export
   */
  _handleExport() {
    if (!this.currentResumeData) {
      this._showError("No resume data to export");
      return;
    }

    const html = this.resumeContainer.innerHTML;
    const filename = `resume-${this.currentTemplate}-${Date.now()}.html`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    console.log("✅ Exported HTML:", filename);
  }

  /**
   * Handle download JSON
   */
  _handleDownloadJson() {
    if (!this.currentResumeData) {
      this._showError("No resume data to download");
      return;
    }

    const json = JSON.stringify(this.currentResumeData, null, 2);
    const filename = `resume-data-${Date.now()}.json`;

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    console.log("✅ Downloaded JSON:", filename);
  }

  /**
   * Handle print
   */
  _handlePrint() {
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(
      "<html><head><title>Resume</title></head><body>"
    );
    printWindow.document.write(this.resumeContainer.innerHTML);

    // Add template CSS
    const styleEl = document.getElementById("template-styles");
    if (styleEl) {
      printWindow.document.write("<style>" + styleEl.textContent + "</style>");
    }

    printWindow.document.write("</body></html>");
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);

    console.log("🖨️ Print dialog opened");
  }

  /**
   * Set loading state
   */
  _setLoading(loading) {
    if (loading) {
      this.loadingIndicator.classList.remove("is-hidden");
      this.parseBtn.disabled = true;
    } else {
      this.loadingIndicator.classList.add("is-hidden");
      this.parseBtn.disabled = this.pdfInput.files.length === 0;
    }
  }

  /**
   * Show error
   */
  _showError(message, error) {
    console.error(message, error);
    alert(`${message}\n\n${error?.message || ""}`);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.api?.destroy();
    this.processor?.destroy();
    this.features?.cleanup();
    console.log("✅ App cleaned up");
  }
}

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.app = new CompleteApp();
  });
} else {
  window.app = new CompleteApp();
}
