/**
 * CV Filters Module - Common filter/dropdown functionality for CV pages
 * jQuery-compatible selector and filter management
 *
 * Loads /cv/common/cv.css via localsite.js includeCSS3
 *
 * Usage:
 *   CVFilters.init({
 *     defaultJson: 'detailed.json',
 *     defaultTheme: 'elegant',
 *     defaultPDF: 'https://example.com/resume.pdf',
 *     educationColumn: 'main',
 *     syncResumeParam: false
 *   });
 */

(function (window) {
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

  function getCurrentFolderSegments() {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (!segments.length) return [];

    const lastSegment = segments[segments.length - 1];
    return lastSegment.includes('.') ? segments.slice(0, -1) : segments;
  }

  function getCvRootIndex(segments) {
    return segments.lastIndexOf('cv');
  }

  function getCvRootRelativePrefix() {
    const segments = getCurrentFolderSegments();
    const cvIndex = getCvRootIndex(segments);
    if (cvIndex < 0) return '';
    const depthBelowCv = Math.max(0, segments.length - (cvIndex + 1));
    return '../'.repeat(depthBelowCv);
  }

  function getCvRootPathname() {
    const segments = getCurrentFolderSegments();
    const cvIndex = getCvRootIndex(segments);
    if (cvIndex < 0) return '/cv/';
    return `/${segments.slice(0, cvIndex + 1).join('/')}/`;
  }

  function getDepthBelowCv() {
    const segments = getCurrentFolderSegments();
    const cvIndex = getCvRootIndex(segments);
    if (cvIndex < 0) return -1;
    return Math.max(0, segments.length - (cvIndex + 1));
  }

  function isCvRootPage() {
    return getDepthBelowCv() === 0;
  }

  function resolveCvRootAssetPath(file) {
    if (!file) return '';
    const normalizedFile = String(file).replace(/^\/+/, '');
    const prefix = getCvRootRelativePrefix();
    return `${prefix}${normalizedFile}`;
  }

  function resolveBiosAssetPath(file) {
    if (!file) return '';
    return resolveCvRootAssetPath(`bios/${String(file).replace(/^\/+/, '')}`);
  }

  function detectPersonFolder() {
    const segments = getCurrentFolderSegments();
    if (!segments.length) return '';

    const cvIndex = getCvRootIndex(segments);
    let folderSegment = cvIndex >= 0 ? segments[cvIndex + 1] : segments[segments.length - 1];
    if (folderSegment === 'bios') {
      folderSegment = segments[cvIndex + 2] || '';
    }

    if (!folderSegment) return '';

    try {
      return decodeURIComponent(folderSegment);
    } catch {
      return folderSegment;
    }
  }

  // Configuration
  let config = {
    personFolder: '',
    defaultJson: '',
    defaultTheme: '',
    defaultPDF: '',
    educationColumn: 'side',
    syncResumeParam: false,
    autoDetectJsonFiles: false,
    showReadme: true,
    showDataPreview: true
  };
  let currentResumeData = null;
  let currentJsonFile = '';
  let currentTheme = '';
  let currentPdfData = null;
  let currentPdfBlobUrl = '';
  let activePersonFolder = '';
  let rootHashTargetsPerson = false;
  let filtersInitialized = false;
  let standaloneBioModeBound = false;
  let baseConfig = null;
  const personFolderExistsCache = new Map();
  const personProfileConfigCache = new Map();

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

  // Hash-based state utilities (uses localsite.js getHash / goHash / updateHash)
  function getHashParam(key, fallback) {
    if (typeof getHash === 'function') {
      const h = getHash();
      if (key === 'who' && h[key] === undefined && h[''] !== undefined && h[''] !== '') {
        return h[''];
      }
      return (h[key] !== undefined && h[key] !== '') ? h[key] : fallback;
    }
    return fallback;
  }

  function hasExplicitWhoHash() {
    if (typeof getHash !== 'function') return false;
    const h = getHash();
    return h.who !== undefined && h.who !== '';
  }

  function hasBareWhoHash() {
    if (typeof getHash !== 'function') return false;
    const h = getHash();
    return h.who === undefined && h[''] !== undefined && h[''] !== '';
  }

  function getWhoTokens() {
    return String(getHashParam('who', '') || '')
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);
  }

  function hasTeamToken(tokens) {
    return tokens.some((token) => token.toLowerCase() === 'team');
  }

  function buildTeamWhoValue() {
    return 'team';
  }

  function buildWhoValueWithoutTeam() {
    return getWhoTokens()
      .filter((token) => token.toLowerCase() !== 'team')
      .join(',');
  }

  function getRestoreWhoValue(personFolder) {
    const explicitWho = buildWhoValueWithoutTeam();
    if (explicitWho) return explicitWho.split(',')[0];
    return personFolder || config.personFolder || '';
  }

  function parseQuotedConfigValue(sourceText, key) {
    if (!sourceText || !key) return '';
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = sourceText.match(new RegExp(`${escapedKey}\\s*:\\s*(['"])(.*?)\\1`));
    return match ? match[2].trim() : '';
  }

  function resolvePersonPageConfigUrl(personFolder, value) {
    if (!value) return '';
    if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
      return value;
    }
    const personBaseUrl = new URL(getPersonPageHref(personFolder), window.location.href);
    return new URL(value, personBaseUrl).href;
  }

  async function getPersonProfileConfig(personFolder) {
    const candidate = (personFolder || '').trim();
    if (!candidate) return null;
    if (personProfileConfigCache.has(candidate)) {
      return personProfileConfigCache.get(candidate);
    }

    const indexUrl = resolvePersonPageConfigUrl(candidate, 'index.html');

    try {
      const response = await fetch(indexUrl, { cache: 'no-store' });
      if (!response.ok) {
        personProfileConfigCache.set(candidate, null);
        return null;
      }

      const html = await response.text();
      const profileConfig = {
        defaultJson: resolvePersonPageConfigUrl(candidate, parseQuotedConfigValue(html, 'defaultJson')),
        defaultPDF: resolvePersonPageConfigUrl(candidate, parseQuotedConfigValue(html, 'defaultPDF')),
        defaultTheme: parseQuotedConfigValue(html, 'defaultTheme'),
        educationColumn: parseQuotedConfigValue(html, 'educationColumn')
      };

      personProfileConfigCache.set(candidate, profileConfig);
      return profileConfig;
    } catch {
      personProfileConfigCache.set(candidate, null);
      return null;
    }
  }

  function syncSourceSelectOptions(preferredValue) {
    const jsonSelect = select('#sourceSelect');
    if (!jsonSelect || !isCvRootPage()) return;

    const preferredSource = getSourceSelectValue(preferredValue);
    const options = [];
    if (config.defaultJson) {
      options.push({ value: 'json', label: 'From JSON' });
    }
    if (config.defaultPDF) {
      options.push({ value: 'pdf', label: 'PDF' });
    }

    if (!options.length && preferredSource) {
      options.push({
        value: preferredSource,
        label: preferredSource === 'pdf' ? 'PDF' : 'From JSON'
      });
    }

    jsonSelect.innerHTML = options
      .map((option) => `<option value="${option.value}">${option.label}</option>`)
      .join('\n');

    if (options.length) {
      const nextValue = options.some((option) => option.value === preferredSource)
        ? preferredSource
        : (config.defaultPDF && !config.defaultJson ? 'pdf' : options[0].value);
      jsonSelect.value = nextValue;
    }

    updateSourceSelectVisibility();
  }

  async function applyActivePersonProfileConfig(personFolder) {
    if (!baseConfig) return;

    config.defaultJson = baseConfig.defaultJson;
    config.defaultPDF = baseConfig.defaultPDF;
    config.defaultTheme = baseConfig.defaultTheme;
    config.educationColumn = baseConfig.educationColumn;

    if (!isCvRootPage() || !personFolder) return;

    const profileConfig = await getPersonProfileConfig(personFolder);
    if (!profileConfig) return;

    if (profileConfig.defaultJson || profileConfig.defaultPDF) {
      config.defaultJson = profileConfig.defaultJson || '';
      config.defaultPDF = profileConfig.defaultPDF || '';
    }
    if (profileConfig.defaultTheme) {
      config.defaultTheme = profileConfig.defaultTheme;
    }
    if (profileConfig.educationColumn) {
      config.educationColumn = profileConfig.educationColumn;
    }
  }

  function getTeamLinkHref(personFolder) {
    if (!isCvRootPage()) {
      return getCvRootRelativePrefix() || getCvRootPathname();
    }
    const whoValue = buildTeamWhoValue(personFolder);
    return getCvPageHref(whoValue);
  }

  function getCvPageHref(whoValue) {
    const rootHref = getCvRootPathname();
    return whoValue ? `${rootHref}#who=${encodeURIComponent(whoValue)}` : rootHref;
  }

  function getCvRootHashHref(hashFragment) {
    const rootHref = getCvRootPathname();
    return `${rootHref}${String(hashFragment || '').replace(/^\.?\//, '')}`;
  }

  function resolvePersonAssetPath(personFolder, file) {
    if (!file) return '';
    if (/^(?:[a-z]+:)?\/\//i.test(file) || file.startsWith('data:') || file.startsWith('blob:')) {
      return file;
    }
    if (file.startsWith('../') || file.startsWith('./') || file.startsWith('/')) {
      return file;
    }
    if (!personFolder) return resolveCvRootAssetPath(file);
    return resolveBiosAssetPath(`${personFolder}/${file}`);
  }

  async function personFolderExists(personFolder) {
    const candidate = (personFolder || '').trim();
    if (!candidate || candidate.toLowerCase() === 'team') return false;
    if (candidate === config.personFolder) return true;
    if (personFolderExistsCache.has(candidate)) {
      return personFolderExistsCache.get(candidate);
    }

    const probePaths = Array.from(new Set([
      currentJsonFile,
      config.defaultJson,
      'index.html'
    ].filter(Boolean).map((file) => resolvePersonAssetPath(candidate, file))));

    let exists = false;
    for (const path of probePaths) {
      try {
        const res = await fetch(path, { method: 'HEAD', cache: 'no-store' });
        if (res.ok) {
          exists = true;
          break;
        }
      } catch {
        // Ignore probe failures and continue to the next candidate path.
      }
    }

    personFolderExistsCache.set(candidate, exists);
    return exists;
  }

  async function resolveActivePersonFolder() {
    const whoTokens = getWhoTokens();
    for (const token of whoTokens) {
      if (token.toLowerCase() === 'team') continue;
      if (await personFolderExists(token)) {
        return token;
      }
    }
    return config.personFolder;
  }

  async function refreshRootHashTargetState() {
    if (!isCvRootPage()) {
      rootHashTargetsPerson = false;
      return false;
    }
    const firstUser = getFirstWhoUser();
    if (!firstUser) {
      rootHashTargetsPerson = false;
      return false;
    }
    rootHashTargetsPerson = await personFolderExists(firstUser);
    return rootHashTargetsPerson;
  }

  const THEME_CACHE_KEY = 'cv_theme';

  function getCachedTheme() {
    try { return localStorage.getItem(THEME_CACHE_KEY) || ''; } catch { return ''; }
  }

  function setCachedTheme(theme) {
    try { localStorage.setItem(THEME_CACHE_KEY, theme); } catch {} // eslint-disable-line no-empty
  }

  function getThemeForHashChange() {
    const hash = typeof getHash === 'function' ? getHash() : {};
    if (hash.theme !== undefined) {
      return hash.theme || '';
    }
    if (window.priorHash && window.priorHash.theme !== undefined) {
      return '';
    }
    return currentTheme || '';
  }

  function setFilterParams(jsonFile, theme, silent) {
    const params = { theme: theme || '' };
    if (config.syncResumeParam) {
      params.resume = jsonFile || '';
    }
    if (silent) {
      if (typeof updateHash === 'function') updateHash(params);
    } else {
      if (typeof goHash === 'function') goHash(params);
    }
  }

  function isPdfOnlyMode() {
    return !!(config.defaultPDF && !config.defaultJson);
  }

  function getRequestedSource() {
    const source = getHashParam('source', null);
    if (source) return source;
    return isPdfOnlyMode() ? 'pdf' : '';
  }

  function getSourceSelectValue(requestedSource) {
    const source = requestedSource === undefined ? getRequestedSource() : requestedSource;
    if (source === 'pdf') return 'pdf';
    if (source === 'json') return 'json';
    if (source) return 'json';
    if (config.defaultJson) return 'json';
    return isPdfOnlyMode() ? 'pdf' : '';
  }

  function getRequestedJsonFile() {
    const source = getRequestedSource();
    if (source === 'pdf' || source === 'json') return config.defaultJson;
    if (source) return source;
    return getHashParam('resume', config.defaultJson);
  }

  function revokePdfBlobUrl() {
    if (currentPdfBlobUrl) {
      URL.revokeObjectURL(currentPdfBlobUrl);
      currentPdfBlobUrl = '';
    }
  }

  function getPdfBlobUrl() {
    if (!currentPdfData) return '';
    if (currentPdfBlobUrl) return currentPdfBlobUrl;
    const blob = new Blob([JSON.stringify(currentPdfData)], {
      type: 'application/json;charset=utf-8'
    });
    currentPdfBlobUrl = URL.createObjectURL(blob);
    return currentPdfBlobUrl;
  }

  function getResumePdfConverter() {
    if (window.ResumePDFConverter && typeof window.ResumePDFConverter.init === 'function') {
      return window.ResumePDFConverter;
    }
    if (typeof ResumePDFConverter !== 'undefined' && typeof ResumePDFConverter.init === 'function') {
      return ResumePDFConverter;
    }
    return null;
  }

  function ensureResumePdfConverterLoaded() {
    if (getResumePdfConverter()) {
      return Promise.resolve(true);
    }

    const scriptPath = resolveCvRootAssetPath('common/ResumePDFConverter.js');

    if (typeof loadScript === 'function') {
      return new Promise((resolve) => {
        loadScript(scriptPath, () => resolve(!!getResumePdfConverter()));
      });
    }

    return new Promise((resolve) => {
      const existing = document.querySelector(`script[src="${scriptPath}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve(!!getResumePdfConverter()), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = scriptPath;
      script.onload = () => resolve(!!getResumePdfConverter());
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  function getJsonCandidates() {
    return Array.from(new Set([
      config.defaultJson,
      'summary.json',
      'resume.json',
      'brief.json'
    ].filter(Boolean)));
  }

  function renderJsonOptions(selectedValue) {
    if (!config.defaultJson) return '';
    return `<option value="json"${(selectedValue || getSourceSelectValue()) === 'json' ? ' selected' : ''}>From JSON</option>`;
  }

  function ensureJsonSelectOption() {
    const jsonSelect = select('#sourceSelect');
    if (!jsonSelect || !config.defaultJson) return;
    if (Array.from(jsonSelect.options).some((option) => option.value === 'json')) return;

    const option = document.createElement('option');
    option.value = 'json';
    option.textContent = 'From JSON';

    const pdfOption = Array.from(jsonSelect.options).find((existingOption) => existingOption.value === 'pdf');
    if (pdfOption) {
      jsonSelect.insertBefore(option, pdfOption);
    } else {
      jsonSelect.appendChild(option);
    }
  }

  function updateTeamLink() {
    const teamLink = select('#cvOurTeamLink');
    if (!teamLink) return;
    const personFolder = activePersonFolder || config.personFolder;
    const showingTeam = hasTeamToken(getWhoTokens());
    const restoreWho = getRestoreWhoValue(personFolder);
    teamLink.textContent = showingTeam ? 'Hide Team' : 'Our Team';
    teamLink.href = showingTeam
      ? getCvPageHref(restoreWho)
      : (isCvRootPage() && hasBareWhoHash() ? getCvPageHref('') : getTeamLinkHref(personFolder));
  }

  function getBioTarget() {
    return select('#bioList');
  }

  function getExternalBioTarget() {
    const bioList = getBioTarget();
    return bioList && !bioList.closest('#cvFiltersContainer') ? bioList : null;
  }

  function getBioMarkdownPath() {
    return resolveBiosAssetPath('bios.md');
  }

  function ensureBioListElement() {
    const container = select('#cvFiltersContainer');
    let bioList = getBioTarget();

    if (!bioList) {
      bioList = document.createElement('div');
      bioList.id = 'bioList';
      bioList.className = 'content bioList';
    }

    bioList.classList.add('content', 'bioList');
    bioList.classList.toggle('bioListSm', isCvRootPage());

    if (container && container.parentNode) {
      if (bioList.parentNode !== container.parentNode || bioList.previousElementSibling !== container) {
        container.parentNode.insertBefore(bioList, container.nextSibling);
      }
      return bioList;
    }

    const contentShell = document.querySelector('.content.contentpadding');
    if (contentShell && bioList.parentNode !== contentShell) {
      contentShell.appendChild(bioList);
      return bioList;
    }

    if (!bioList.parentNode) {
      document.body.appendChild(bioList);
    }

    return bioList;
  }

  function getUserBioTarget() {
    return select('#userBioDiv');
  }

  function getNoBioClassTarget() {
    return document.querySelector('.content.contentpadding') || document.body;
  }

  function isNoBioState() {
    if (isCvRootPage()) {
      return !window.location.hash || !rootHashTargetsPerson;
    }
    return !(activePersonFolder || config.personFolder);
  }

  function setNoBioElementDisplay(element, shouldShow, defaultDisplay) {
    if (!element.dataset.noBioVisibleDisplay) {
      element.dataset.noBioVisibleDisplay = defaultDisplay !== undefined
        ? defaultDisplay
        : (element.id === 'cvFooter' ? 'flex' : '');
    }
    element.style.display = shouldShow ? element.dataset.noBioVisibleDisplay : 'none';
  }

  function syncNoBioElements(noBioState) {
    selectAll('#cvFiltersContainer .hide-when-bio').forEach((element) => {
      setNoBioElementDisplay(element, !noBioState);
    });

    selectAll('#cvFiltersContainer .hide-when-no-bio').forEach((element) => {
      setNoBioElementDisplay(element, !noBioState);
    });

    selectAll('.content.contentpadding > .hide-when-bio').forEach((element) => {
      if (element.closest('#cvFiltersContainer')) return;
      setNoBioElementDisplay(element, noBioState, 'block');
    });

    selectAll('.content.contentpadding > .hide-when-no-bio').forEach((element) => {
      if (element.closest('#cvFiltersContainer')) return;
      setNoBioElementDisplay(element, !noBioState, 'block');
    });
  }

  function syncNoBioClass() {
    const noBioTarget = getNoBioClassTarget();
    if (!noBioTarget) return;
    const noBioState = isNoBioState();
    noBioTarget.classList.toggle('hide-when-bio', noBioState);
    noBioTarget.classList.toggle('hide-when-no-bio', !noBioState);
    syncNoBioElements(noBioState);
  }

  function normalizeBioLinkHref(href) {
    return String(href || '')
      .replace(/^(\.\.\/)+/, '')
      .replace(/^\.\//, '')
      .replace(/^bios\//, '');
  }

  function shouldRenderGeneratedBioList() {
    return !getExternalBioTarget();
  }

  function getFirstWhoUser() {
    return getWhoTokens().find((token) => token.toLowerCase() !== 'team') || '';
  }

  function getPersonPageHref(personFolder) {
    if (!personFolder) return getCvPageHref('');
    return `${getCvRootPathname()}bios/${encodeURIComponent(personFolder)}/`;
  }

  function resolveBioLinkUrl(href) {
    const normalizedHref = normalizeBioLinkHref(href);
    if (normalizedHref.startsWith('#')) {
      return getCvRootHashHref(normalizedHref);
    }
    return resolveBiosAssetPath(normalizedHref);
  }

  async function maybeInitRootCvFromHash() {
    if (!isCvRootPage() || filtersInitialized) return false;

    if (!(await refreshRootHashTargetState())) {
      syncNoBioClass();
      syncBioSection(true);
      return false;
    }

    syncNoBioClass();
    syncBioSection(true);

    init({
      defaultJson: 'detailed.json',
      syncResumeParam: false,
      autoDetectJsonFiles: false
    });
    return true;
  }

  function shouldShowBioList() {
    return hasTeamToken(getWhoTokens()) || (isCvRootPage() && !rootHashTargetsPerson);
  }

  function shouldKeepBioListVisible() {
    return isCvRootPage() && !rootHashTargetsPerson;
  }

  function cleanupBioSummary(target) {
    target.querySelectorAll('.bioText, .bioMedia').forEach((element) => {
      element.classList.remove('bioTextHasToggle', 'bioRowExpandable');
      element.onclick = null;
      element.title = '';
    });
    target.querySelectorAll('.bioText p').forEach((paragraph) => {
      paragraph.classList.remove('bio-collapsed');
      paragraph.dataset.bioExpandable = '';
    });
  }

  function getPrimaryBioParagraph(bioText) {
    const paragraphs = Array.from(bioText.querySelectorAll('p'));
    return paragraphs.find((paragraph) => paragraph.textContent.trim().length > 40) || null;
  }

  function getBioHashValue(bioText) {
    if (!bioText || typeof bioText.getAttribute !== 'function') return '';
    return String(bioText.getAttribute('bio') || '').trim();
  }

  function getBioWebsiteValue(bioText) {
    if (!bioText || typeof bioText.getAttribute !== 'function') return '';
    return String(bioText.getAttribute('website') || '').trim();
  }

  function navigateToBioTarget(target) {
    if (!target) return;
    window.location.href = target;
  }

  function applyBioAction(bioText) {
    const bioValue = getBioHashValue(bioText);
    const websiteValue = getBioWebsiteValue(bioText);
    let actionTarget = '';
    let actionLabel = '';

    if (bioValue) {
      actionTarget = getCvRootHashHref(`#${encodeURIComponent(bioValue)}`);
      actionLabel = `#${bioValue}`;
    } else if (websiteValue) {
      actionTarget = websiteValue;
      actionLabel = websiteValue;
    } else {
      return false;
    }

    bioText.classList.add('bioTextHasToggle', 'bioRowExpandable');
    bioText.title = `Open ${actionLabel}`;
    bioText.onclick = function (event) {
      if (event.target.closest('a')) return;
      navigateToBioTarget(actionTarget);
    };

    const mediaBlock = bioText.previousElementSibling;
    if (mediaBlock && mediaBlock.querySelector('img')) {
      mediaBlock.classList.add('bioMedia', 'bioRowExpandable');
      mediaBlock.title = `Open ${actionLabel}`;
      mediaBlock.onclick = function (event) {
        if (event.target.closest('a')) return;
        navigateToBioTarget(actionTarget);
      };
    }

    return true;
  }

  function annotateBioMarkup(target) {
    if (!target) return;
    target.querySelectorAll('p').forEach((paragraph) => {
      if (paragraph.querySelector('img')) {
        paragraph.classList.add('bioMedia');
      } else {
        paragraph.classList.remove('bioMedia');
      }
    });

    target.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || /^(?:[a-z]+:|\/|#)/i.test(href)) return;
      link.setAttribute('href', resolveBioLinkUrl(href));
    });
  }

  function toggleBioParagraph(paragraph) {
    paragraph.classList.toggle('bio-collapsed');
  }

  function refreshBioSummary(target) {
    if (!target) return;
    cleanupBioSummary(target);
    annotateBioMarkup(target);
    if (!target.classList.contains('bioListSm')) return;

    target.querySelectorAll('.bioText').forEach((bioText) => {
      if (applyBioAction(bioText)) return;

      const paragraph = getPrimaryBioParagraph(bioText);
      if (!paragraph) return;

      const paragraphStyle = getComputedStyle(paragraph);
      const lineHeight = parseFloat(paragraphStyle.lineHeight)
        || (parseFloat(paragraphStyle.fontSize) * 1.4)
        || 22;
      const collapsedHeight = lineHeight * 2;
      if (!(paragraph.scrollHeight > collapsedHeight + 4)) return;

      bioText.classList.add('bioTextHasToggle');
      bioText.classList.add('bioRowExpandable');
      paragraph.dataset.bioExpandable = 'true';
      paragraph.classList.add('bio-collapsed');
      bioText.title = 'Click to expand';
      bioText.onclick = function (event) {
        if (event.target.closest('a')) return;
        toggleBioParagraph(paragraph);
      };

      const mediaBlock = bioText.previousElementSibling;
      if (mediaBlock && mediaBlock.querySelector('img')) {
        mediaBlock.classList.add('bioMedia', 'bioRowExpandable');
        mediaBlock.title = 'Click to expand';
        mediaBlock.onclick = function (event) {
          if (event.target.closest('a')) return;
          toggleBioParagraph(paragraph);
        };
      }
    });
  }

  function bindBioExpansion(target) {
    if (!target || target.dataset.bioExpandBound === 'true') return;

    let refreshQueued = false;
    const observer = new MutationObserver(() => {
      if (refreshQueued) return;
      refreshQueued = true;
      window.requestAnimationFrame(() => {
        refreshQueued = false;
        refreshBioSummary(target);
      });
    });
    observer.observe(target, { childList: true });
    target.dataset.bioExpandBound = 'true';
    target._bioExpandObserver = observer;

    target.addEventListener('click', function (event) {
      const link = event.target.closest('a[href]');
      if (!link) return;

      const rawHref = link.getAttribute('href');
      if (!rawHref || /^(?:[a-z]+:|\/|#)/i.test(rawHref)) return;

      event.preventDefault();
      window.location.href = resolveBioLinkUrl(rawHref);
    });
  }

  function syncBioSection(forceReload) {
    const bioList = getBioTarget();
    if (!bioList) return;
    bindBioExpansion(bioList);

    const keepVisible = shouldKeepBioListVisible();

    if (!shouldShowBioList() && !keepVisible) {
      bioList.classList.add('bioListForceHidden');
      bioList.style.display = 'none';
      bioList.innerHTML = '';
      bioList.dataset.loadedMarkdown = '';
      bioList.dataset.bioLoading = '';
      cleanupBioSummary(bioList);
      return;
    }

    bioList.classList.remove('bioListForceHidden');
    bioList.style.display = 'block';
    if (bioList.dataset.bioLoading === 'team') return;
    if (!forceReload && bioList.dataset.loadedMarkdown === 'team' && bioList.innerHTML.trim()) return;

    bioList.dataset.bioLoading = 'team';
    bioList.dataset.loadedMarkdown = '';
    bioList.innerHTML = '';
    cleanupBioSummary(bioList);
    if (typeof loadMarkdown === 'function') {
      loadMarkdown(getBioMarkdownPath(), bioList.id, '_parent', undefined, function () {
        bioList.dataset.bioLoading = '';
        if (!shouldShowBioList() && !shouldKeepBioListVisible()) {
          bioList.classList.add('bioListForceHidden');
          bioList.style.display = 'none';
          bioList.innerHTML = '';
          bioList.dataset.loadedMarkdown = '';
          cleanupBioSummary(bioList);
          return;
        }
        bioList.dataset.loadedMarkdown = 'team';
        refreshBioSummary(bioList);
      });
    } else {
      bioList.dataset.bioLoading = '';
      bioList.innerHTML = `<p style='color:red;'>Failed to load ${getBioMarkdownPath()}.</p>`;
    }
  }

  function syncTeamUiFromHash(forceReload) {
    updateTeamLink();
    syncBioSection(forceReload);
  }

  function bindStandaloneBioMode() {
    if (standaloneBioModeBound || filtersInitialized) return;
    ensureBioListElement();
    if (!getBioTarget()) return;

    standaloneBioModeBound = true;
    ensureBioStyles();
    (async function () {
      const initialized = await maybeInitRootCvFromHash();
      if (!initialized) {
        syncNoBioClass();
        syncTeamUiFromHash(true);
      }
    })();

    document.addEventListener('hashChangeEvent', async function () {
      if (filtersInitialized) return;
      const priorWho = window.priorHash && window.priorHash.who ? window.priorHash.who : '';
      const initialized = await maybeInitRootCvFromHash();
      if (!initialized) {
        syncNoBioClass();
        syncTeamUiFromHash(getHashParam('who', '') !== priorWho);
      }
    });
  }

  // Generate filter HTML
  function ensureBioStyles() {
    let styleEl = document.getElementById('cvBioStyles');
    if (styleEl) return;

    styleEl = document.createElement('style');
    styleEl.id = 'cvBioStyles';
    styleEl.textContent = `
      #bioList {
        container-type: inline-size;
        display: none;
      }
      #bioList.bioListForceHidden {
        display: none !important;
      }
      .bioList {
        --bio-image-size: 180px;
      }
      #bioList hr {
        clear: both;
        opacity: 0;
      }
      .bioList .bioMedia {
        float: left;
        width: var(--bio-image-size);
        margin: 0 30px 28px 0;
      }
      .bioList img {
        padding: 0 !important;
        margin: 0 !important;
        display: block;
        width: var(--bio-image-size) !important;
        height: var(--bio-image-size) !important;
        min-width: var(--bio-image-size) !important;
        min-height: var(--bio-image-size) !important;
        border-radius: 50% !important;
        object-fit: cover !important;
        object-position: center top !important;
      }
      .bioList .bioText {
        overflow: auto;
        margin-bottom: 28px;
      }
      .bioList .bioText h2 {
        margin: 0 0 8px;
      }
      .bioList .bioText p {
        overflow: visible;
      }
      .bioList .bioText p.bio-collapsed {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
      .bioList.bioListSm {
        --bio-image-size: 64px;
      }
      .bioList.bioListSm .bioMedia {
        margin: 0 14px 12px 0;
      }
      .bioList.bioListSm .bioText {
        position: relative;
        margin-bottom: 14px;
        padding: 2px 8px 4px;
        border-radius: 10px;
      }
      .bioList.bioListSm .bioText h2 {
        font-size: 18px;
        margin: 0 0 4px;
      }
      .bioList.bioListSm .bioRowExpandable {
        cursor: pointer;
      }
      .bioList.bioListSm .bioText.bioRowExpandable:hover {
        background: rgba(11, 99, 201, 0.08);
      }
      .dark .bioList.bioListSm .bioText.bioRowExpandable:hover {
        background: rgba(127, 192, 255, 0.14);
      }
      @container (max-width: 760px) {
        .bioList .bioMedia {
          float: none;
          clear: both;
          width: auto;
          margin: 0 0 12px 0;
        }
        .bioList .bioText {
          overflow: visible;
          margin-bottom: 22px;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  function clearReadmeDisplay() {
    const userBioDiv = getUserBioTarget();
    const readmeContent = select('#cvReadmeContent');
    const readmeSection = select('#cvReadmeSection');
    if (userBioDiv) {
      userBioDiv.innerHTML = '';
      userBioDiv.dataset.loadedMarkdown = '';
      userBioDiv.dataset.readmeLoading = '';
      userBioDiv.style.display = 'none';
    }
    if (readmeContent) {
      readmeContent.innerHTML = '';
      readmeContent.dataset.loadedMarkdown = '';
      readmeContent.dataset.readmeLoading = '';
    }
    if (readmeSection && config.showReadme) {
      readmeSection.style.display = 'none';
    }
  }

  function clearResumeDisplay() {
    const resumeContainer = select('#resumeContainer');
    const dataPreview = select('#cvDataPreview');
    const dataStatus = select('#cvDataStatus');
    if (resumeContainer) resumeContainer.innerHTML = '';
    if (dataPreview) dataPreview.textContent = '';
    if (dataStatus) dataStatus.textContent = '';
    currentResumeData = null;
  }

  function insertFiltersContainer(container) {
    const externalBioList = getExternalBioTarget();
    if (externalBioList && externalBioList.parentNode) {
      externalBioList.parentNode.insertBefore(container, externalBioList.nextSibling);
      return;
    }

    const contentShell = document.querySelector('.content.contentpadding');
    if (contentShell) {
      contentShell.insertBefore(container, contentShell.firstChild);
      return;
    }

    document.body.insertBefore(container, document.body.firstChild);
  }

  function generateFilterHTML() {
    return `
      <style>
        .cv-filters-row {
          display: flex;
          align-items: center;
          margin-top: 8px;
          margin-bottom: 12px;
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
        .contentPanel {
          background: #f4f4f4;
          padding: 15px;
          border-radius: var(--cv-panel-radius);
          border: 1px solid #ddd;
          white-space: pre-wrap;
          overflow-x: auto;
          max-height: 320px;
          font-family: monospace;
          font-size: 13px;
        }
        .dark .contentPanel {
          background: #1f1f1f;
          border: 1px solid #3f3f3f;
          color: #e4e4e4;
        }
        .cv-data-status {
          margin-top: 8px;
          font: 13px/1.4 system-ui;
          color: #666;
        }
        .dark .cv-data-status {
          color: #b8b8b8;
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
        .btn-alert {
          background: #fff3cd;
          border-color: #ffc107 !important;
          color: #856404;
        }
        .btn-alert:hover {
          background: #ffecb3;
        }
        .dark .btn-alert {
          background: #3a2d00;
          border-color: #ffc107 !important;
          color: #ffd54f;
        }
        .cv-report-panel {
          background: #f4f4f4;
          padding: 15px;
          border-radius: var(--cv-panel-radius);
          border: 1px solid #ddd;
          overflow-y: auto;
          max-height: 360px;
          font-size: 13px;
          line-height: 1.5;
        }
        .dark .cv-report-panel {
          background: #1f1f1f;
          border-color: #3f3f3f;
          color: #e4e4e4;
        }
        .dark .cv-report-panel a { color: #7fc0ff; }
        .dark .cv-report-panel hr { border-color: #3f3f3f; }
      </style>
      
        <div class="cv-filters-row content">
          <div class="hide-when-bio">
            <label><a id="cvOurTeamLink" class="hide-when-bio" href="${getTeamLinkHref(config.personFolder)}">Our Team</a></label>

            <label style="margin-left:12px;">Theme:</label>
            <select id="themeSelect">
              <option value="">Base</option>
              ${THEMES.map(theme =>
        `<option value="${theme.value}">${theme.label}</option>`
      ).join('\n            ')}
            </select>
          </div>
        
          <div class="hide-when-no-bio">
          <div class="local" style="display:none">
          <select id="sourceSelect" style="margin-left:8px;display:none">
            ${renderJsonOptions()}
          </select>
          </div>
          </div>

          <div class="cv-filters-spacer"></div>
          <div id="map-print-download-icons"></div>
        </div>

        <div id="resumeContainer" class="content hide-when-bio">Loading...</div>
        <div id="userBioDiv" class="content" style="display:none"></div>

          <div id="cvReadmeSection">
            <div id="cvReadmeContent" class="content"></div>
          </div>
          <pre id="cvDataPreview" class="content contentPanel" style="display:none">Loading JSON\u2026</pre>
          <div id="cvParseReport" class="content cv-report-panel" style="display:none"></div>
          <div id="cvFooter" class="content hide-when-bio" style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <div id="cvDataStatus" class="cv-data-status"></div>
            <button type="button" id="cvToggleJsonBtn" class="btn-sm">View json</button>
            <button type="button" id="cvParseReportBtn" class="btn-sm" style="display:none">Parse Report</button>
          </div>

      
    `;
  }

  // Load JSON data
  async function loadJson(file) {
    const dataPreview = select('#cvDataPreview');
    const resolvedJsonPath = currentPdfData
      ? getPdfBlobUrl()
      : resolvePersonAssetPath(activePersonFolder || config.personFolder, file);

    if (currentPdfData) {
      if (dataPreview) {
        dataPreview.textContent = JSON.stringify(currentPdfData, null, 2);
      }
      currentResumeData = currentPdfData;
      return currentPdfData;
    }

    try {
      const res = await fetch(resolvedJsonPath, { cache: 'no-store' });
      const json = await res.json();
      if (dataPreview) {
        dataPreview.textContent = JSON.stringify(json, null, 2);
      }
      currentResumeData = json;
      return json;
    } catch (err) {
      console.error('Failed to load JSON:', err);
      if (dataPreview) {
        dataPreview.textContent = `\u26a0\ufe0f Failed to load ${resolvedJsonPath || file}`;
      }
      currentResumeData = null;
      return null;
    }
  }

  // Resume renderer moved from /cv/common/index.js.
  function initCvRenderer() {
    if (window.CVRenderer && typeof window.CVRenderer.render === 'function') return;

    function getRendererParam(name, fallback) {
      return new URLSearchParams(location.search).get(name) ?? fallback;
    }

    function stringifyValue(value) {
      return (value || '').toString();
    }

    function toHref(url) {
      if (!url) return url;
      const value = url.trim();
      if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(value)) return value;
      if (
        value.startsWith('/')
        || value.startsWith('.')
        || /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(value)
      ) {
        return value;
      }
      const slashIndex = value.indexOf('/');
      const dotIndex = value.indexOf('.');
      if (dotIndex !== -1 && (slashIndex === -1 || dotIndex < slashIndex)) {
        return `https://${value}`;
      }
      return value;
    }

    function renderSection(title, content, className) {
      if (!content || !content.trim()) return '';
      return `
      <div class="section${className ? ` ${className}` : ''}">
        <div class="section-title">${title}</div>
        ${content}
      </div>
    `;
    }

    function renderResume(data) {
      const basics = data.basics || {};
      const work = data.work || [];
      const education = data.education || [];
      const skills = data.skills || [];
      const projects = data.projects || [];
      const certifications = data.certifications || data.certificates || [];
      const languages = data.languages || [];
      const profiles = basics.profiles || data.profiles || [];
      const educationColumn = String(config.educationColumn || 'side').toLowerCase();
      const educationInSideColumn = ['side', 'left', 'right'].includes(educationColumn);

      const resumeContainer = document.getElementById('resumeContainer');
      if (!resumeContainer) return;

      const locationString = typeof basics.location === 'object' && basics.location
        ? [basics.location.city, basics.location.region, basics.location.countryCode || basics.location.country].filter(Boolean).join(', ')
        : (basics.location || '');
      const locationShort = locationString && locationString.length < 50;

      const urlProfiles = profiles.filter((profile) => profile.url);
      const displayExtras = profiles
        .filter((profile) => profile.display && !profile.url)
        .map((profile) => (profile.display || '').trim())
        .filter(Boolean);
      const displayExtrasCharacters = displayExtras.reduce((sum, extra) => sum + extra.length, 0);
      const displayExtrasText = displayExtras.join(' · ');
      const extrasInTopMain = displayExtrasCharacters > 50;

      const phoneList = (basics.phones && basics.phones.length)
        ? basics.phones
        : (basics.phone ? [basics.phone] : []);

      const contactRows = [];
      if (basics.email) {
        contactRows.push({
          html: `<a href="mailto:${stringifyValue(basics.email)}">${stringifyValue(basics.email)}</a>`,
          cls: ''
        });
      }
      if (basics.url) {
        contactRows.push({
          html: `<a href="${stringifyValue(toHref(basics.url))}" target="_blank" rel="noopener">${stringifyValue(basics.url)}</a>`,
          cls: ''
        });
      }
      urlProfiles.forEach((profile) => {
        contactRows.push({
          html: `<a href="${stringifyValue(toHref(profile.url))}" target="_blank" rel="noopener">${stringifyValue(profile.network || profile.url)}</a>`,
          cls: ''
        });
      });

      if (phoneList.length > 0 || (!extrasInTopMain && displayExtrasText)) {
        const phonePart = phoneList.map((phone) => `<span class="contact-phone">${stringifyValue(phone)}</span>`).join(', ');
        const extraPart = (!extrasInTopMain && displayExtrasText)
          ? `<span class="contact-extra">${stringifyValue(displayExtrasText)}</span>`
          : '';
        let rowHtml;
        if (phoneList.length === 1 && extraPart) {
          rowHtml = `${phonePart} · ${extraPart}`;
        } else if (phoneList.length > 1 && extraPart) {
          rowHtml = `${phonePart}<br>${extraPart}`;
        } else {
          rowHtml = phonePart + extraPart;
        }
        contactRows.push({ html: rowHtml, cls: 'contact-item-phone' });
      }

      if (locationShort) {
        contactRows.push({
          html: `<span class="contact-location">${stringifyValue(locationString)}</span>`,
          cls: 'contact-item-meta'
        });
      }

      const educationSection = renderSection('Education', education.map((entry) => `
                <div class="item">
                  <div class="item-title">${stringifyValue(entry.studyType)} — ${stringifyValue(entry.area)}</div>
                  <div class="item-sub">${stringifyValue(entry.institution)}${entry.location ? ` · ${stringifyValue(entry.location)}` : ''}</div>
                </div>`).join(''));

      resumeContainer.innerHTML = `
      <div class="containingDiv">
        <div class="top-row">
          <div class="top-main">
            <h1 class="name">${stringifyValue(basics.name)}</h1>
            ${basics.label ? `<div class="label">${stringifyValue(basics.label)}</div>` : ''}
            ${extrasInTopMain && displayExtrasText ? `<div class="contact-extra contact-extra-main">${stringifyValue(displayExtrasText)}</div>` : ''}
            ${!locationShort && locationString ? `<div class="location-long">${stringifyValue(locationString)}</div>` : ''}
          </div>
          <div class="top-side">
            ${contactRows.map(({ html, cls }) => `<div class="contact-item${cls ? ` ${cls}` : ''}">${html}</div>`).join('')}
          </div>
        </div>

        <div class="layout">
          <div class="col-main">
            ${renderSection('Summary', basics.summary ? `<div class="summary-text">${stringifyValue(basics.summary)}</div>` : '')}

            ${renderSection('Experience', work.map((job) => {
      const organization = stringifyValue(job.organization || job.company);
      const dates = job.startDate ? ` · ${stringifyValue(job.startDate)} – ${stringifyValue(job.endDate || 'Present')}` : '';
      const highlights = (job.highlights || []).length
        ? `<ul style="margin:4px 0 0 16px;padding:0;font-size:13px;color:var(--text-main);">${job.highlights.map((highlight) => `<li>${stringifyValue(highlight)}</li>`).join('')}</ul>`
        : '';
      return `
                <div class="item">
                  <div class="item-title">${stringifyValue(job.position)}</div>
                  <div class="item-sub">${organization}${dates}</div>
                  <div class="item-summary">${stringifyValue(job.summary)}</div>
                  ${highlights}
                </div>`;
    }).join(''), 'section-experience')}

            ${!educationInSideColumn ? educationSection : ''}

            ${renderSection('Projects', projects.map((project) => `
                <div class="item pill-section">
                  <div class="item-title">${stringifyValue(project.name)}</div>
                  <div class="item-summary">${stringifyValue(project.summary)}</div>
                  ${project.keywords && project.keywords.length ? `
                    <div class="chips">
                      ${project.keywords.map((keyword) => `<span class="chip">${stringifyValue(keyword)}</span>`).join('')}
                    </div>` : ''}
                </div>`).join(''))}
          </div>

          <div class="col-side">
            ${renderSection('Skills', skills.map((skill) => `
                <div class="item">
                  ${skill.name ? `<div class="item-title">${stringifyValue(skill.name)}</div>` : ''}
                  ${skill.summary ? `<div class="item-summary">${stringifyValue(skill.summary)}</div>` : ''}
                  ${(skill.keywords || []).length ? `<div class="chips">${(skill.keywords || []).map((keyword) => `<span class="chip">${stringifyValue(keyword)}</span>`).join('')}</div>` : ''}
                </div>`).join(''))}

            ${educationInSideColumn ? educationSection : ''}

            ${renderSection('Certifications', certifications.map((certification) => `
                <div class="item-sub">• ${stringifyValue(certification.name)}</div>`).join(''))}

            ${renderSection('Languages', languages.map((language) => `
                <div class="item-sub">• ${stringifyValue(language.language)}${language.fluency ? ` — ${stringifyValue(language.fluency)}` : ''}</div>`).join(''))}
          </div>
        </div>
      </div>
    `;
    }

    async function loadAndRender(jsonFile, callback) {
      const resumeContainer = document.getElementById('resumeContainer');
      if (!jsonFile) {
        if (resumeContainer) resumeContainer.innerHTML = '';
        if (typeof callback === 'function') callback();
        return;
      }
      if (resumeContainer) resumeContainer.innerHTML = 'Loading theme…';
      try {
        let data;
        if (jsonFile.startsWith('data:')) {
          const base64Match = jsonFile.match(/data:application\/json[^,]*,(.+)/);
          if (base64Match) {
            data = JSON.parse(decodeURIComponent(base64Match[1]));
          }
        } else {
          const response = await fetch(jsonFile, { cache: 'no-store' });
          if (!response.ok) throw new Error('JSON not found');
          data = await response.json();
        }
        if (data) renderResume(data);
        if (typeof callback === 'function') callback();
      } catch (error) {
        console.error(error);
        if (resumeContainer) {
          resumeContainer.innerHTML = "<p style='color:red;'>Failed to load resume JSON.</p>";
        }
      }
    }

    window.CVRenderer = {
      render(jsonFile, callback) {
        const file = jsonFile || window.cvResumeFile || getRendererParam('resume', '');
        loadAndRender(file, callback);
      }
    };
  }

  // Update the theme-specific stylesheet and render resume via CVRenderer
  function loadTheme(jsonFile, theme) {
    if (typeof jsonFile === 'string') currentJsonFile = jsonFile;
    currentTheme = theme || '';

    // Update per-theme stylesheet using a managed <link> element
    const themeLink = document.getElementById('cvThemeStylesheet');
    if (theme) {
      let link = themeLink;
      if (!link) {
        link = document.createElement('link');
        link.id = 'cvThemeStylesheet';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        document.head.appendChild(link);
      }
      link.href = `/cv/common/themes/${encodeURIComponent(theme)}/style.css`;
    } else if (themeLink) {
      themeLink.remove();
    }

    const statusBox = select('#cvDataStatus');
    const resolvedJsonPath = currentPdfData
      ? getPdfBlobUrl()
      : resolvePersonAssetPath(activePersonFolder || config.personFolder, jsonFile);

    const start = performance.now();
    const done = function () {
      const ms = (performance.now() - start).toFixed(1);
      if (statusBox) statusBox.textContent = theme ? `Theme "${theme}" loaded in ${ms} ms` : `Loaded in ${ms} ms`;

      // Append "View PDF" link only for the page's native resume source.
      const topSide = document.querySelector('#resumeContainer .top-side');
      if (topSide) {
        const existing = topSide.querySelector('.cv-source-link');
        if (existing) existing.remove();
      }
      if (config.defaultPDF && (activePersonFolder || config.personFolder) === config.personFolder) {
        if (topSide) {
          const a = document.createElement('a');
          a.href = config.defaultPDF;
          a.textContent = 'View PDF';
          a.className = 'cv-source-link';
          a.target = '_blank';
          a.rel = 'noopener';
          // Place on the same line as the phone number if present, else append a new row
          const phoneRow = topSide.querySelector('.contact-item-phone');
          if (phoneRow) {
            phoneRow.appendChild(document.createTextNode('\u00a0\u00b7\u00a0'));
            phoneRow.appendChild(a);
          } else {
            const wrapper = document.createElement('div');
            wrapper.className = 'contact-item';
            wrapper.appendChild(a);
            topSide.appendChild(wrapper);
          }
          fetch(config.defaultPDF, { method: 'HEAD' })
            .then(res => { if (res.status === 404) a.remove(); })
            .catch(() => {});
        }
      }
    };

    if (window.CVRenderer && typeof window.CVRenderer.render === 'function') {
      window.CVRenderer.render(resolvedJsonPath, done);
    }
  }

  // Load both JSON (data preview) and render the theme
  async function loadAll(jsonFile, theme) {
    currentJsonFile = jsonFile;
    currentTheme = theme;
    await refreshRootHashTargetState();
    activePersonFolder = await resolveActivePersonFolder();
    await applyActivePersonProfileConfig(activePersonFolder);
    syncNoBioClass();
    updateTeamLink();
    syncBioSection(false);
    if (!activePersonFolder) {
      clearResumeDisplay();
      clearReadmeDisplay();
      return;
    }

    const source = getRequestedSource();
    const effectiveJsonFile = jsonFile || config.defaultJson;

    syncSourceSelectOptions(getSourceSelectValue(source));

    if (source === 'pdf' && config.defaultPDF) {
      const loaded = await loadDefaultPdfResume();
      if (loaded) {
        loadTheme(effectiveJsonFile, theme);
      }
      return;
    }

    currentPdfData = null;
    revokePdfBlobUrl();
    await loadJson(effectiveJsonFile);
    loadTheme(effectiveJsonFile, theme);
  }

  function buildParseReport(converter) {
    const issues = typeof converter.detectIssues === 'function' ? converter.detectIssues() : [];
    const info = converter.pdfMetadata || {};
    const headers = converter.lastResponseHeaders || {};
    const pdfUrl = config.defaultPDF;
    const absUrl = /^https?:\/\//.test(pdfUrl)
      ? pdfUrl
      : new URL(pdfUrl, window.location.href).href;

    // Identify source app and file type from PDF metadata
    const creator = (info.Creator || '').trim();
    const producer = (info.Producer || '').trim();
    const combined = (creator + ' ' + producer).toLowerCase();
    let appName = creator || producer || '';
    let fileTypeHint = '';
    if (combined.includes('microsoft word') || combined.includes('winword')) {
      appName = 'Microsoft Word';
      fileTypeHint = 'Word document (.docx)';
    } else if (combined.includes('libreoffice')) {
      appName = 'LibreOffice' + (combined.includes('writer') ? ' Writer' : '');
      fileTypeHint = 'Writer document (.odt or .docx)';
    } else if (combined.includes('google')) {
      appName = 'Google Docs';
      fileTypeHint = 'Google Doc';
    } else if (combined.includes('canva')) {
      appName = 'Canva';
      fileTypeHint = 'Canva design';
    }

    let html = '';

    if (appName || fileTypeHint) {
      html += `<p style="margin:0 0 10px"><strong>Source:</strong> ${appName}${fileTypeHint ? ` using a ${fileTypeHint}` : ''}</p>`;
    }

    if (issues.length > 0) {
      html += `<p style="margin:0 0 4px"><strong>Issues detected (${issues.length}):</strong></p>`;
      html += `<ul style="margin:0 0 10px 18px;padding:0">`;
      for (const issue of issues) {
        html += `<li style="margin-bottom:6px">${issue.message}`;
        if (issue.fix) html += `<br><em style="color:#888;font-size:11px">Fix: ${issue.fix}</em>`;
        html += '</li>';
      }
      html += '</ul>';
    } else {
      html += `<p style="margin:0 0 10px;color:#388e3c"><strong>No issues detected.</strong></p>`;
    }

    html += `<hr style="border:none;border-top:1px solid #ccc;margin:10px 0">`;

    const fileSize = headers.contentLength
      ? Math.round(parseInt(headers.contentLength, 10) / 1024) + '\u00a0KB'
      : '';
    const rows = [
      ['Link', `<a href="${absUrl}" target="_blank" rel="noopener">${absUrl}</a>`],
      fileSize ? ['File size', fileSize] : null,
      converter.pdfNumPages ? ['Pages', converter.pdfNumPages] : null,
      headers.lastModified ? ['Last modified', headers.lastModified] : null,
      headers.contentType ? ['Content-Type', headers.contentType] : null,
      info.Title ? ['PDF Title', info.Title] : null,
      info.Author ? ['PDF Author', info.Author] : null,
      info.Creator ? ['PDF Creator', info.Creator] : null,
      info.Producer ? ['PDF Producer', info.Producer] : null,
      info.CreationDate ? ['PDF Creation Date', info.CreationDate] : null,
    ].filter(Boolean);

    html += `<table style="border-collapse:collapse;font-size:12px;line-height:1.7">`;
    for (const [k, v] of rows) {
      html += `<tr><td style="padding:2px 14px 2px 0;color:#666;white-space:nowrap">${k}</td><td>${v}</td></tr>`;
    }
    html += '</table>';

    return { html, issueCount: issues.length };
  }

  function updateParseReport(converter) {
    const btn = select('#cvParseReportBtn');
    const panel = select('#cvParseReport');
    if (!btn || !panel) return;
    const { html, issueCount } = buildParseReport(converter);
    panel.innerHTML = html;
    btn.style.display = '';
    if (issueCount > 0) {
      btn.classList.add('btn-alert');
    } else {
      btn.classList.remove('btn-alert');
    }
  }

  function isEmptyParseResult(parsed) {
    if (!parsed) return true;
    return !(parsed.work || []).length
      && !(parsed.education || []).length
      && !(parsed.skills || []).length;
  }

  async function showPdfDiagnostics(pdfUrl) {
    const container = select('#resumeContainer');
    if (!container) return;
    container.innerHTML = '<p style="padding:20px">Analyzing PDF\u2026</p>';

    try {
      const response = await fetch(pdfUrl, { cache: 'no-store' });
      const lastModified = response.headers.get('Last-Modified') || '';
      const contentLength = response.headers.get('Content-Length');
      const fileSize = contentLength
        ? Math.round(parseInt(contentLength) / 1024) + '\u00a0KB'
        : '';
      const contentType = response.headers.get('Content-Type') || '';
      const arrayBuffer = await response.arrayBuffer();

      let pageCount = '';
      let lineCount = '';
      let charCount = '';
      let pdfInfo = {};

      const converter = getResumePdfConverter();
      if (converter) {
        await converter._ensurePdfjsReady();
        const pdfDoc = await converter.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pageCount = pdfDoc.numPages;
        try {
          const meta = await pdfDoc.getMetadata();
          pdfInfo = meta.info || {};
        } catch (_e) { /* ignore */ }

        let text = '';
        for (let p = 1; p <= pdfDoc.numPages; p++) {
          const page = await pdfDoc.getPage(p);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        lineCount = text.split('\n').filter(l => l.trim()).length;
        charCount = text.replace(/\s/g, '').length;
      }

      const absUrl = /^https?:\/\//.test(pdfUrl)
        ? pdfUrl
        : new URL(pdfUrl, window.location.href).href;

      const rows = [
        ['Link', `<a href="${absUrl}" target="_blank" rel="noopener">${absUrl}</a>`],
        fileSize ? ['File size', fileSize] : null,
        pageCount !== '' ? ['Pages', pageCount] : null,
        lineCount !== '' ? ['Lines', lineCount] : null,
        charCount !== '' ? ['Characters (non-whitespace)', charCount] : null,
        lastModified ? ['Last modified', lastModified] : null,
        contentType ? ['Content-Type', contentType] : null,
        pdfInfo.Title ? ['PDF Title', pdfInfo.Title] : null,
        pdfInfo.Author ? ['PDF Author', pdfInfo.Author] : null,
        pdfInfo.Creator ? ['PDF Creator', pdfInfo.Creator] : null,
        pdfInfo.Producer ? ['PDF Producer', pdfInfo.Producer] : null,
        pdfInfo.CreationDate ? ['PDF Creation Date', pdfInfo.CreationDate] : null,
      ].filter(Boolean);

      container.innerHTML = `
        <div class="content" style="padding:20px">
          <h3 style="margin-top:0">PDF Info (parse returned no content)</h3>
          <table style="border-collapse:collapse;font-size:13px;line-height:1.8">
            ${rows.map(([k, v]) => `<tr>
              <td style="padding:2px 16px 2px 0;color:#666;white-space:nowrap">${k}</td>
              <td>${v}</td>
            </tr>`).join('')}
          </table>
        </div>`;
    } catch (err) {
      container.innerHTML = `<p style="color:red;padding:20px">Failed to analyze PDF: ${err.message}</p>`;
    }
  }

  async function loadDefaultPdfResume() {
    if (isCvRootPage()) {
      await refreshRootHashTargetState();
      activePersonFolder = await resolveActivePersonFolder();
      await applyActivePersonProfileConfig(activePersonFolder);
      syncSourceSelectOptions(getSourceSelectValue('pdf'));
      syncNoBioClass();
      updateTeamLink();
    }

    if (!config.defaultPDF) {
      currentPdfData = null;
      revokePdfBlobUrl();
      clearResumeDisplay();
      return false;
    }

    const statusBox = select('#cvDataStatus');
    if (statusBox) {
      statusBox.textContent = `Loading external PDF: ${config.defaultPDF}`;
    }

    await ensureResumePdfConverterLoaded();
    const converter = getResumePdfConverter();
    if (!converter) {
      if (statusBox) {
        statusBox.textContent = isPdfOnlyMode()
          ? 'ResumePDFConverter is not available.'
          : 'ResumePDFConverter is not available; using JSON fallback.';
      }
      return false;
    }

    try {
      const parsed = await converter.init({ pdfUrl: config.defaultPDF });
      updateParseReport(converter);

      if (isEmptyParseResult(parsed)) {
        if (statusBox) statusBox.textContent = 'PDF parse returned no content; showing diagnostics.';
        await showPdfDiagnostics(config.defaultPDF);
        return false;
      }

      currentPdfData = parsed;
      currentResumeData = parsed;
      revokePdfBlobUrl();
      const dataPreview = select('#cvDataPreview');
      if (dataPreview) {
        dataPreview.textContent = JSON.stringify(parsed, null, 2);
      }
      if (statusBox) {
        statusBox.textContent = 'External PDF loaded and parsed successfully.';
      }
      return true;
    } catch (err) {
      console.error('Failed to parse external PDF:', err);
      currentPdfData = null;
      revokePdfBlobUrl();
      if (statusBox) {
        statusBox.textContent = isPdfOnlyMode()
          ? `Failed to parse external PDF (${err.message}).`
          : `Failed to parse external PDF (${err.message}); using JSON fallback.`;
      }
      return false;
    }
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

  function updateSourceSelectVisibility() {
    const jsonSelect = select('#sourceSelect');
    if (!jsonSelect) return;
    jsonSelect.style.display = jsonSelect.options.length >= 2 ? '' : 'none';
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

  function getThemeStylesheetHref() {
    const link = document.getElementById('cvThemeStylesheet');
    return link ? link.href : '';
  }

  function printThemePreview() {
    const resumeRoot = select('#resumeContainer');
    if (!resumeRoot || resumeRoot.textContent.trim() === 'Loading theme\u2026') {
      alert('Preview is not ready for printing yet.');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Unable to open print window. Please allow pop-ups for this site.');
      return;
    }
    const themeHref = getThemeStylesheetHref();
    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Resume Print</title>
        <link rel="stylesheet" href="/cv/common/cv.css">
        ${themeHref ? `<link rel="stylesheet" href="${themeHref}">` : ''}
        <style>
          @page { margin: 8mm; }
          html, body { margin: 0; padding: 0; background: #fff !important; }
          #resumeContainer { box-shadow: none !important; }
          #resumeContainer * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>${resumeRoot.outerHTML}</body>
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
    const resumeRoot = select('#resumeContainer');
    if (!resumeRoot) {
      alert('Preview HTML is not available yet.');
      return;
    }
    const themeHref = getThemeStylesheetHref();
    const html = `<!doctype html>\n<html>\n<head>\n  <meta charset="UTF-8">\n  <title>Resume</title>\n  <link rel="stylesheet" href="/cv/common/cv.css">\n  ${themeHref ? `<link rel="stylesheet" href="${themeHref}">` : ''}\n</head>\n<body>\n${resumeRoot.outerHTML}\n</body>\n</html>`;
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

  // Dark mode toggle (shared with project/index.html #pageConfigDarkToggle technique)
  function isDarkActive() {
    if (document.body.classList.contains('dark')) return true;
    if (typeof Cookies === 'undefined') return false;
    const sitelook = Cookies.get('sitelook') || 'default';
    if (sitelook === 'dark') return true;
    if (sitelook === 'computer') return window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (sitelook === 'default') {
      return (typeof Cookies !== 'undefined' && Cookies.get('modelsite') === 'dreamstudio')
        || location.host.indexOf('dreamstudio') >= 0
        || location.host.indexOf('planet.live') >= 0;
    }
    return false;
  }

  function updateDarkToggleIcon(btn) {
    if (!btn) return;
    const icon = btn.querySelector('.material-icons');
    const dark = isDarkActive();
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    if (icon) icon.textContent = dark ? 'dark_mode' : 'light_mode';
  }

  function setupPrintDownloadIcons() {
    const target = select('#map-print-download-icons');
    if (!target || target.dataset.ready === 'true') return;

    target.innerHTML = `
      <div class="cv-icon-menu">
        <button id="cvDarkToggleBtn" class="cv-icon-btn" type="button" title="Toggle dark mode" aria-pressed="false">
          <span class="material-icons">light_mode</span>
        </button>
      </div>
      <div class="cv-icon-menu hide-when-no-bio">
        <button id="cvPrintMenuBtn" class="cv-icon-btn" type="button" title="Print">
          <span class="material-icons">print</span>
        </button>
        <div id="cvPrintMenuPopup" class="cv-icon-popup">
          <button type="button" id="cvPrintResumeBtn">Print Resume</button>
          <button type="button" id="cvPrintJsonBtn">Print JSON Data</button>
        </div>
      </div>
      <div class="cv-icon-menu hide-when-no-bio">
        <button id="cvDownloadMenuBtn" class="cv-icon-btn" type="button" title="Download">
          <span class="material-icons">download</span>
        </button>
        <div id="cvDownloadMenuPopup" class="cv-icon-popup">
          <button type="button" id="cvDownloadResumeBtn">Download Resume HTML</button>
          <button type="button" id="cvDownloadJsonBtn">Download JSON Data</button>
        </div>
      </div>
    `;

    const darkToggleBtn = select('#cvDarkToggleBtn');
    if (darkToggleBtn) {
      updateDarkToggleIcon(darkToggleBtn);
      if (typeof waitForElm === 'function') {
        waitForElm('#bodyloaded').then(() => updateDarkToggleIcon(darkToggleBtn));
      }
      darkToggleBtn.addEventListener('click', () => {
        const newLook = document.body.classList.contains('dark') ? 'default' : 'dark';
        if (typeof Cookies !== 'undefined') Cookies.set('sitelook', newLook);
        if (typeof setSitelook === 'function') setSitelook(newLook);
        updateDarkToggleIcon(darkToggleBtn);
      });
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          updateDarkToggleIcon(darkToggleBtn);
        });
      }
    }

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

  // Load README.md into the existing #cvReadmeContent container.
  function loadReadme() {
    const personFolder = activePersonFolder || config.personFolder;
    if (!personFolder) {
      clearReadmeDisplay();
      return;
    }

    const useUserBioDiv = isCvRootPage();
    const readmeContent = useUserBioDiv ? getUserBioTarget() : select('#cvReadmeContent');
    const readmeSection = select('#cvReadmeSection');
    if (!readmeContent) return;
    const readmePath = resolvePersonAssetPath(personFolder, 'README.md');
    if (readmeContent.dataset.readmeLoading === readmePath) return;
    if (readmeContent.dataset.loadedMarkdown === readmePath && readmeContent.innerHTML.trim()) return;

    if (useUserBioDiv) {
      if (readmeSection) readmeSection.style.display = 'none';
      readmeContent.style.display = 'block';
    } else if (readmeSection && config.showReadme) {
      readmeSection.style.display = '';
    }

    readmeContent.innerHTML = '';
    readmeContent.dataset.loadedMarkdown = '';
    readmeContent.dataset.readmeLoading = readmePath;

    if (typeof loadMarkdown === 'function') {
      loadMarkdown(readmePath, readmeContent.id, '_parent', undefined, function () {
        readmeContent.dataset.readmeLoading = '';
        readmeContent.dataset.loadedMarkdown = readmePath;
      });
      return;
    }

    readmeContent.dataset.readmeLoading = '';
    readmeContent.innerHTML = `<p style='color:red;'>Failed to load ${readmePath}.</p>`;
  }

  // Setup event listeners
  function setupEventListeners() {
    const jsonSelect = select('#sourceSelect');
    const themeSelect = select('#themeSelect');
    const toggleJsonBtn = select('#cvToggleJsonBtn');
    const dataPreview = select('#cvDataPreview');
    if (toggleJsonBtn && dataPreview) {
      toggleJsonBtn.addEventListener('click', () => {
        const visible = dataPreview.style.display !== 'none';
        dataPreview.style.display = visible ? 'none' : 'block';
        toggleJsonBtn.textContent = visible ? 'View json' : 'Hide json';
      });
    }

    const parseReportBtn = select('#cvParseReportBtn');
    const parseReport = select('#cvParseReport');
    if (parseReportBtn && parseReport) {
      parseReportBtn.addEventListener('click', () => {
        const visible = parseReport.style.display !== 'none';
        parseReport.style.display = visible ? 'none' : 'block';
        parseReportBtn.textContent = visible ? 'Parse Report' : 'Hide Report';
      });
    }

    if (jsonSelect) {
      jsonSelect.addEventListener('change', () => {
        const selectedSource = jsonSelect.value;
        if (typeof updateHash === 'function') {
          updateHash({ source: selectedSource }, true, ['resume']);
        }
        if (selectedSource === 'pdf') {
          loadDefaultPdfResume().then((loaded) => {
            if (loaded) {
              loadTheme(currentJsonFile || config.defaultJson, currentTheme);
            }
          });
        } else {
          currentPdfData = null;
          revokePdfBlobUrl();
          loadAll(getRequestedJsonFile(), currentTheme);
        }
      });
    }

    if (themeSelect) {
      themeSelect.addEventListener('change', () => {
        const theme = themeSelect.value;
        setCachedTheme(theme);
        if (typeof goHash === 'function') {
          const params = { theme: theme || '' };
          const removeFromHash = ['resume'];
          if (config.syncResumeParam && currentJsonFile) {
            params.resume = currentJsonFile;
            removeFromHash.length = 0;
          }
          goHash(params, removeFromHash);
        } else {
          if (jsonSelect && jsonSelect.value === 'pdf') {
            loadTheme(currentJsonFile || config.defaultJson, theme);
          } else {
            loadAll(currentJsonFile || config.defaultJson, theme);
          }
        }
      });
    }

    const teamLink = select('#cvOurTeamLink');
    if (teamLink) {
      teamLink.addEventListener('click', (event) => {
        if (!isCvRootPage() || typeof goHash !== 'function') return;
        event.preventDefault();
        const showingTeam = hasTeamToken(getWhoTokens());
        if (showingTeam) {
          const restoreWho = getRestoreWhoValue(activePersonFolder || config.personFolder);
          if (restoreWho) {
            goHash({ who: restoreWho, team: '' }, 'team');
          } else {
            goHash({ team: '' }, ['team', 'who']);
          }
        } else {
          if (isCvRootPage() && hasBareWhoHash()) {
            goHash({ '': '' });
            return;
          }
          goHash({ who: buildTeamWhoValue() });
        }
      });
    }

    // React to hash changes (triggered by goHash or direct URL edits)
    document.addEventListener('hashChangeEvent', async function () {
      const theme = getThemeForHashChange();
      const source = getRequestedSource();
      const jsonFile = getRequestedJsonFile();
      const sourceSelectValue = getSourceSelectValue(source);
      const themeEl = select('#themeSelect');
      const jsonEl = select('#sourceSelect');
      if (themeEl) themeEl.value = theme;
      if (jsonEl) {
        ensureJsonSelectOption();
        jsonEl.value = sourceSelectValue;
      }
      syncTeamUiFromHash(getHashParam('who', '') !== (window.priorHash && window.priorHash.who ? window.priorHash.who : ''));
      if (sourceSelectValue === 'pdf') {
        const loaded = await loadDefaultPdfResume();
        if (loaded) {
          loadTheme(currentJsonFile || config.defaultJson, theme);
        }
      } else {
        await loadAll(jsonFile, theme);
      }
      if (config.showReadme) {
        loadReadme();
      }
      if (config.autoDetectJsonFiles && !isPdfOnlyMode()) {
        autoDetectJsonFiles(jsonFile);
      }
    });
  }

  // Initialize filters
  function init(options = {}) {
    filtersInitialized = true;
    ensureBioStyles();

    // Merge config
    config = Object.assign({}, config, options);
    baseConfig = Object.assign({}, config);
    if (!config.personFolder) {
      config.personFolder = detectPersonFolder();
    }
    activePersonFolder = config.personFolder;
    if (config.defaultPDF && typeof options.syncResumeParam === 'undefined') {
      config.syncResumeParam = false;
    }

    // Load shared resume styles once via localsite.js includeCSS3
    if (typeof includeCSS3 === 'function') {
      includeCSS3('/cv/common/cv.css');
    }

    // Find or create container
    let container = select('#cvFiltersContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cvFiltersContainer';
      insertFiltersContainer(container);
    }

    // Generate and insert HTML
    container.innerHTML = generateFilterHTML();
    ensureBioListElement();

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

    const source = getRequestedSource();
    const jsonFile = getRequestedJsonFile();
    const sourceSelectValue = getSourceSelectValue(source);

    // Theme priority: hash → page default (options.defaultTheme) → localStorage cache
    const hashTheme = getHashParam('theme', null);
    const theme = hashTheme !== null ? hashTheme
      : options.defaultTheme ? config.defaultTheme
      : getCachedTheme();

    // Set dropdown values
    const jsonSelect = select('#sourceSelect');
    const themeSelect = select('#themeSelect');

    ensureJsonSelectOption();
    if (jsonSelect) jsonSelect.value = sourceSelectValue;
    if (themeSelect) themeSelect.value = theme;

    if (config.defaultPDF && jsonSelect) {
      if (!Array.from(jsonSelect.options).some((option) => option.value === 'pdf')) {
        const pdfOpt = document.createElement('option');
        pdfOpt.value = 'pdf';
        pdfOpt.textContent = 'PDF';
        jsonSelect.appendChild(pdfOpt);
      }
      if (source === 'pdf') jsonSelect.value = 'pdf';
    }
    updateSourceSelectVisibility();

    // Setup event listeners
    setupEventListeners();
    setupPrintDownloadIcons();

    // Initialize the renderer moved from index.js, then start rendering
    function startContent() {
      (async () => {
        const sourceVal = getRequestedSource();
        const selectedSource = getSourceSelectValue(sourceVal);

        if (jsonSelect) {
          ensureJsonSelectOption();
          jsonSelect.value = selectedSource;
          updateSourceSelectVisibility();
        }

        if (selectedSource === 'pdf') {
          const loaded = await loadDefaultPdfResume();
          if (loaded) {
            loadTheme(currentJsonFile || config.defaultJson, theme);
          } else if (!isPdfOnlyMode()) {
            await loadAll(jsonFile, theme);
          }
        } else {
          await loadAll(jsonFile, theme);
        }

        if (config.showReadme) {
          loadReadme();
        }

        if (config.autoDetectJsonFiles && !isPdfOnlyMode()) {
          autoDetectJsonFiles(jsonFile);
        }
      })();
    }

    initCvRenderer();
    startContent();
  }

  // Probe for common JSON filenames and populate the Data dropdown
  async function autoDetectJsonFiles(currentFile) {
    if (isPdfOnlyMode()) return;

    const candidates = getJsonCandidates();
    const jsonSelect = select('#sourceSelect');
    if (!jsonSelect) return;

    const found = [];
    await Promise.all(candidates.map(async (file) => {
      try {
        const res = await fetch(resolvePersonAssetPath(activePersonFolder || config.personFolder, file), { method: 'HEAD', cache: 'no-store' });
        if (res.ok) found.push(file);
      } catch { /* ignore */ }
    }));

    if (found.length) {
      if (!config.defaultJson) {
        config.defaultJson = currentFile || found[0];
      }
      syncSourceSelectOptions(getSourceSelectValue());
      ensureJsonSelectOption();
      jsonSelect.value = getSourceSelectValue();
      updateSourceSelectVisibility();
    }
  }

  // Export public API
  window.CVFilters = {
    init: init,
    select: select,
    selectAll: selectAll,
    getHashParam: getHashParam,
    setFilterParams: setFilterParams,
    loadJson: loadJson,
    loadTheme: loadTheme,
    loadReadme: loadReadme,
    revokePdfBlobUrl: revokePdfBlobUrl
  };

  window.addEventListener('beforeunload', revokePdfBlobUrl);
  bindStandaloneBioMode();

})(window);
