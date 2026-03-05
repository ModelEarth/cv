/**
 * Enhanced Resume Loader Application
 *
 * Uses advanced modules:
 * - PdfAdvancedExtractor
 * - EnhancedResumeNormalizer
 * - TemplateRenderer
 */

const APP = {
  extractor: null,
  normalizer: null,
  state: {
    pdfFile: null,
    pdfArrayBuffer: null,
    extractedData: null,
    resumeJSON: null,
    currentTemplate: "elegant",
  },

  /**
   * Initialize the application
   */
  async init() {
    console.log("Initializing Enhanced Resume Loader...");

    // Wait for pdf.js to be ready
    await this.ensurePdfjsReady();

    // Initialize extractor
    this.extractor = new PdfAdvancedExtractor();

    // Setup event listeners
    this.setupEventListeners();

    // Register additional templates if needed
    this.registerCustomTemplates();

    console.log("✅ Application initialized");
  },

  /**
   * Ensure pdf.js is ready
   */
  async ensurePdfjsReady() {
    return new Promise((resolve) => {
      if (window.pdfjsLib) {
        resolve();
      } else {
        window.addEventListener("pdfjs-ready", () => resolve(), { once: true });
        setTimeout(() => {
          if (window.pdfjsLib) resolve();
        }, 1000);
      }
    });
  },

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // File upload
    const fileInput = document.getElementById("pdfInput");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => this.handleFileSelect(e));
    }

    // Parse button
    const parseBtn = document.getElementById("parseBtn");
    if (parseBtn) {
      parseBtn.addEventListener("click", () => this.handleParsePDF());
    }

    // Template selection
    const templateCards = document.querySelectorAll("[data-template]");
    templateCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const template = e.currentTarget.dataset.template;
        this.switchTemplate(template);
      });
    });

    // Export buttons
    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.handleExportHTML());
    }

    const jsonBtn = document.getElementById("downloadJsonBtn");
    if (jsonBtn) {
      jsonBtn.addEventListener("click", () => this.handleDownloadJSON());
    }

    const printBtn = document.getElementById("printBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => this.handlePrint());
    }

    // Drag and drop
    const uploadBox = document.getElementById("uploadBox");
    if (uploadBox) {
      uploadBox.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadBox.style.opacity = "0.7";
      });
      uploadBox.addEventListener("dragleave", () => {
        uploadBox.style.opacity = "1";
      });
      uploadBox.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadBox.style.opacity = "1";
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          document.getElementById("pdfInput").files = files;
          this.handleFileSelect({ target: { files } });
        }
      });
    }
  },

  /**
   * Handle file selection
   */
  async handleFileSelect(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    this.state.pdfFile = files[0];
    const fileInfo = document.getElementById("fileInfo");
    const fileName = document.getElementById("fileName");

    if (fileInfo && fileName) {
      fileName.textContent = this.state.pdfFile.name;
      fileInfo.classList.remove("is-hidden");
    }

    // Enable parse button
    const parseBtn = document.getElementById("parseBtn");
    if (parseBtn) {
      parseBtn.disabled = false;
    }

    console.log("PDF file selected:", this.state.pdfFile.name);
  },

  /**
   * Parse PDF and extract resume data
   */
  async handleParsePDF() {
    if (!this.state.pdfFile) {
      alert("Please select a PDF file first");
      return;
    }

    const loading = document.getElementById("loadingIndicator");
    if (loading) {
      loading.classList.remove("is-hidden");
    }

    try {
      // Read file
      const arrayBuffer = await this.state.pdfFile.arrayBuffer();
      this.state.pdfArrayBuffer = arrayBuffer;

      // Extract with advanced extractor
      console.log("Loading PDF...");
      const pdf = await this.extractor.loadPDF(arrayBuffer);

      console.log("Extracting metadata...");
      const metadata = await this.extractor.extractMetadata();
      console.log("📋 Metadata:", metadata);

      console.log("Extracting text...");
      const extractedData = await this.extractor.extractAllText({
        includeLayout: true,
        normalizeSpacing: true,
      });

      console.log("Extracting structured data...");
      const structured = await this.extractor.extractStructuredData();
      console.log("🔍 Structured:", structured);

      // Store extracted data
      this.state.extractedData = {
        text: extractedData.text,
        structured: extractedData.structured,
      };

      // Display raw text
      const rawOutput = document.getElementById("rawOutput");
      if (rawOutput) {
        rawOutput.value = extractedData.text.substring(0, 2000);
      }

      // Normalize resume
      console.log("Parsing resume...");
      this.normalizer = new EnhancedResumeNormalizer(this.state.extractedData);
      this.state.resumeJSON = this.normalizer.normalize();

      console.log("✅ Resume JSON:", this.state.resumeJSON);

      // Display JSON
      const jsonOutput = document.getElementById("jsonOutput");
      if (jsonOutput) {
        jsonOutput.value = JSON.stringify(this.state.resumeJSON, null, 2);
      }

      // Display preview with current template
      this.renderCurrentTemplate();

      // Enable export buttons
      this.enableExportButtons();

      console.log("✅ PDF parsed successfully!");
    } catch (error) {
      console.error("❌ Error parsing PDF:", error);
      alert("Error parsing PDF: " + error.message);
    } finally {
      if (loading) {
        loading.classList.add("is-hidden");
      }
    }
  },

  /**
   * Render current template
   */
  renderCurrentTemplate() {
    if (!this.state.resumeJSON && !window.SAMPLE_DATA) {
      console.warn("No resume data available");
      return;
    }

    const data = this.state.resumeJSON || window.SAMPLE_DATA;

    try {
      // Try new TemplateRenderer first
      if (
        window.TemplateRenderer &&
        window.TemplateRenderer.list().includes(this.state.currentTemplate)
      ) {
        const { html, css } = TemplateRenderer.render(
          this.state.currentTemplate,
          data,
          {
            accentColor: "#2c3e50",
            fontFamily: "Georgia, serif",
          }
        );
        this.displayTemplate(html, css);
      }
      // Fall back to legacy templates
      else if (
        window.TEMPLATES &&
        window.TEMPLATES[this.state.currentTemplate]
      ) {
        const { html, css } = renderTemplate(this.state.currentTemplate, data);
        this.displayTemplate(html, css);
      } else {
        console.error("Template not found:", this.state.currentTemplate);
      }
    } catch (error) {
      console.error("Error rendering template:", error);
    }
  },

  /**
   * Display template with styling
   */
  displayTemplate(html, css) {
    const container = document.getElementById("resumeContainer");
    if (!container) return;

    // Clear previous content
    container.innerHTML = html;

    // Apply styles
    let styleEl = document.getElementById("template-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "template-styles";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;

    // Mark tab as active
    const previewTab = document.getElementById("previewTab");
    if (previewTab) {
      previewTab.classList.add("active");
      if (!previewTab.classList.contains("active")) {
        previewTab.classList.add("active");
      }
    }
  },

  /**
   * Switch to different template
   */
  switchTemplate(templateName) {
    this.state.currentTemplate = templateName;
    console.log("Switching to template:", templateName);

    // Update UI selection
    const cards = document.querySelectorAll("[data-template]");
    cards.forEach((card) => {
      if (card.dataset.template === templateName) {
        card.style.boxShadow = "0 0 0 3px #2c3e50";
      } else {
        card.style.boxShadow = "";
      }
    });

    // Render
    this.renderCurrentTemplate();
  },

  /**
   * Export as HTML
   */
  handleExportHTML() {
    if (!this.state.resumeJSON && !window.SAMPLE_DATA) {
      alert("No resume data to export");
      return;
    }

    const data = this.state.resumeJSON || window.SAMPLE_DATA;
    const { html, css } = TemplateRenderer.render(
      this.state.currentTemplate,
      data
    );

    const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume - ${data.basics?.name || "Resume"}</title>
  <style>
    body { margin: 0; padding: 20px; background: #f5f5f5; }
    .resume-container { background: white; padding: 40px; max-width: 900px; margin: 0 auto; }
    ${css}
  </style>
</head>
<body>
  <div class="resume-container">
    ${html}
  </div>
</body>
</html>
    `;

    const blob = new Blob([fullHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-${this.state.currentTemplate}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("✅ HTML exported");
  },

  /**
   * Download JSON
   */
  handleDownloadJSON() {
    if (!this.state.resumeJSON && !window.SAMPLE_DATA) {
      alert("No resume data to download");
      return;
    }

    const data = this.state.resumeJSON || window.SAMPLE_DATA;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("✅ JSON downloaded");
  },

  /**
   * Print/Save as PDF
   */
  handlePrint() {
    window.print();
  },

  /**
   * Enable export buttons
   */
  enableExportButtons() {
    const buttons = ["exportBtn", "downloadJsonBtn", "printBtn"];
    buttons.forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = false;
    });
  },

  /**
   * Register custom templates
   */
  registerCustomTemplates() {
    // Additional templates can be registered here
    // TemplateRenderer.register('custom', customTemplate);
  },
};

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  APP.init().catch(console.error);
});
