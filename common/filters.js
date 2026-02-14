/**
 * CV Filters Module - Common filter/dropdown functionality for CV pages
 * jQuery-compatible selector and filter management
 * 
 * Usage:
 *   CVFilters.init({
 *     personFolder: 'YashGondkar',
 *     defaultJson: 'detailed.json',
 *     defaultTheme: 'elegant'
 *   });
 */

(function(window) {
  'use strict';

  // jQuery-safe selector function
  // Uses jQuery if available, otherwise falls back to native querySelector
  function select(selector) {
    if (typeof jQuery !== 'undefined') {
      const jqResult = jQuery(selector);
      return jqResult.length > 0 ? jqResult[0] : null;
    }
    return document.querySelector(selector);
  }

  // Get multiple elements
  function selectAll(selector) {
    if (typeof jQuery !== 'undefined') {
      return Array.from(jQuery(selector));
    }
    return Array.from(document.querySelectorAll(selector));
  }

  // Configuration
  let config = {
    personFolder: '',
    defaultJson: 'detailed.json',
    defaultTheme: 'elegant',
    showReadme: true,
    showDataPreview: true
  };
  let currentResumeData = null;
  let currentJsonFile = '';
  let currentTheme = '';

  // Theme options (12 local custom themes)
  const THEMES = [
    { value: 'creative-studio', label: 'Creative Studio' },
    { value: 'data-driven', label: 'Data Driven' },
    { value: 'elegant', label: 'Elegant' },
    { value: 'executive-slate', label: 'Executive Slate' },
    { value: 'kendall', label: 'Kendall' },
    { value: 'macchiato', label: 'Macchiato' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'modern-classic', label: 'Modern Classic' },
    { value: 'onepage', label: 'OnePage' },
    { value: 'professional', label: 'Professional' },
    { value: 'pumpkin', label: 'Pumpkin' },
    { value: 'striking', label: 'Striking' }
  ];

  // URL parameter utilities
  function getParam(key, fallback) {
    return new URLSearchParams(location.search).get(key) ?? fallback;
  }

  function setParam(params) {
    const url = new URL(location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    history.replaceState(null, '', url.toString());
  }

  // Generate filter HTML
  function generateFilterHTML() {
    return `
      <style>
        .cv-filters-section {
          margin-bottom: 40px;
        }
        .cv-filters-section h3 {
          margin-bottom: 10px;
        }
        .cv-filters-row {
          padding: 8px;
          display: flex;
          align-items: center;
          /*
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 15px;
          */
        }
        .cv-filters-spacer {
          flex: 1 1 auto;
        }
        #map-print-download-icons {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }
        .cv-icon-menu {
          position: relative;
        }
        .cv-icon-btn {
          width: 34px;
          height: 34px;
          border: 1px solid #d9d9d9;
          border-radius: 999px;
          background: #fff;
          color: #444;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }
        .cv-icon-btn:hover {
          background: #f5f5f5;
          border-color: #c7c7c7;
          color: #111;
        }
        .cv-icon-btn .material-icons {
          font-size: 18px;
        }
        .cv-icon-popup {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 210px;
          border-radius: 10px;
          border: 1px solid #ddd;
          background: #fff;
          box-shadow: 0 10px 28px rgba(0,0,0,0.12);
          overflow: hidden;
          display: none;
          z-index: 2000;
        }
        .cv-icon-popup.open {
          display: block;
        }
        .cv-icon-popup button {
          width: 100%;
          border: 0;
          border-top: 1px solid #eee;
          background: transparent;
          padding: 10px 12px;
          text-align: left;
          font: 14px/1.3 system-ui;
          color: #333;
          cursor: pointer;
        }
        .cv-icon-popup button:first-child {
          border-top: 0;
        }
        .cv-icon-popup button:hover {
          background: #f7f7f7;
        }
        .dark .cv-icon-btn {
          background: #222;
          border-color: #434343;
          color: #ddd;
        }
        .dark .cv-icon-btn:hover {
          background: #2f2f2f;
          border-color: #5a5a5a;
          color: #fff;
        }
        .dark .cv-icon-popup {
          background: #1f1f1f;
          border-color: #3f3f3f;
          box-shadow: 0 10px 28px rgba(0,0,0,0.4);
        }
        .dark .cv-icon-popup button {
          color: #e4e4e4;
          border-top-color: #343434;
        }
        .dark .cv-icon-popup button:hover {
          background: #2a2a2a;
        }
        .cv-filters-row label {
          margin-right: 8px;
          font-weight: 500;
        }
        #cvFiltersContainer select {
          border: 1px solid #d9d9d9;
        }
        .cv-iframe-preview {
          width: 100%;
          height: 900px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          margin: 15px 0;
        }
        .cv-data-preview {
          background: #f4f4f4;
          padding: 15px;
          border-radius: 8px;
          white-space: pre-wrap;
          overflow-x: auto;
          max-height: 320px;
          font-family: monospace;
          font-size: 13px;
        }
        .cv-data-status {
          margin-top: 8px;
          font: 13px/1.4 system-ui;
          color: #666;
        }
        .cv-readme-content {
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          line-height: 1.6;
        }
        .dark .pdf-info {
          background: #1e2c36;
          color: #d8e8f5;
        }
        .dark .pdf-info a {
          color: #7fc0ff;
        }
        .dark .pdf-info a:hover {
          color: #a8d6ff;
        }
      </style>
      
      <div class="cv-filters-section">
        <div class="cv-filters-row">
          <label>Data:</label>
          <select id="cvJsonSelect">
            <option value="detailed.json">detailed.json</option>
          </select>

          <label style="margin-left:12px;">Theme:</label>
          <select id="cvThemeSelect">
            ${THEMES.map(theme => 
              `<option value="${theme.value}">${theme.label}</option>`
            ).join('\n            ')}
          </select>

          <div class="cv-filters-spacer"></div>
          <div id="map-print-download-icons"></div>
        </div>

        <iframe id="cvThemePreview" class="cv-iframe-preview"></iframe>
        <pre id="cvDataPreview" class="cv-data-preview">Loading JSON…</pre>
        <div id="cvDataStatus" class="cv-data-status"></div>
      </div>

      <div class="cv-filters-section" id="cvReadmeSection">
        <h3>Notes (from README.md)</h3>
        <div id="cvReadmeContent" class="cv-readme-content">
          <em>Loading README.md...</em>
        </div>
      </div>
    `;
  }

  // Load JSON data
  async function loadJson(file) {
    const dataPreview = select('#cvDataPreview');
    
    try {
      const res = await fetch(file, { cache: 'no-store' });
      const json = await res.json();
      dataPreview.textContent = JSON.stringify(json, null, 2);
      currentResumeData = json;
      return json;
    } catch (err) {
      console.error('Failed to load JSON:', err);
      dataPreview.textContent = `⚠️ Failed to load ${file}`;
      currentResumeData = null;
      return null;
    }
  }

  // Load theme in iframe
  function loadTheme(jsonFile, theme) {
    const previewFrame = select('#cvThemePreview');
    const statusBox = select('#cvDataStatus');
    
    // Convert local path to path relative to common folder for iframe
    const iframeJsonPath = jsonFile.startsWith('../') 
      ? jsonFile 
      : `../${config.personFolder}/${jsonFile}`;
    
    const url = `../common/theme.html?resume=${encodeURIComponent(iframeJsonPath)}&theme=${encodeURIComponent(theme)}`;
    const start = performance.now();

    previewFrame.onload = () => {
      const ms = (performance.now() - start).toFixed(1);
      statusBox.textContent = `Theme "${theme}" loaded in ${ms} ms`;
    };

    previewFrame.src = url;
  }

  // Load both JSON and theme
  async function loadAll(jsonFile, theme) {
    currentJsonFile = jsonFile;
    currentTheme = theme;
    await loadJson(jsonFile);
    loadTheme(jsonFile, theme);
  }

  function sanitizeFilename(text) {
    return (text || 'resume')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'resume';
  }

  function makeBaseFilename() {
    const person = sanitizeFilename(config.personFolder || 'resume');
    const resume = sanitizeFilename(currentJsonFile.replace(/^.*\//, '').replace(/\.json$/i, ''));
    const theme = sanitizeFilename(currentTheme || config.defaultTheme);
    return `${person}-${resume}-${theme}`;
  }

  function closeIconPopups() {
    selectAll('.cv-icon-popup').forEach((popup) => popup.classList.remove('open'));
  }

  function toggleIconPopup(popupId) {
    const popup = select(`#${popupId}`);
    if (!popup) return;
    const willOpen = !popup.classList.contains('open');
    closeIconPopups();
    if (willOpen) popup.classList.add('open');
  }

  function downloadBlob(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printThemePreview() {
    const previewFrame = select('#cvThemePreview');
    const doc = previewFrame?.contentDocument || previewFrame?.contentWindow?.document;
    if (!doc) {
      alert('Preview is not ready for printing yet.');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Unable to open print window. Please allow pop-ups for this site.');
      return;
    }

    const styleTags = Array.from(doc.querySelectorAll('style'))
      .map((el) => el.outerHTML)
      .join('\n');
    const stylesheetLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    const resumeRoot = doc.querySelector('#resumeContainer') || doc.querySelector('.resume-container') || doc.body;
    const resumeMarkup = resumeRoot ? resumeRoot.innerHTML : '';

    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Resume Print</title>
        ${stylesheetLinks}
        ${styleTags}
        <style>
          @page { margin: 8mm; }
          html, body { margin: 0; padding: 0; background: #fff !important; }
          #resumePrintRoot,
          #resumePrintRoot #resumeContainer,
          #resumePrintRoot .resume-container,
          #resumePrintRoot [id*="resumeContainer"] {
            border: 0 !important;
            box-shadow: none !important;
            outline: 0 !important;
            background: #fff !important;
          }
          #resumePrintRoot * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        <div id="resumePrintRoot">${resumeMarkup}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function printJsonData() {
    if (!currentResumeData) {
      alert('No resume JSON is available to print.');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Unable to open print window. Please allow pop-ups for this site.');
      return;
    }
    const escaped = JSON.stringify(currentResumeData, null, 2)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Resume JSON</title>
        <style>
          body { margin: 20px; font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
          pre { white-space: pre-wrap; word-break: break-word; }
        </style>
      </head>
      <body><pre>${escaped}</pre></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function downloadThemeHtml() {
    const previewFrame = select('#cvThemePreview');
    const doc = previewFrame?.contentDocument || previewFrame?.contentWindow?.document;
    if (!doc) {
      alert('Preview HTML is not available yet.');
      return;
    }
    const html = '<!doctype html>\n' + doc.documentElement.outerHTML;
    downloadBlob(html, `${makeBaseFilename()}.html`, 'text/html;charset=utf-8');
  }

  function downloadJsonData() {
    if (!currentResumeData) {
      alert('No resume JSON is available to download.');
      return;
    }
    const json = JSON.stringify(currentResumeData, null, 2);
    downloadBlob(json, `${makeBaseFilename()}.json`, 'application/json;charset=utf-8');
  }

  function setupPrintDownloadIcons() {
    const target = select('#map-print-download-icons');
    if (!target || target.dataset.ready === 'true') return;

    target.innerHTML = `
      <div class="cv-icon-menu">
        <button id="cvPrintMenuBtn" class="cv-icon-btn" type="button" title="Print">
          <span class="material-icons">print</span>
        </button>
        <div id="cvPrintMenuPopup" class="cv-icon-popup">
          <button type="button" id="cvPrintResumeBtn">Print Resume</button>
          <button type="button" id="cvPrintJsonBtn">Print JSON Data</button>
        </div>
      </div>
      <div class="cv-icon-menu">
        <button id="cvDownloadMenuBtn" class="cv-icon-btn" type="button" title="Download">
          <span class="material-icons">download</span>
        </button>
        <div id="cvDownloadMenuPopup" class="cv-icon-popup">
          <button type="button" id="cvDownloadResumeBtn">Download Resume HTML</button>
          <button type="button" id="cvDownloadJsonBtn">Download JSON Data</button>
        </div>
      </div>
    `;

    const printBtn = select('#cvPrintMenuBtn');
    const downloadBtn = select('#cvDownloadMenuBtn');
    const printResumeBtn = select('#cvPrintResumeBtn');
    const printJsonBtn = select('#cvPrintJsonBtn');
    const downloadResumeBtn = select('#cvDownloadResumeBtn');
    const downloadJsonBtn = select('#cvDownloadJsonBtn');

    if (printBtn) {
      printBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleIconPopup('cvPrintMenuPopup');
      });
    }
    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleIconPopup('cvDownloadMenuPopup');
      });
    }
    if (printResumeBtn) {
      printResumeBtn.addEventListener('click', () => {
        closeIconPopups();
        printThemePreview();
      });
    }
    if (printJsonBtn) {
      printJsonBtn.addEventListener('click', () => {
        closeIconPopups();
        printJsonData();
      });
    }
    if (downloadResumeBtn) {
      downloadResumeBtn.addEventListener('click', () => {
        closeIconPopups();
        downloadThemeHtml();
      });
    }
    if (downloadJsonBtn) {
      downloadJsonBtn.addEventListener('click', () => {
        closeIconPopups();
        downloadJsonData();
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#map-print-download-icons')) {
        closeIconPopups();
      }
    });

    target.dataset.ready = 'true';
  }

  // Load README.md
  async function loadReadme() {
    const readmeContent = select('#cvReadmeContent');
    
    try {
      const res = await fetch('./README.md', { cache: 'no-store' });
      if (!res.ok) throw new Error('README not found');
      
      const text = await res.text();
      readmeContent.innerHTML = text.replace(/\n/g, '<br>');
    } catch {
      readmeContent.innerHTML = "<p style='color:red;'>Failed to load README.md.</p>";
    }
  }

  // Setup event listeners
  function setupEventListeners() {
    const jsonSelect = select('#cvJsonSelect');
    const themeSelect = select('#cvThemeSelect');

    if (jsonSelect) {
      jsonSelect.addEventListener('change', () => {
        const jsonFile = jsonSelect.value;
        const theme = themeSelect.value;
        setParam({ resume: jsonFile, theme });
        loadAll(jsonFile, theme);
      });
    }

    if (themeSelect) {
      themeSelect.addEventListener('change', () => {
        const jsonFile = jsonSelect.value;
        const theme = themeSelect.value;
        setParam({ resume: jsonFile, theme });
        loadAll(jsonFile, theme);
      });
    }
  }

  // Initialize filters
  function init(options) {
    // Merge config
    config = Object.assign({}, config, options);

    // Find or create container
    let container = select('#cvFiltersContainer');
    if (!container) {
      // If no container specified, insert at start of body
      container = document.createElement('div');
      container.id = 'cvFiltersContainer';
      document.body.insertBefore(container, document.body.firstChild);
    }

    // Generate and insert HTML
    container.innerHTML = generateFilterHTML();

    // Hide optional sections if configured
    if (!config.showReadme) {
      const readmeSection = select('#cvReadmeSection');
      if (readmeSection) readmeSection.style.display = 'none';
    }

    if (!config.showDataPreview) {
      const dataPreview = select('#cvDataPreview');
      const dataStatus = select('#cvDataStatus');
      if (dataPreview) dataPreview.style.display = 'none';
      if (dataStatus) dataStatus.style.display = 'none';
    }

    // Get initial values from URL or use defaults
    const jsonFile = getParam('resume', config.defaultJson);
    const theme = getParam('theme', config.defaultTheme);

    // Set dropdown values
    const jsonSelect = select('#cvJsonSelect');
    const themeSelect = select('#cvThemeSelect');
    
    if (jsonSelect) jsonSelect.value = jsonFile;
    if (themeSelect) themeSelect.value = theme;

    // Update URL with current params
    setParam({ resume: jsonFile, theme });

    // Setup event listeners
    setupEventListeners();
    setupPrintDownloadIcons();

    // Load initial content
    loadAll(jsonFile, theme);
    
    if (config.showReadme) {
      loadReadme();
    }
  }

  // Export public API
  window.CVFilters = {
    init: init,
    select: select,
    selectAll: selectAll,
    getParam: getParam,
    setParam: setParam,
    loadJson: loadJson,
    loadTheme: loadTheme,
    loadReadme: loadReadme
  };

})(window);
