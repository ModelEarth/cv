/**
 * ResumePDFConverter - Modular PDF-to-JSON Resume Converter
 * 
 * Converts PDF resumes to JSON Resume format in real-time.
 * Can load PDFs from external URLs or local file uploads.
 * 
 * Usage:
 *   // From external URL:
 *   ResumePDFConverter.init({ 
 *     pdfUrl: "https://example.com/resume.pdf",
 *     onSuccess: (jsonData) => { console.log(jsonData); },
 *     onError: (error) => { console.error(error); }
 *   })
 * 
 *   // From file input:
 *   ResumePDFConverter.init({ 
 *     pdfFile: fileInputElement.files[0],
 *     onSuccess: (jsonData) => { console.log(jsonData); }
 *   })
 * 
 * Integration with SatvikPraveen page:
 *   The ResumePDFConverter module can be used alongside SatvikPraveen's existing
 *   PDF parsing. Simply include ResumePDFConverter.js and use it for external URL
 *   loading while keeping the existing file upload functionality.
 */

const ResumePDFConverter = {
  pdfjsLib: null,
  isInitialized: false,
  rawText: '',
  pdfMetadata: {},
  pdfNumPages: 0,
  lastResponseHeaders: {},

  /**
   * Initialize CVFilters with PDF source
   * @param {Object} options - Configuration options
   * @param {string} options.pdfUrl - External URL to PDF file
   * @param {File} options.pdfFile - Local file object from file input
   * @param {Function} options.onSuccess - Callback when JSON is ready
   * @param {Function} options.onError - Callback on error
   */
  async init(options = {}) {
    try {
      // Ensure PDF.js is loaded
      await this._ensurePdfjsReady();

      // Load PDF from URL or file
      let arrayBuffer;
      if (options.pdfUrl) {
        arrayBuffer = await this._fetchPdfFromUrl(options.pdfUrl);
      } else if (options.pdfFile) {
        arrayBuffer = await this._readFileAsArrayBuffer(options.pdfFile);
      } else {
        throw new Error("Either pdfUrl or pdfFile must be provided");
      }

      // Extract text from PDF
      const text = await this._extractTextFromPdf(arrayBuffer);
      this.rawText = text;

      // Parse text to JSON Resume format
      const jsonData = this._parseResumeText(text);

      // Call success callback
      if (options.onSuccess) {
        options.onSuccess(jsonData);
      }

      return jsonData;
    } catch (error) {
      console.error("[CVFilters] Error:", error);
      if (options.onError) {
        options.onError(error);
      }
      throw error;
    }
  },

  /**
   * Ensure PDF.js library is loaded (lazy — only imported on first use)
   */
  async _ensurePdfjsReady() {
    if (this.pdfjsLib) return;

    if (window.pdfjsLib) {
      this.pdfjsLib = window.pdfjsLib;
      return;
    }

    const pdfModule = await import("/cv/extract/vendor/pdf.mjs");
    if (pdfModule.GlobalWorkerOptions) {
      pdfModule.GlobalWorkerOptions.workerSrc = "/cv/extract/vendor/pdf.worker.mjs";
    }
    window.pdfjsLib = pdfModule;
    this.pdfjsLib = pdfModule;
  },

  /**
   * Fetch PDF from external URL
   */
  async _fetchPdfFromUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
    this.lastResponseHeaders = {
      lastModified: response.headers.get('Last-Modified') || '',
      contentLength: response.headers.get('Content-Length') || '',
      contentType: response.headers.get('Content-Type') || '',
    };
    return await response.arrayBuffer();
  },

  /**
   * Read local file as ArrayBuffer
   */
  async _readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Extract text from PDF ArrayBuffer
   */
  async _extractTextFromPdf(arrayBuffer) {
    const loadingTask = this.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    this.pdfNumPages = pdf.numPages;
    try {
      const meta = await pdf.getMetadata();
      this.pdfMetadata = meta.info || {};
    } catch (_e) {
      this.pdfMetadata = {};
    }

    let fullText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Sort text items by position (top to bottom, left to right)
      const items = textContent.items.slice();
      items.sort((a, b) => {
        const ay = (a.transform && a.transform[5]) || 0;
        const by = (b.transform && b.transform[5]) || 0;
        if (Math.abs(by - ay) > 0.5) return by - ay;
        const ax = (a.transform && a.transform[4]) || 0;
        const bx = (b.transform && b.transform[4]) || 0;
        return ax - bx;
      });

      // Column-separator threshold: 15% of the actual page width.
      // This is far more reliable than font-size guesses and catches the
      // large horizontal jump between a resume name (left) and contact info (right).
      const pageView = page.view || [0, 0, 612, 792];
      const colThreshold = (pageView[2] - pageView[0]) * 0.15;

      // Group text by line, using horizontal gaps to decide separators:
      //   end-to-start gap < 0.5 pt       → no separator  (split word, e.g. "Presen"+"t")
      //   start-to-start gap > 15% pw     → tab            (column jump, e.g. name → contact)
      //   wide pure-whitespace item        → tab flag       (explicit spacer in the PDF)
      //   narrow pure-whitespace item      → skipped       (word space — don't emit '\t')
      //   otherwise                        → space          (normal word gap)
      //
      // Spacer items are SKIPPED (not added to parts) to avoid turning ordinary word
      // spaces like the one in "Loren Heyns" into '\t'. Wide spacers set a pending flag
      // that forces '\t' on the next real text item regardless of gap size.
      const lines = [];
      let currentLine = {
        y: null, parts: [], lastEndX: null, lastStartX: null, pendingColumnSep: false
      };

      for (const item of items) {
        const y = (item.transform && item.transform[5]) || 0;
        const x = (item.transform && item.transform[4]) || 0;
        const endX = x + (item.width || 0);
        const isSpacer = item.str.length > 0 && item.str.trim() === '';

        if (currentLine.y !== null && Math.abs(y - currentLine.y) > 2) {
          // New line — flush the current one
          if (currentLine.parts.length > 0) {
            lines.push(currentLine.parts.join('').replace(/ {2,}/g, ' '));
          }
          currentLine = {
            y, parts: isSpacer ? [] : [item.str],
            lastEndX: isSpacer ? null : endX,
            lastStartX: isSpacer ? null : x,
            pendingColumnSep: false
          };
        } else if (isSpacer) {
          // Spacer within a line: advance lastEndX but don't add to parts.
          // Only set the pending flag when the spacer is wide enough to be a column separator.
          if (currentLine.lastEndX !== null) {
            currentLine.lastEndX = Math.max(currentLine.lastEndX, endX);
          }
          if ((item.width || 0) > colThreshold * 0.5) {
            currentLine.pendingColumnSep = true;
          }
        } else if (currentLine.parts.length === 0) {
          // First real text item on this line
          currentLine.y = y;
          currentLine.parts.push(item.str);
          currentLine.lastEndX = endX;
          currentLine.lastStartX = x;
        } else {
          const endGap   = x - currentLine.lastEndX;    // gap after previous word ends
          const startGap = x - currentLine.lastStartX;  // distance between start positions
          let prefix;
          if (currentLine.pendingColumnSep || startGap > colThreshold) {
            prefix = '\t';          // wide spacer flag or large positional jump = column
          } else if (endGap < 0) {
            prefix = '';            // overlapping items = split character in font encoding
          } else {
            prefix = ' ';           // normal inter-word space
          }
          currentLine.pendingColumnSep = false;
          currentLine.parts.push(prefix + item.str);
          currentLine.y = y;
          currentLine.lastEndX = endX;
          currentLine.lastStartX = x;
        }
      }

      if (currentLine.parts.length > 0) {
        lines.push(currentLine.parts.join('').replace(/ {2,}/g, ' '));
      }

      fullText += lines.join("\n") + "\n\n";
    }

    return fullText.trim();
  },

  /**
   * Parse resume text to JSON Resume format
   */
  _parseResumeText(text) {
    // Clean and normalize text (tabs are preserved by _cleanText as column markers)
    const cleanedText = this._cleanText(text);

    // Parse the header block (everything before the first section heading) into
    // structured basics. This captures all contact items regardless of layout.
    const basics = this._extractBasics(cleanedText);

    // Identify sections
    const sections = this._identifySections(cleanedText);

    return {
      basics: {
        ...basics,
        summary: sections.summary || sections.about || "",
      },
      work: this._parseWorkExperience(sections.experience || sections.work || ""),
      education: this._parseEducation(sections.education || ""),
      skills: this._parseSkills(sections.skills || sections["technical skills"] || ""),
      projects: this._parseProjects(sections.projects || ""),
      certificates: this._parseSimpleList(sections.certifications || ""),
      awards: this._parseSimpleList(sections.awards || ""),
      volunteer: this._parseSimpleList(sections.volunteer || ""),
      languages: this._parseSimpleList(sections.languages || ""),
      interests: this._parseSimpleList(sections.interests || ""),
    };
  },

  /**
   * Extract structured basics from the header block (everything before the first
   * recognized section heading).
   *
   * Strategy:
   *   1. Isolate the header block.
   *   2. Split every line on tab and pipe to get individual "pieces".
   *   3. Name = first piece of first line (before tab/pipe).
   *   4. Remaining pieces are categorized: email, phone, URL, location.
   *      The first piece that matches none of those becomes the job label.
   *      All others (extra URLs, unrecognized text) go into profiles[].
   */
  _extractBasics(text) {
    // --- 1. Isolate header block ---
    const sectionHeadingRe = /^(?:summary|professional\s+summary|career\s+summary|profile|objective|about(?:\s+me)?|overview|experience|work\s+experience|professional\s+experience|work\s+history|employment(?:\s+history)?|education(?:al\s+background)?|academic(?:\s+background)?|qualifications?|skills|technical\s+skills|core\s+competencies|competencies|expertise|technologies|key\s+skills|projects?|portfolio|certifications?|certificates?|awards?|honors?|achievements?|volunteer(?:ing)?|community(?:\s+involvement)?|languages?|interests?|hobbies|activities)\s*$/im;
    const sectionMatch = text.match(sectionHeadingRe);
    const headerText = sectionMatch
      ? text.substring(0, sectionMatch.index)
      : text.substring(0, 800);

    // --- 2. Collect pieces: split each line on tab and pipe ---
    const pieces = [];
    for (const line of headerText.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      for (const piece of trimmed.split(/\t|\s*\|\s*/)) {
        const p = piece.trim();
        if (p) pieces.push(p);
      }
    }

    if (!pieces.length) {
      return { name: 'Resume', label: '', email: '', phone: '', url: '', location: '', profiles: [] };
    }

    // --- 3. Name = first piece (may contain pipe/bullet separators before tab) ---
    let name = pieces[0].split(/\s*[•·]\s*/)[0].trim() || 'Resume';
    // Strip trailing phone-like digits from name
    name = name.replace(/\s+\d[\d\s\-().]{5,}$/, '').trim() || 'Resume';

    // --- 4. Categorize remaining pieces ---
    const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRe = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    // Known social/portfolio domains that may appear without "https://"
    const knownDomainRe = /^(?:https?:\/\/|www\.|linkedin\.com|github\.com|gitlab\.com|twitter\.com|x\.com|behance\.net|dribbble\.com|portfolio\.|medium\.com|stackoverflow\.com)/i;
    // Fallback: anything that looks like domain.tld/path
    const looksLikeUrlRe = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?$/;
    // City, ST  or  City, Country
    const locationRe = /^[A-Z][a-z](?:[a-z]|\s(?=[A-Z]))*,\s*(?:[A-Z]{2}|[A-Z][a-z]+)/;

    let label = '', email = '', url = '', location = '';
    const phones = [];
    const profiles = [];

    for (const piece of pieces.slice(1)) {
      // Email
      const emailMatch = piece.match(emailRe);
      if (emailMatch) {
        if (!email) email = emailMatch[0];
        continue;
      }
      // Phone — collect all, not just first
      if (phoneRe.test(piece) && /\d{7,}/.test(piece.replace(/\D/g, ''))) {
        phones.push(piece.match(phoneRe)[0]);
        continue;
      }
      // URL
      if (knownDomainRe.test(piece) || looksLikeUrlRe.test(piece)) {
        const fullUrl = /^https?:\/\//i.test(piece) ? piece : 'https://' + piece.replace(/^www\./i, '');
        if (!url) {
          url = fullUrl;
        } else {
          // Derive a human-readable network name from the domain
          const domainMatch = piece.replace(/^https?:\/\//i, '').match(/^(?:www\.)?([^./]+)/);
          const network = domainMatch ? domainMatch[1] : piece;
          profiles.push({ network, url: fullUrl });
        }
        continue;
      }
      // Location
      if (locationRe.test(piece)) {
        if (!location) location = piece;
        continue;
      }
      // First unrecognized piece → job label/title
      if (!label) {
        label = piece;
        continue;
      }
      // Everything else: display as extra contact item in top-side
      profiles.push({ network: '', url: '', display: piece });
    }

    return { name, label, email, phone, url, location, profiles };
  },

  /**
   * Clean and normalize text
   */
  _cleanText(text) {
    return text
      .replace(/\b((?:19|20))[\s\u00a0\u200b\u200c\u200d\ufeff]+(\d{2})\b/g, '$1$2')
      .replace(/ +/g, " ")
      .replace(/[-–—]/g, "-")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .replace(/\s+([.,;:])/g, "$1")
      .trim();
  },

  /**
   * Identify resume sections by scanning line-by-line for known headings.
   * Handles many common variations; first occurrence of each section wins.
   */
  _identifySections(text) {
    const sections = {};

    const sectionMap = [
      { name: "summary",        re: /^(?:summary|professional\s+summary|career\s+summary|profile|objective|about(?:\s+me)?|overview)$/ },
      { name: "experience",     re: /^(?:experience|work\s+experience|professional\s+experience|work\s+history|employment(?:\s+history)?|professional\s+background|career(?:\s+history)?)$/ },
      { name: "education",      re: /^(?:education(?:al\s+background)?|academic(?:\s+background)?|qualifications?)$/ },
      { name: "skills",         re: /^(?:skills|technical\s+skills|core\s+competencies|competencies|expertise|technologies|key\s+skills|tools(?:\s+[&+]\s+technologies)?)$/ },
      { name: "projects",       re: /^(?:projects?|portfolio|personal\s+projects?|key\s+projects?|notable\s+projects?|selected\s+projects?)$/ },
      { name: "certifications", re: /^(?:certifications?|certificates?|licenses?(?:\s+[&+]\s+certifications?)?|credentials?)$/ },
      { name: "awards",         re: /^(?:awards?(?:\s+[&+]\s+(?:honors?|achievements?))?|honors?|achievements?|recognition)$/ },
      { name: "volunteer",      re: /^(?:volunteer(?:ing|(?:\s+experience))?|community(?:\s+involvement)?|civic\s+involvement)$/ },
      { name: "languages",      re: /^(?:languages?(?:\s+[&+]\s+tools?)?)$/ },
      { name: "interests",      re: /^(?:interests?|hobbies|activities)$/ },
    ];

    const lines = text.split("\n");
    const markers = []; // { name, startChar, endChar } of each header line
    let charOffset = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      const lineEnd = charOffset + line.length + 1;

      if (trimmed.length > 0 && trimmed.length <= 60) {
        for (const { name, re } of sectionMap) {
          if (re.test(trimmed.toLowerCase())) {
            markers.push({ name, startChar: charOffset, endChar: lineEnd });
            break;
          }
        }
      }

      charOffset = lineEnd;
    }

    for (let i = 0; i < markers.length; i++) {
      const contentStart = markers[i].endChar;
      const contentEnd = i + 1 < markers.length ? markers[i + 1].startChar : text.length;
      if (!sections[markers[i].name]) {
        sections[markers[i].name] = text.substring(contentStart, contentEnd).trim();
      }
    }

    return sections;
  },

  /**
   * Parse work experience section using date ranges as entry boundaries.
   *
   * Two-pass approach: first tag every line, find date-range lines, then look
   * back (up to 2 non-bullet/non-date lines) to find the title/company for each
   * entry. This prevents the job title of entry N+1 from being absorbed into
   * entry N's summary. Tab characters (column separators) split "Position\tCompany"
   * on the same line.
   */
  _parseWorkExperience(text) {
    const entries = [];
    if (!text) return entries;

    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    const bulletRe = /^[•·▪\-–*]\s+/;
    const fullDateRangeRe = /\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}\s*(?:[-–—]+|\bto\b)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?(?:\d{4}|[Pp]resent|[Cc]urrent)\b/i;

    const tagged = lines.map(l => ({
      line: l,
      isDate: !!l.match(fullDateRangeRe),
      isBullet: bulletRe.test(l),
    }));

    const dateIndices = tagged.reduce((acc, t, i) => (t.isDate ? [...acc, i] : acc), []);

    if (dateIndices.length === 0) {
      // No date ranges — treat first line as position, second as company
      if (lines.length > 0) {
        const tabIdx = lines[0].indexOf('\t');
        const position = tabIdx > 0 ? lines[0].substring(0, tabIdx).trim() : lines[0];
        const company  = tabIdx > 0 ? lines[0].substring(tabIdx + 1).trim() : (lines[1] || "");
        const rest = lines.slice(tabIdx > 0 ? 1 : 2);
        entries.push({
          position, company, startDate: "", endDate: "",
          summary: rest.filter(l => !bulletRe.test(l)).join(" "),
          highlights: rest.filter(l => bulletRe.test(l)).map(l => l.replace(bulletRe, "").trim()),
        });
      }
      return entries;
    }

    for (let di = 0; di < dateIndices.length; di++) {
      const dateIdx = dateIndices[di];
      const dateLine = tagged[dateIdx].line;
      const dm = dateLine.match(fullDateRangeRe);
      const dateParts = dm[0].split(/\s*(?:[-–—]+|\bto\b)\s*/i);
      const startDate = (dateParts[0] || "").trim();
      const endRaw    = (dateParts[1] || "").trim();
      const endDate   = /present|current/i.test(endRaw) ? "" : endRaw;
      const restOnDateLine = dateLine.replace(fullDateRangeRe, "").replace(/[|,·•\t]+/g, " ").trim();

      // Look back up to 2 non-bullet/non-date lines immediately before the date line
      const titleLines = [];
      for (let j = dateIdx - 1; j >= 0 && titleLines.length < 2; j--) {
        const t = tagged[j];
        if (t.isDate || t.isBullet) break;
        titleLines.unshift(t.line);
      }

      // Derive position and company from title lines (tab = column separator)
      let position = "", company = "";
      if (titleLines.length > 0) {
        const firstTitle = titleLines[0];
        const tabIdx = firstTitle.indexOf('\t');
        if (tabIdx > 0) {
          position = firstTitle.substring(0, tabIdx).trim();
          company  = firstTitle.substring(tabIdx + 1).trim();
          if (!company && titleLines.length > 1) company = titleLines[1];
        } else {
          position = firstTitle;
          company  = titleLines[1] || "";
        }
      }
      if (restOnDateLine && !position) position = restOnDateLine;
      else if (restOnDateLine && !company) company  = restOnDateLine;

      // Collect highlights and summary from lines after the date until the next date
      const nextDateIdx = di + 1 < dateIndices.length ? dateIndices[di + 1] : tagged.length;
      const afterDate = tagged.slice(dateIdx + 1, nextDateIdx);
      const highlights = [];
      let summary = "";
      for (const t of afterDate) {
        if (t.isBullet) {
          highlights.push(t.line.replace(bulletRe, "").trim());
        } else if (!t.isDate) {
          if (!company) company = t.line;
          else summary += (summary ? " " : "") + t.line;
        }
      }

      if (position || company || startDate) {
        entries.push({ position, company, startDate, endDate, summary, highlights });
      }
    }

    return entries;
  },

  /**
   * Parse education section with degree and date detection.
   */
  _parseEducation(text) {
    const entries = [];
    if (!text) return entries;

    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    const degreeRe = /\b(Bachelor[^,\n]*|Master[^,\n]*|Ph\.?D[^,\n]*|M\.?B\.?A[^,\n]*|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|Associate[^,\n]*|Doctor[^,\n]*)\b/i;
    const yearRe = /\b(\d{4})\b/g;
    const bulletRe = /^[•·▪\-–*]\s+/;

    let current = null;

    const flush = () => {
      if (current && current.institution) entries.push(current);
      current = { institution: "", studyType: "", area: "", startDate: "", endDate: "" };
    };

    for (const line of lines) {
      if (bulletRe.test(line)) continue;

      const degreeMatch = line.match(degreeRe);
      const years = [...line.matchAll(yearRe)].map(m => m[1]);

      if (degreeMatch) {
        if (!current) flush();
        current.studyType = degreeMatch[0].trim();
        // "in Computer Science" following the degree
        const areaMatch = line.match(/\bin\s+([A-Z][^,\n]+)/i);
        if (areaMatch) current.area = areaMatch[1].trim();
        if (years.length) {
          current.startDate = years[0];
          current.endDate = years[1] || "";
        }
      } else if (years.length && current) {
        if (!current.startDate) current.startDate = years[0];
        if (!current.endDate && years[1]) current.endDate = years[1];
      } else if (line.length > 2) {
        // Institution or area line
        flush();
        current.institution = line;
      }
    }

    flush();
    return entries;
  },

  /**
   * Generic parser for list-style sections (certifications, awards, etc.)
   */
  _parseSimpleList(text) {
    if (!text) return [];
    const bulletRe = /^[•·▪\-–*]\s+/;
    return text.split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .map(l => ({ name: l.replace(bulletRe, "").trim() }));
  },

  /**
   * Parse skills section.
   * Handles three formats that PDFs produce after column-aware extraction:
   *   "Languages:"              — standalone header line
   *   "Languages: Python, JS"   — inline header + keywords
   *   "Languages:\tPython, JS"  — tab-separated (left col = header, right = keywords)
   */
  _parseSkills(text) {
    const skills = [];
    if (!text) return skills;
    const lines = text.split("\n").filter(l => l.trim());

    let currentCategory = "Skills";
    let keywords = [];

    const pushCurrent = () => {
      if (keywords.length > 0) {
        skills.push({ name: currentCategory, keywords: [...keywords] });
        keywords = [];
      }
    };

    for (const line of lines) {
      // Split on tab to separate possible "Category:" from inline keywords
      const tabIdx = line.indexOf('\t');
      const mainPart = (tabIdx >= 0 ? line.substring(0, tabIdx) : line).trim();
      const tabRest  = tabIdx >= 0 ? line.substring(tabIdx + 1).trim() : '';

      // Category header: "Something:" or "Something Name: optional keywords..."
      // Require at least one uppercase start and colon within first 35 chars of mainPart
      const catMatch = mainPart.match(/^([A-Z][^:\n]{0,33}):\s*(.*)$/);
      if (catMatch) {
        pushCurrent();
        currentCategory = catMatch[1].trim();
        const inlineContent = (catMatch[2] + (tabRest ? ' ' + tabRest : '')).trim();
        if (inlineContent) {
          keywords.push(...inlineContent.split(/[,•]/).map(w => w.trim()).filter(w => w));
        }
      } else {
        // Plain keywords line — merge tab-separated parts with comma
        const fullLine = tabRest ? `${mainPart}, ${tabRest}` : mainPart;
        keywords.push(...fullLine.split(/[,•]/).map(w => w.trim()).filter(w => w));
      }
    }

    pushCurrent();
    return skills;
  },

  /**
   * Parse projects section
   */
  _parseProjects(text) {
    const projects = [];
    const lines = text.split("\n").filter(l => l.trim());
    
    let currentProject = null;
    for (const line of lines) {
      if (line.match(/^[A-Z]/) && line.length < 100) {
        if (currentProject) projects.push(currentProject);
        currentProject = {
          name: line,
          summary: "",
          keywords: [],
        };
      } else if (currentProject) {
        currentProject.summary += (currentProject.summary ? " " : "") + line;
      }
    }
    if (currentProject) projects.push(currentProject);

    return projects;
  },

  /**
   * Detect formatting issues in the raw extracted text that the user should fix in their source document.
   * Returns an array of { type, message, fix } objects.
   */
  detectIssues() {
    const issues = [];
    if (!this.rawText) return issues;

    const lines = this.rawText.split('\n').filter(l => l.trim());

    // Tab or multi-space in the name line causes name to bleed into adjacent content.
    // After extraction: column separators become '\t'; as a fallback also detect 3+ spaces.
    const nameLine = lines[0] || '';
    const nameSepMatch = nameLine.match(/\t| {3,}/);
    if (nameSepMatch) {
      const parts = nameLine.split(/\t| {3,}/);
      issues.push({
        type: 'tab-in-name',
        message: `Name line has a column separator — "${parts[0].trim()}" is followed by "${parts.slice(1).join(' ').trim()}"`,
        fix: 'Replace the tab/large gap in the name/header line with a line break in your source document.'
      });
    }

    // Split year: a 4-digit year like "2020" appears as "20 20" because an invisible
    // character (e.g. soft hyphen, zero-width space) is embedded in the digits
    const splitYearRe = /\b((?:19|20))[\s\u00a0\u200b\u200c\u200d\ufeff]+(\d{2})\b/g;
    const foundYears = new Map();
    let m;
    while ((m = splitYearRe.exec(this.rawText)) !== null) {
      const combined = m[1] + m[2];
      const num = parseInt(combined, 10);
      if (num >= 1900 && num <= 2099 && !foundYears.has(combined)) {
        foundYears.set(combined, `"${m[1]} ${m[2]}"`);
      }
    }
    for (const [year, displayed] of foundYears) {
      issues.push({
        type: 'split-year',
        message: `Year "${year}" appears as ${displayed} — an invisible character is splitting the digits.`,
        fix: `Select and delete "${year}" in your source document, then retype it.`
      });
    }

    return issues;
  },
};

// Export for use in modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ResumePDFConverter;
}
