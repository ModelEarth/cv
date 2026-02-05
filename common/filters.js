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
        .cv-filters-row {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 15px;
        }
        .cv-filters-row label {
          margin-right: 8px;
          font-weight: 500;
        }
        .cv-filters-row select {
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
          background: #fff;
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
      return json;
    } catch (err) {
      console.error('Failed to load JSON:', err);
      dataPreview.textContent = `⚠️ Failed to load ${file}`;
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
    await loadJson(jsonFile);
    loadTheme(jsonFile, theme);
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

