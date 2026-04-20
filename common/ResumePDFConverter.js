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
 */

const ResumePDFConverter = {
  pdfjsLib: null,
  isInitialized: false,
  rawText: '',
  structuredLines: [],
  pdfMetadata: {},
  pdfNumPages: 0,
  lastResponseHeaders: {},
  parseWarnings: [],

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

      this.parseWarnings = [];

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
    this.structuredLines = [];
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
      //   end-to-start gap <= 0.75 pt     → no separator  (split word, e.g. "Presen"+"t")
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
        y: null, parts: [], items: [], lastEndX: null, lastStartX: null, pendingColumnSep: false, pendingWordSep: false
      };
      const tinyGapThreshold = 0.75;

      for (const item of items) {
        const itemText = this._sanitizeExtractedTextFragment(item.str);
        if (!itemText) {
          continue;
        }
        const y = (item.transform && item.transform[5]) || 0;
        const x = (item.transform && item.transform[4]) || 0;
        const endX = x + (item.width || 0);
        const isSpacer = itemText.length > 0 && itemText.trim() === '';

        if (currentLine.y !== null && Math.abs(y - currentLine.y) > 2) {
          // New line — flush the current one
          this._flushExtractedLine(lines, currentLine, pageNum);
          currentLine = {
            y, parts: isSpacer ? [] : [itemText],
            items: isSpacer ? [] : [this._createLineItem(item, x, endX, itemText)],
            lastEndX: isSpacer ? null : endX,
            lastStartX: isSpacer ? null : x,
            pendingColumnSep: false,
            pendingWordSep: false
          };
        } else if (isSpacer) {
          // Spacer within a line: advance lastEndX but don't add to parts.
          // Only set the pending flag when the spacer is wide enough to be a column separator.
          if (currentLine.lastEndX !== null) {
            currentLine.lastEndX = Math.max(currentLine.lastEndX, endX);
          }
          if ((item.width || 0) > colThreshold * 0.5) {
            currentLine.pendingColumnSep = true;
            currentLine.pendingWordSep = false;
          } else if (currentLine.items.length > 0) {
            currentLine.pendingWordSep = true;
          }
        } else if (currentLine.parts.length === 0) {
          // First real text item on this line
          currentLine.y = y;
          currentLine.parts.push(itemText);
          currentLine.items.push(this._createLineItem(item, x, endX, itemText));
          currentLine.lastEndX = endX;
          currentLine.lastStartX = x;
        } else {
          const endGap   = x - currentLine.lastEndX;    // gap after previous word ends
          const startGap = x - currentLine.lastStartX;  // distance between start positions
          const movedBackwardAcrossColumns = currentLine.lastStartX !== null && x < (currentLine.lastStartX - (colThreshold * 0.5));
          const previousText = String(currentLine.items[currentLine.items.length - 1]?.str || '');
          const isDotTokenStart = itemText === '.' && /[-–—]$/.test(previousText);
          const shouldAttachAfterDot = !currentLine.pendingWordSep
            && /\.$/.test(previousText)
            && /^[A-Z0-9]/.test(itemText);
          const shouldMergeTinyGap = !currentLine.pendingWordSep
            && /[A-Za-z0-9]$/.test(previousText)
            && /^[A-Za-z0-9]/.test(itemText)
            && endGap <= tinyGapThreshold;
          // Merge compound-word hyphens: e.g. "one" + "-step" or "one-" + "step".
          // Only when no explicit spacer was emitted, the gap is tight (< 2 pt — much less
          // than a typical word space), and at least one adjacent character is a letter so
          // we don't accidentally join digit-hyphen-digit date ranges like "2020-2021".
          const shouldMergeAroundHyphen = !currentLine.pendingWordSep
            && endGap < 2.0
            && ((/[A-Za-z]$/.test(previousText) && /^-/.test(itemText))
                || ((previousText === '-' || /[A-Za-z0-9]-$/.test(previousText)) && /^[A-Za-z]/.test(itemText)));
          // A large start-to-start gap only indicates a true column jump when the
          // end-to-start gap is also large.  If the items are physically adjacent
          // (endGap ≈ 0) the previous item was simply a long text run — e.g. a full
          // bullet-point line ending with a compound-word hyphen — and the next item
          // continues on the same visual word.  Without this guard, long body-text
          // items (x=39 → x=312) would cause the "-" in "one-step" to be flagged as
          // a column separator and receive a '\t' prefix instead of no prefix.
          const isColumnJump = currentLine.pendingColumnSep
            || movedBackwardAcrossColumns
            || (startGap > colThreshold && endGap > colThreshold * 0.1);
          let prefix;
          if (isColumnJump) {
            prefix = '\t';          // wide spacer flag or large positional jump = column
          } else if (isDotTokenStart) {
            prefix = ' ';           // keep the space before token starters like ".NET" after a dash
          } else if (currentLine.pendingWordSep) {
            prefix = ' ';           // explicit narrow whitespace in the PDF
          } else if (endGap < 0 || shouldMergeTinyGap || shouldAttachAfterDot || shouldMergeAroundHyphen) {
            prefix = '';            // overlapping/tiny-gap items stay in the same word
          } else {
            prefix = ' ';           // normal inter-word space
          }
          currentLine.pendingColumnSep = false;
          currentLine.pendingWordSep = false;
          currentLine.parts.push(prefix + itemText);
          currentLine.items.push(this._createLineItem(item, x, endX, itemText));
          currentLine.y = y;
          currentLine.lastEndX = endX;
          currentLine.lastStartX = x;
        }
      }

      this._flushExtractedLine(lines, currentLine, pageNum);

      fullText += lines.join("\n") + "\n\n";
    }

    return fullText.trim();
  },

  _sanitizeExtractedTextFragment(value) {
    return String(value || '')
      .replace(/[\u200b-\u200d\u2060\ufeff]/g, '')
      .replace(/\u00ad/g, '')
      .replace(/[\u00a0\u2000-\u200a\u202f\u205f\u3000]/g, ' ');
  },

  _createLineItem(item, x, endX, itemText) {
    const transform = item.transform || [];
    const size = Math.max(Math.abs(transform[0] || 0), Math.abs(transform[3] || 0), 0);
    return {
      str: typeof itemText === 'string' ? itemText : this._sanitizeExtractedTextFragment(item.str),
      fontName: item.fontName || "",
      x,
      endX,
      width: item.width || 0,
      size,
    };
  },

  _flushExtractedLine(lines, currentLine, pageNum) {
    if (!currentLine || !currentLine.parts || currentLine.parts.length === 0) return;
    const text = this._repairSuspiciousWordSpacing(currentLine.parts.join('')
      .replace(/ {2,}/g, ' ')
      .replace(/[ \u00a0\u2000-\u200a\u202f\u205f\u3000]+([,;:!?])/g, '$1')
      .replace(/[ \u00a0\u2000-\u200a\u202f\u205f\u3000]+\.(?=$|[\s)\]},"'])/g, '.')
      .trim());
    if (!text) return;
    lines.push(text);
    this.structuredLines.push({
      pageNum,
      y: currentLine.y,
      text,
      items: (currentLine.items || []).slice(),
      startsBullet: /^[•·▪\-–*]\s*/.test(text),
    });
  },

  /**
   * Parse resume text to JSON Resume format
   */
  _parseResumeText(text) {
    // Clean and normalize text (tabs are preserved by _cleanText as column markers)
    const cleanedText = this._cleanText(text);
    const structuredSections = this._identifyStructuredSections();

    // Identify sections up front so header parsing can stop at the first actual
    // section boundary instead of relying on a simpler standalone-heading regex.
    const sections = structuredSections?.map
      ? structuredSections.map
      : this._identifySections(cleanedText);

    // Parse the header block (everything before the first section heading) into
    // structured basics. This captures all contact items regardless of layout.
    const basics = this._extractBasics(cleanedText);

    const experienceSection = structuredSections?.byKey?.experience || null;
    const educationSection = structuredSections?.byKey?.education || null;
    const skillsSection = structuredSections?.byKey?.skills || null;
    const projectsSection = structuredSections?.byKey?.projects || null;
    const awardsSection = structuredSections?.byKey?.awards || null;
    const languagesSection = structuredSections?.byKey?.languages || null;
    const interestsSection = structuredSections?.byKey?.interests || null;
    const volunteerSection = structuredSections?.byKey?.volunteer || null;
    const certificationsSection = structuredSections?.byKey?.certifications || null;
    const researchSection = structuredSections?.ordered?.find((section) => section.key === "research_experience") || null;

    const experienceText = this._removeRepeatedHeaderLines(sections.experience || sections.work || "", basics.name);
    const educationText = this._removeRepeatedHeaderLines(sections.education || "", basics.name);
    const skillsText = this._removeRepeatedHeaderLines(sections.skills || sections["technical skills"] || "", basics.name);
    const projectsText = this._removeRepeatedHeaderLines(sections.projects || "", basics.name);

    const customSections = [];
    if (awardsSection) {
      customSections.push(this._buildCustomSection(awardsSection, "main"));
    }

    const orderedKeys = structuredSections?.ordered?.map((section) => section.key) || [];
    const workEntries = experienceSection ? this._parseWorkExperienceFromLines(experienceSection.lines) : this._parseWorkExperience(experienceText);
    if (researchSection) {
      workEntries.push(...this._parseResearchExperienceFromLines(researchSection.lines, structuredSections.bodyFont));
    }

    return {
      basics: {
        ...basics,
        summary: (structuredSections?.byKey?.summary?.text || sections.summary || sections.about || "").trim(),
      },
      work: workEntries,
      education: educationSection ? this._parseEducationFromLines(educationSection.lines) : this._parseEducation(educationText),
      skills: skillsSection ? this._parseSkillsFromLines(skillsSection.lines) : this._parseSkills(skillsText),
      projects: this._parseProjects(projectsText),
      certificates: this._parseSimpleList(certificationsSection?.text || sections.certifications || ""),
      awards: this._parseSimpleList(awardsSection?.text || sections.awards || ""),
      volunteer: this._parseSimpleList(volunteerSection?.text || sections.volunteer || ""),
      languages: this._parseSimpleList(languagesSection?.text || sections.languages || ""),
      interests: this._parseSimpleList(interestsSection?.text || sections.interests || ""),
      customSections,
      meta: {
        sectionOrder: orderedKeys,
        skillsPlacement: "side",
      },
    };
  },

  _identifyStructuredSections() {
    const lines = Array.isArray(this.structuredLines) ? this.structuredLines.filter((line) => line && line.text) : [];
    if (!lines.length) return null;

    const bodyFont = this._getBodyFontName(lines);
    const typicalGap = this._getTypicalLineGap(lines);
    let headingIndices = [];

    for (let i = 0; i < lines.length; i++) {
      if (this._isStructuredSectionHeading(lines, i, bodyFont, typicalGap)) {
        headingIndices.push(i);
      }
    }

    if (headingIndices.length < 2) {
      headingIndices = this._findFallbackStructuredHeadingIndices(lines, bodyFont, typicalGap);
    }

    if (headingIndices.length < 2) return null;

    return this._buildStructuredSectionsResult(lines, headingIndices, bodyFont);
  },

  _buildStructuredSectionsResult(lines, headingIndices, bodyFont) {
    const uniqueIndices = [...new Set((headingIndices || []).filter((index) => index >= 0 && index < lines.length))].sort((a, b) => a - b);
    if (uniqueIndices.length < 2) return null;

    const ordered = [];
    const byKey = {};

    for (let i = 0; i < uniqueIndices.length; i++) {
      const headingIndex = uniqueIndices[i];
      const nextHeadingIndex = i + 1 < uniqueIndices.length ? uniqueIndices[i + 1] : lines.length;
      const title = lines[headingIndex].text.trim();
      const key = this._normalizeStructuredSectionKey(title);
      const sectionLines = lines.slice(headingIndex + 1, nextHeadingIndex);
      const text = sectionLines.map((line) => line.text).join("\n").trim();
      const section = { title, key, lines: sectionLines, text };
      ordered.push(section);
      if (!byKey[key]) byKey[key] = section;
    }

    const summaryIndex = ordered.findIndex((section) => section.key === "summary");
    const skillsIndex = ordered.findIndex((section) => section.key === "skills");
    const experienceIndex = ordered.findIndex((section) => section.key === "experience");

    return {
      ordered,
      byKey,
      map: Object.fromEntries(ordered.map((section) => [section.key, section.text])),
      skillsPlacement: skillsIndex >= 0 && experienceIndex >= 0 && skillsIndex < experienceIndex ? "main" : "side",
      bodyFont,
      summaryIndex,
    };
  },

  _findFallbackStructuredHeadingIndices(lines, bodyFont, typicalGap) {
    const seedIndices = [];
    const seedPattern = /^(?:experience|work experience|education|skills|technical skills)$/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];
      const text = String(line?.text || "").trim();
      if (!seedPattern.test(text)) continue;
      if (!nextLine || nextLine.pageNum !== line.pageNum || !String(nextLine.text || "").trim()) continue;
      if (line.startsBullet) continue;
      if (!this._isVisuallyLargerThanBody(line, bodyFont)) continue;
      seedIndices.push(i);
    }

    if (!seedIndices.length) return [];

    const seedSignatures = seedIndices.map((index) => this._getLineStyleSignature(lines[index]));
    const matchedIndices = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const text = String(line?.text || "").trim();
      if (!text || line.startsBullet || text.length > 80) continue;
      if (!this._isLikelySectionName(text)) continue;

      const lineSignature = this._getLineStyleSignature(line);
      const matchesSeedStyle = seedSignatures.some((seedSignature) => this._isSimilarSectionSignature(lineSignature, seedSignature));
      if (!matchesSeedStyle) continue;

      const nextLine = lines[i + 1];
      const nextGap = nextLine && nextLine.pageNum === line.pageNum ? (line.y || 0) - (nextLine.y || 0) : typicalGap;
      if (nextLine && nextGap < typicalGap * 0.75) continue;
      matchedIndices.push(i);
    }

    return matchedIndices;
  },

  _getLineStyleSignature(line) {
    const items = (line?.items || []).filter((item) => String(item.str || "").trim());
    const fontCounts = new Map();
    let maxSize = 0;
    for (const item of items) {
      const cleaned = String(item.str || "").replace(/[^A-Za-z0-9]/g, "");
      fontCounts.set(item.fontName, (fontCounts.get(item.fontName) || 0) + Math.max(cleaned.length, 1));
      maxSize = Math.max(maxSize, Number(item.size) || 0);
    }
    let primaryFont = "";
    let primaryCount = -1;
    for (const [fontName, count] of fontCounts.entries()) {
      if (count > primaryCount) {
        primaryFont = fontName;
        primaryCount = count;
      }
    }
    return { primaryFont, maxSize };
  },

  _isSimilarSectionSignature(a, b) {
    if (!a || !b) return false;
    if (!a.primaryFont || !b.primaryFont) return false;
    return a.primaryFont === b.primaryFont && Math.abs((a.maxSize || 0) - (b.maxSize || 0)) <= 0.75;
  },

  _isVisuallyLargerThanBody(line, bodyFont) {
    const signature = this._getLineStyleSignature(line);
    const bodyItems = (line?.items || []).filter((item) => String(item.str || "").trim() && item.fontName === bodyFont);
    const bodySizeOnLine = bodyItems.reduce((max, item) => Math.max(max, Number(item.size) || 0), 0);
    return (signature.maxSize || 0) >= Math.max(bodySizeOnLine + 0.5, 11);
  },

  _isLikelySectionName(text) {
    return /^(?:summary|professional summary|career summary|profile|objective|overview|technical skills|skills|core competencies|competencies|expertise|technologies|key skills|work experience|professional experience|experience|employment history|work history|research experience|education|academic background|qualifications|honors and awards|awards|honors|achievements|projects|portfolio|certifications|certificates|credentials|languages|volunteer|volunteer experience|community involvement|interests|activities|hobbies)$/i.test(String(text || "").trim());
  },

  _getBodyFontName(lines) {
    const counts = new Map();
    for (const line of lines) {
      for (const item of line.items || []) {
        const cleaned = String(item.str || "").replace(/[^A-Za-z0-9]/g, "");
        if (!cleaned) continue;
        counts.set(item.fontName, (counts.get(item.fontName) || 0) + cleaned.length);
      }
    }
    let bestFont = "";
    let bestCount = -1;
    for (const [fontName, count] of counts.entries()) {
      if (count > bestCount) {
        bestFont = fontName;
        bestCount = count;
      }
    }
    return bestFont;
  },

  _getTypicalLineGap(lines) {
    const gaps = [];
    for (let i = 0; i < lines.length - 1; i++) {
      if (lines[i].pageNum !== lines[i + 1].pageNum) continue;
      const gap = (lines[i].y || 0) - (lines[i + 1].y || 0);
      if (gap > 0) gaps.push(gap);
    }
    if (!gaps.length) return 12;
    gaps.sort((a, b) => a - b);
    return gaps[Math.floor(gaps.length / 2)] || 12;
  },

  _isStructuredSectionHeading(lines, index, bodyFont, typicalGap) {
    const line = lines[index];
    const nextLine = lines[index + 1];
    const text = String(line?.text || "").trim();
    if (!text || line.startsBullet || text.length > 80) return false;

    const alphaChars = (text.match(/[A-Za-z]/g) || []).length;
    const upperChars = (text.match(/[A-Z]/g) || []).length;
    const isMostlyUpper = alphaChars >= 4 && upperChars / Math.max(alphaChars, 1) > 0.85;
    const nonWhitespaceItems = (line.items || []).filter((item) => String(item.str || "").trim());
    const fontNames = [...new Set(nonWhitespaceItems.map((item) => item.fontName).filter(Boolean))];
    const usesOnlyNonBodyFont = fontNames.length === 1 && fontNames[0] !== bodyFont;
    const nextGap = nextLine && nextLine.pageNum === line.pageNum ? (line.y || 0) - (nextLine.y || 0) : typicalGap;
    const isKnownHeading = /^(?:summary|technical skills|skills|work experience|experience|professional experience|research experience|education|honors and awards|awards|projects|languages|certifications|volunteer|interests)$/i.test(text);

    return isKnownHeading || (
      isMostlyUpper
      && nextGap >= typicalGap * 1.2
    );
  },

  _normalizeStructuredSectionKey(title) {
    const normalized = String(title || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (/^(?:summary|professional summary|career summary|profile|objective|overview)$/.test(normalized)) return "summary";
    if (/^(?:technical skills|skills|core competencies|competencies|expertise|technologies|key skills)$/.test(normalized)) return "skills";
    if (/^(?:work experience|professional experience|experience|employment history|work history)$/.test(normalized)) return "experience";
    if (/^research experience$/.test(normalized)) return "research_experience";
    if (/^(?:education|academic background|qualifications)$/.test(normalized)) return "education";
    if (/^(?:honors and awards|awards|honors|achievements)$/.test(normalized)) return "awards";
    if (/^(?:projects|portfolio)$/.test(normalized)) return "projects";
    if (/^(?:certifications|certificates|credentials)$/.test(normalized)) return "certifications";
    if (/^languages$/.test(normalized)) return "languages";
    if (/^(?:volunteer|volunteer experience|community involvement)$/.test(normalized)) return "volunteer";
    if (/^(?:interests|activities|hobbies)$/.test(normalized)) return "interests";
    return normalized.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "section";
  },

  _buildCustomSection(section, placement) {
    return {
      key: section.key,
      title: this._titleCaseSectionTitle(section.title),
      placement: placement || "main",
      lines: (section.lines || []).map((line) => line.text),
      bullets: (section.lines || [])
        .map((line) => String(line.text || "").replace(/^[•·▪\-–*]\s*/, "").trim())
        .filter((line, index) => (section.lines[index]?.startsBullet && line)),
      text: section.text || "",
    };
  },

  _titleCaseSectionTitle(title) {
    return String(title || "")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
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
    // --- 1. Isolate header block using the same section marker logic as the main parser ---
    const firstSectionStart = this._getSectionMarkers(text)[0]?.startChar;
    const headerText = typeof firstSectionStart === "number"
      ? text.substring(0, firstSectionStart)
      : text.substring(0, 800);

    // --- 2. Collect pieces: split each line on tab and pipe ---
    const pieces = [];
    for (const line of headerText.split('\n')) {
      const trimmed = this._normalizeHeaderLineText(line).trim();
      if (!trimmed) continue;
      for (const piece of trimmed.split(/\t|\s*\|\s*| {3,}/)) {
        const p = piece.trim();
        if (p) pieces.push(p);
      }
    }

    const normalizedPieces = this._mergeBrokenHeaderPieces(pieces);

    if (!normalizedPieces.length) {
      return { name: 'Resume', label: '', email: '', phone: '', url: '', location: '', profiles: [] };
    }

    // --- 3. Name = first piece (may contain pipe/bullet separators before tab) ---
    let name = normalizedPieces[0].split(/\s*[•·]\s*/)[0].trim() || 'Resume';
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

    for (const piece of normalizedPieces.slice(1)) {
      let remainder = piece;
      if (this._looksLikeSectionLeak(piece)) {
        continue;
      }
      // Email
      const emailMatch = remainder.match(emailRe);
      if (emailMatch) {
        if (!email) email = emailMatch[0];
        remainder = remainder.replace(emailMatch[0], ' ').replace(/\s+/g, ' ').trim();
      }
      // Phone — collect all, not just first
      const phoneMatch = remainder.match(phoneRe);
      if (phoneMatch && /\d{7,}/.test(remainder.replace(/\D/g, ''))) {
        phones.push(this._normalizePhoneString(phoneMatch[0]));
        remainder = remainder.replace(phoneMatch[0], ' ').replace(/\s+/g, ' ').trim();
      }
      // URL
      const normalizedUrlPiece = this._normalizeUrlLikeString(remainder);
      if (knownDomainRe.test(normalizedUrlPiece) || looksLikeUrlRe.test(normalizedUrlPiece)) {
        const fullUrl = /^https?:\/\//i.test(normalizedUrlPiece)
          ? normalizedUrlPiece
          : 'https://' + normalizedUrlPiece.replace(/^www\./i, '');
        if (!url) {
          url = fullUrl;
        } else {
          // Derive a human-readable network name from the domain
          const domainMatch = normalizedUrlPiece.replace(/^https?:\/\//i, '').match(/^(?:www\.)?([^./]+)/);
          const network = domainMatch ? domainMatch[1] : normalizedUrlPiece;
          profiles.push({ network, url: fullUrl });
        }
        continue;
      }
      // Location
      if (locationRe.test(remainder)) {
        if (!location) location = remainder;
        continue;
      }
      // First unrecognized piece → job label/title
      if (!label && remainder) {
        label = remainder;
        continue;
      }
      // Everything else: display as extra contact item in top-side
      if (remainder) {
        profiles.push({ network: '', url: '', display: remainder });
      }
    }

    return { name, label, email, phone: phones[0] || '', phones, url, location, profiles };
  },

  _mergeBrokenHeaderPieces(pieces) {
    const normalized = [];
    const sourcePieces = Array.isArray(pieces) ? pieces.slice() : [];
    const phonePrefixRe = /^(?:\+?1[\s.-]*)?\(?\d{3}\)?[\s.-]*\d{3}$/;
    const phoneSuffixRe = /^[-.\s]*\d{4}$/;

    for (let i = 0; i < sourcePieces.length; i++) {
      const current = String(sourcePieces[i] || '').trim();
      const next = String(sourcePieces[i + 1] || '').trim();
      if (current && next && phonePrefixRe.test(current) && phoneSuffixRe.test(next)) {
        const merged = this._normalizePhoneString(`${current} ${next}`);
        normalized.push(merged);
        this.parseWarnings.push({
          type: 'split-phone',
          message: `Phone number was split across header fields as "${current}" and "${next}".`,
          fix: `Use a single phone string such as "${merged}" in the source document.`,
        });
        i += 1;
        continue;
      }
      normalized.push(current);
    }

    return normalized.filter(Boolean);
  },

  _normalizeHeaderLineText(value) {
    const gapRe = "[\\s\\u00a0\\u2000-\\u200b\\u202f\\u205f\\u3000]*";
    return this._normalizeDomainLikeText(String(value || "")
      .replace(/[ \u00a0\u2000-\u200b\u202f\u205f\u3000]+/g, " ")
      // Repair phone numbers before header token splitting.
      .replace(new RegExp(`((?:\\+?1[\\s.-]*)?\\(?\\d{3}\\)?[\\s.-]*\\d{3})${gapRe}-${gapRe}(\\d{4})\\b`, "g"), (_m, prefix, suffix) => `${this._normalizePhoneString(prefix)}-${suffix}`)
      // Repair URL slugs/usernames split around hyphens before token splitting.
      .replace(new RegExp(`((?:https?:\\/\\/)?(?:www\\.)?(?:linkedin\\.com|github\\.com|gitlab\\.com|twitter\\.com|x\\.com)\\/[^\\s|]*)${gapRe}-${gapRe}([A-Za-z0-9][^\\s|]*)`, "gi"), '$1-$2')
      .trim());
  },

  _normalizeUrlLikeString(value) {
    return this._normalizeDomainLikeText(String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\s*-\s*/g, "-")
      .trim());
  },

  _isLikelyDomainToken(rawValue, normalizedValue) {
    const commonDomainTlds = new Set([
      'ai', 'app', 'biz', 'ca', 'cloud', 'co', 'com', 'consulting', 'design', 'dev', 'digital',
      'edu', 'email', 'fm', 'gov', 'info', 'io', 'live', 'ly', 'me', 'media', 'net', 'online',
      'org', 'site', 'solutions', 'studio', 'systems', 'tech', 'tv', 'uk', 'us', 'xyz'
    ]);
    const raw = String(rawValue || '').trim();
    const normalized = String(normalizedValue || rawValue || '').trim();
    const host = normalized
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0];
    const dotCount = (host.match(/\./g) || []).length;
    const hasSpacedDot = /\s*\.\s+|\s+\.\s*/.test(raw);
    const rawTld = raw.replace(/\/.*$/, '').replace(/^.*\.\s*/, '').trim();

    if (dotCount < 1 || dotCount > 3) return false;
    if (/^(?:\+?1[\s.-]*)?(?:\(?\d{3}\)?[\s.-]*){2}\d{4}$/.test(host)) return false;
    if (!/[A-Za-z]/.test(host)) return false;
    if (hasSpacedDot) {
      if (!/^[a-z]{2,12}$/.test(rawTld)) return false;
      if (!commonDomainTlds.has(rawTld)) return false;
    }
    return true;
  },

  _normalizeDomainLikeText(value) {
    return String(value || "").replace(
      /\b((?:https?:\/\/)?(?:www\.)?(?:[A-Za-z0-9-]+\s*\.\s*){1,3}[A-Za-z]{2,24}(?:\/[^\s|]*)?)/g,
      (match) => {
        const normalized = match.replace(/\s*\.\s*/g, '.').replace(/\s*\/\s*/g, '/').trim();
        if (!this._isLikelyDomainToken(match, normalized)) return match;
        return normalized;
      }
    );
  },

  _normalizePhoneString(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    return String(value || '').replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-').trim();
  },

  /**
   * Clean and normalize text
   */
  _cleanText(text) {
    return this._repairSuspiciousWordSpacing(text
      .replace(/[\u200b-\u200d\u2060\ufeff]/g, '')
      .replace(/\u00ad/g, '')
      .replace(/\b((?:19|20))[\s\u00a0\u2000-\u200d\u202f\u205f\u3000\ufeff]+(\d{2})\b/g, '$1$2')
      .replace(/[ \u00a0\u2000-\u200a\u202f\u205f\u3000]+/g, " ")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .replace(/[ \u00a0\u2000-\u200a\u202f\u205f\u3000]+([,;:!?])/g, "$1")
      .replace(/[ \u00a0\u2000-\u200a\u202f\u205f\u3000]+\.(?=$|[\s)\]},"'])/g, ".")
      .trim());
  },

  _repairSuspiciousWordSpacing(text) {
    return String(text || '')
      // Repair split plural/suffix endings like "timeline s".
      .replace(/\b([A-Za-z]{3,})\s+([a-z])\b/g, '$1$2')
      // Repair split leading capitals inside comma-separated/location-style lists like "Grant Park".
      .replace(/([,;/(\[]\s*)([A-Z])\s+([a-z]{3,})\b/g, '$1$2$3');
  },

  /**
   * Identify resume sections by scanning line-by-line for known headings.
   * Handles many common variations; first occurrence of each section wins.
   */
  _identifySections(text) {
    const sections = {};
    const markers = this._getSectionMarkers(text);

    for (let i = 0; i < markers.length; i++) {
      const contentStart = markers[i].contentStartChar;
      const contentEnd = i + 1 < markers.length ? markers[i + 1].startChar : text.length;
      const content = text.substring(contentStart, contentEnd).trim();
      if (!content) continue;
      if (!sections[markers[i].name]) {
        sections[markers[i].name] = content;
      } else {
        sections[markers[i].name] = `${sections[markers[i].name]}\n\n${content}`.trim();
      }
    }

    return sections;
  },

  _getSectionDefinitions() {
    return [
      { name: "summary",        re: /^(?:summary|professional\s+summary|career\s+summary|profile|objective|about(?:\s+me)?|overview)\b/i },
      { name: "experience",     re: /^(?:experience|work\s+experience|professional\s+experience|work\s+history|employment(?:\s+history)?|professional\s+background|career(?:\s+history)?)\b/i },
      { name: "education",      re: /^(?:education(?:al\s+background)?|academic(?:\s+background)?|qualifications?)\b/i },
      { name: "skills",         re: /^(?:skills|technical\s+skills|core\s+competencies|competencies|expertise|technologies|key\s+skills|tools(?:\s+[&+]\s+technologies)?)\b/i },
      { name: "projects",       re: /^(?:projects?|portfolio|personal\s+projects?|key\s+projects?|notable\s+projects?|selected\s+projects?)\b/i },
      { name: "certifications", re: /^(?:certifications?|certificates?|licenses?(?:\s+[&+]\s+certifications?)?|credentials?)\b/i },
      { name: "awards",         re: /^(?:awards?(?:\s+[&+]\s+(?:honors?|achievements?))?|honors?|achievements?|recognition)\b/i },
      { name: "volunteer",      re: /^(?:volunteer(?:ing|(?:\s+experience))?|community(?:\s+involvement)?|civic\s+involvement)\b/i },
      { name: "languages",      re: /^(?:languages?(?:\s+[&+]\s+tools?)?)\b/i },
      { name: "interests",      re: /^(?:interests?|hobbies|activities)\b/i },
    ];
  },

  _getSectionMarkers(text) {
    const sectionMap = this._getSectionDefinitions();
    const lines = String(text || "").split("\n");
    const markers = [];
    let charOffset = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      const lineEnd = charOffset + line.length + 1;

      if (trimmed.length > 0 && trimmed.length <= 120) {
        const headerMatch = this._matchSectionHeader(trimmed, sectionMap);
        if (headerMatch) {
          markers.push({
            name: headerMatch.name,
            startChar: charOffset,
            contentStartChar: charOffset + headerMatch.contentStartOffset,
          });
        }
      }

      charOffset = lineEnd;
    }

    return markers;
  },

  _matchSectionHeader(line, sectionMap) {
    const trimmed = String(line || "").trim();
    if (!trimmed) return null;

    for (const { name, re } of sectionMap) {
      const match = trimmed.match(re);
      if (!match) continue;

      const headerText = match[0].trim();
      let remainder = trimmed.slice(match[0].length);
      const separatorMatch = remainder.match(/^\s*[:|\-–—]\s*/);
      const hasSeparator = !!separatorMatch;
      if (separatorMatch) {
        remainder = remainder.slice(separatorMatch[0].length);
      }
      remainder = remainder.trim();

      const isExactHeading = remainder.length === 0;
      const isAllCapsHeading = headerText === headerText.toUpperCase();
      const looksLikeInlineSection = remainder.length > 0 && (
        hasSeparator ||
        (name === "summary" && isAllCapsHeading) ||
        (name === "skills" && isAllCapsHeading && /(?:[:;,\-|]| [A-Z][A-Za-z0-9&+/.() ]{0,30}\s+-\s+)/.test(remainder))
      );

      if (isExactHeading || looksLikeInlineSection) {
        return {
          name,
          contentStartOffset: isExactHeading
            ? line.length
            : (line.indexOf(remainder) >= 0 ? line.indexOf(remainder) : line.length),
        };
      }
    }

    return null;
  },

  _looksLikeSectionLeak(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) return false;
    if (trimmed.length > 160) return true;
    return !!this._matchSectionHeader(trimmed, this._getSectionDefinitions());
  },

  _extractTrailingDateRange(text) {
    const headerSource = String(text || "")
      .replace(/\t+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b((?:19|20))[\s\u00a0\u2000-\u200d\u202f\u205f\u3000\ufeff]+(\d{2})\b/g, '$1$2')
      .trim();
    const normalized = headerSource
      .replace(/\t+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[–—]/g, "-")
      .trim();
    const monthToken = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?" ;
    const monthYear = `(?:${monthToken}\\s+\\d{4})`;
    const monthOnly = `(?:${monthToken})`;
    const yearOnly = "\\d{4}";
    const startToken = `(?:${monthYear}|${yearOnly}|${monthOnly})`;
    const endToken = `(?:${monthYear}|${yearOnly}|Present|Current)`;
    const dateRangeRe = new RegExp(`(${startToken}\\s*(?:-|to)\\s*${endToken})$`, "i");
    const match = normalized.match(dateRangeRe);
    if (!match) return null;
    const rangeText = match[1].trim();
    const cleanedRange = rangeText.replace(/[–—]/g, "-").replace(/\bto\b/i, "-");
    const parts = cleanedRange.split(/\s*-\s*/);
    return {
      full: rangeText,
      headerText: headerSource.slice(0, match.index).trim().replace(/[,\s]+$/, ""),
      startDate: (parts[0] || "").trim(),
      endDate: /present|current/i.test(parts[1] || "") ? "" : (parts[1] || "").trim(),
    };
  },

  _extractLeadingDateRange(text) {
    const headerSource = String(text || "")
      .replace(/\t+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b((?:19|20))[\s\u00a0\u2000-\u200d\u202f\u205f\u3000\ufeff]+(\d{2})\b/g, '$1$2')
      .trim();
    const normalized = headerSource
      .replace(/\t+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[–—]/g, "-")
      .trim();
    const monthToken = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?" ;
    const monthYear = `(?:${monthToken}\\s+\\d{4})`;
    const yearOnly = "\\d{4}";
    const startToken = `(?:${monthYear}|${yearOnly})`;
    const endToken = `(?:${monthYear}|${yearOnly}|Present|Current)`;
    const dateRangeRe = new RegExp(`^(${startToken}\\s*(?:-|to)\\s*${endToken})\\b\\s*(.*)$`, "i");
    const match = normalized.match(dateRangeRe);
    if (!match) return null;
    const cleanedRange = match[1].replace(/[–—]/g, "-").replace(/\bto\b/i, "-");
    const parts = cleanedRange.split(/\s*-\s*/);
    return {
      full: match[1].trim(),
      headerText: headerSource.slice(match[1].length).trim().replace(/^[,\s]+|[,\s]+$/g, ""),
      startDate: (parts[0] || "").trim(),
      endDate: /present|current/i.test(parts[1] || "") ? "" : (parts[1] || "").trim(),
    };
  },

  _splitHeaderText(headerText) {
    const normalized = String(headerText || "").trim().replace(/\s+/g, " ");
    if (!normalized) return { company: "", position: "" };
    const commaIndex = normalized.indexOf(",");
    const companySuffixRe = /,\s*(?:Inc\.?|LLC|Ltd\.?|Corp\.?|Co\.?)\b/i;
    if (companySuffixRe.test(normalized)) {
      return { company: "", position: normalized };
    }
    if (commaIndex > 0) {
      const firstPart = normalized.slice(0, commaIndex).trim();
      const remainder = normalized.slice(commaIndex + 1).trim();
      const roleFirstRe = /\b(?:assistant|engineer|developer|manager|analyst|scientist|author|researcher|consultant|designer|intern|lead|director|coordinator|specialist)\b/i;
      if (roleFirstRe.test(firstPart) && remainder) {
        return {
          company: remainder,
          position: firstPart,
        };
      }
      return {
        company: firstPart,
        position: remainder,
      };
    }
    return { company: "", position: normalized };
  },

  _parseWorkExperienceFromLines(lines) {
    const entries = [];
    const sourceLines = (lines || []).map((line) => ({ ...line, text: String(line.text || "").trim() })).filter((line) => line.text);
    if (!sourceLines.length) return entries;

    let current = null;
    const flush = () => {
      if (!current) return;
      current.highlights = current.highlights.filter(Boolean);
      current.summary = String(current.summary || "").trim();
      if (current.position || current.company || current.startDate || current.summary || current.highlights.length) {
        entries.push(current);
      }
      current = null;
    };

    for (const line of sourceLines) {
      const dateMatch = this._extractTrailingDateRange(line.text) || this._extractLeadingDateRange(line.text);
      if (!line.startsBullet && dateMatch) {
        flush();
        const headerParts = this._splitHeaderText(dateMatch.headerText);
        current = {
          position: headerParts.position,
          company: headerParts.company,
          startDate: dateMatch.startDate,
          endDate: dateMatch.endDate,
          summary: "",
          highlights: [],
        };
        continue;
      }

      if (!current) {
        current = { position: "", company: "", startDate: "", endDate: "", summary: "", highlights: [] };
      }

      const cleanText = line.text.replace(/^[•·▪\-–*]\s*/, "").trim();
      if (!cleanText) continue;

      if (line.startsBullet) {
        current.highlights.push(cleanText);
      } else if (!current.position) {
        current.position = cleanText;
      } else if (current.highlights.length) {
        current.highlights[current.highlights.length - 1] = `${current.highlights[current.highlights.length - 1]} ${cleanText}`.trim();
      } else {
        current.summary = `${current.summary ? `${current.summary} ` : ""}${cleanText}`.trim();
      }
    }

    flush();
    return entries;
  },

  _parseEducationFromLines(lines) {
    const entries = [];
    const sourceLines = (lines || []).map((line) => ({ ...line, text: String(line.text || "").trim() })).filter((line) => line.text);
    if (!sourceLines.length) return entries;

    let current = null;
    const flush = () => {
      if (!current || !current.institution) return;
      current.studyType = current.studyType || this._extractEducationStudyType(current.details.join(" "));
      current.area = current.area || this._extractEducationArea(current.details, current.details.join(" "));
      delete current.details;
      entries.push(current);
      current = null;
    };

    for (const line of sourceLines) {
      if (this._isEducationNoiseLine(line.text)) {
        continue;
      }

      const dateMatch = !line.startsBullet ? this._extractTrailingDateRange(line.text) : null;
      if (dateMatch) {
        flush();
        current = {
          institution: dateMatch.headerText,
          studyType: "",
          area: "",
          startDate: dateMatch.startDate,
          endDate: dateMatch.endDate,
          details: [],
        };
        continue;
      }

      if (this._looksLikeInstitutionLine(line.text)) {
        flush();
        current = {
          institution: line.text,
          studyType: "",
          area: "",
          startDate: "",
          endDate: "",
          details: [],
        };
        continue;
      }

      if (!current) continue;

      current.details.push(line.text);
      if (!current.studyType) {
        current.studyType = this._extractEducationStudyType(line.text);
      }
      if (!current.area) {
        current.area = this._extractEducationArea([line.text], line.text);
      }
    }

    flush();
    return entries;
  },

  _parseSkillsFromLines(lines) {
    const skills = [];
    const sourceLines = (lines || []).map((line) => ({ ...line, text: String(line.text || "").trim() })).filter((line) => line.text);
    if (!sourceLines.length) return skills;

    const ensureCurrent = (name = "") => {
      if (!skills.length || skills[skills.length - 1].name !== name && (skills[skills.length - 1].keywords || []).length > 0) {
        skills.push({ name, keywords: [] });
      } else if (!skills.length) {
        skills.push({ name, keywords: [] });
      }
      return skills[skills.length - 1];
    };

    for (const line of sourceLines) {
      const cleanText = line.text.replace(/^[•·▪\-–*]\s*/, "").trim();
      if (!cleanText) continue;

      if (this._looksLikeSkillSubsectionHeading(cleanText)) {
        skills.push({ name: cleanText, keywords: [] });
        continue;
      }

      const dashMatch = cleanText.match(/^(.+?)\s*[-–—:]\s*(.+)$/);
      if (dashMatch) {
        skills.push({
          name: dashMatch[1].trim(),
          keywords: this._splitSkillKeywords(dashMatch[2]),
        });
        continue;
      }

      const keywords = this._splitSkillKeywords(cleanText);
      if (keywords.length) {
        const current = ensureCurrent(skills.length ? skills[skills.length - 1].name : "");
        current.keywords = this._dedupePreserveOrder([
          ...(current.keywords || []),
          ...keywords,
        ]);
      }
    }

    return skills.filter((skill) => (skill.keywords || []).length > 0 || skill.name);
  },

  _looksLikeSkillSubsectionHeading(text) {
    const normalized = String(text || "").trim();
    if (!normalized || normalized.length > 60) return false;
    if (/[,:.;]/.test(normalized)) return false;
    if (/^[•·▪\-–*]/.test(normalized)) return false;
    return this._looksLikeSkillCategory(normalized);
  },

  _parseResearchExperienceFromLines(lines, bodyFont = "") {
    const entries = [];
    const sourceLines = (lines || []).map((line) => ({ ...line, text: String(line.text || "").trim() })).filter((line) => line.text);
    if (!sourceLines.length) return entries;

    let current = null;
    let pendingHeadline = "";

    const flush = () => {
      if (!current) return;
      current.highlights = (current.highlights || []).filter(Boolean);
      current.summary = String(current.summary || "").trim();
      if (current.position || current.company || current.startDate || current.summary || current.highlights.length) {
        entries.push(current);
      }
      current = null;
    };

    const startEntry = (headerText, dateMatch = null) => {
      flush();
      const headerParts = this._splitHeaderText(headerText);
      current = {
        position: headerParts.position,
        company: headerParts.company,
        startDate: dateMatch?.startDate || "",
        endDate: dateMatch?.endDate || "",
        summary: "",
        highlights: [],
      };
      if (pendingHeadline) {
        current.summary = pendingHeadline;
        pendingHeadline = "";
      }
    };

    // Returns true if the line's primary font differs from the body font, indicating bold/heading text.
    const isBoldLine = (line) => {
      if (!bodyFont) return false;
      const sig = this._getLineStyleSignature(line);
      return !!sig.primaryFont && sig.primaryFont !== bodyFont;
    };

    const isLikelyResearchHeader = (text, nextLine, currentEntry, isBold) => {
      const normalized = String(text || "").replace(/\t+/g, " ").replace(/\s+/g, " ").trim();
      if (!normalized) return false;
      if (/[.;]$/.test(normalized)) return false;
      if (nextLine && !nextLine.startsBullet && this._extractTrailingDateRange(nextLine.text)) return true;
      if (!nextLine?.startsBullet) return false;
      if (normalized.length > 120) return false;
      // A bold non-bullet line immediately before bullets is a subcategory heading.
      if (isBold) return true;
      return !currentEntry || !currentEntry.highlights.length;
    };

    for (let i = 0; i < sourceLines.length; i++) {
      const line = sourceLines[i];
      const nextLine = sourceLines[i + 1];
      const cleanText = line.text.replace(/^[•·▪\-–*]\s*/, "").trim();
      if (!cleanText) continue;

      const dateMatch = !line.startsBullet ? this._extractTrailingDateRange(line.text) : null;
      if (dateMatch) {
        startEntry(dateMatch.headerText, dateMatch);
        continue;
      }

      if (!line.startsBullet) {
        if (nextLine && !nextLine.startsBullet && this._extractTrailingDateRange(nextLine.text)) {
          // Only treat as a pending headline if the line looks like a title, not a bullet
          // continuation. Lines ending in . or ; or starting with lowercase are continuations.
          if (!/[.;]$/.test(cleanText) && !/^[a-z]/.test(cleanText)) {
            pendingHeadline = cleanText;
            continue;
          }
        }
        if (isLikelyResearchHeader(cleanText, nextLine, current, isBoldLine(line))) {
          startEntry(cleanText, null);
          continue;
        }
      }

      if (!current) {
        startEntry(pendingHeadline || "Research Experience", null);
      }

      if (line.startsBullet) {
        current.highlights.push(cleanText);
      } else if (current.highlights.length) {
        current.highlights[current.highlights.length - 1] = `${current.highlights[current.highlights.length - 1]} ${cleanText}`.trim();
      } else {
        current.summary = `${current.summary ? `${current.summary} ` : ""}${cleanText}`.trim();
      }
    }

    flush();
    return entries;
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

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !this._isEducationNoiseLine(line));

    const blocks = [];
    let current = null;

    const flush = () => {
      if (current && current.institution) {
        blocks.push(current);
      }
      current = null;
    };

    for (const line of lines) {
      if (this._looksLikeInstitutionLine(line)) {
        flush();
        current = { institution: line, lines: [line] };
        continue;
      }
      if (!current) {
        current = { institution: "", lines: [] };
      }
      current.lines.push(line);
    }

    flush();

    for (const block of blocks) {
      const institution = block.institution || this._findInstitutionLine(block.lines);
      if (!institution) continue;

      const detailLines = block.lines.filter((line) => line !== institution);
      const blockText = [institution, ...detailLines].join(" ").replace(/\s+/g, " ").trim();
      const years = [...blockText.matchAll(/\b((?:19|20)\d{2})\b/g)].map((match) => match[1]);

      entries.push({
        institution,
        studyType: this._extractEducationStudyType(blockText),
        area: this._extractEducationArea(detailLines, blockText),
        startDate: years[0] || "",
        endDate: years[1] || "",
      });
    }

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
   *
   * Any lines that appear before the first category header are treated as intro
   * text (e.g. a summary sentence) and stored as { name: '', summary: '...' }.
   */
  _parseSkills(text) {
    const skills = [];
    if (!text) return skills;
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    let currentCategory = "";
    let keywords = [];
    let foundFirstCategory = false;
    const introLines = [];

    const pushCurrent = () => {
      if (keywords.length > 0) {
        skills.push({
          name: currentCategory || "Skills",
          keywords: this._dedupePreserveOrder(keywords),
        });
        keywords = [];
      }
    };

    const pushIntro = () => {
      if (!introLines.length) return;
      const introKeywords = this._splitSkillKeywords(introLines.join(", "));
      if (introKeywords.length > 0) {
        skills.push({ name: "Core Skills", keywords: introKeywords });
      } else {
        skills.push({ name: "", summary: introLines.join(" "), keywords: [] });
      }
      introLines.length = 0;
    };

    for (const line of lines) {
      // Split on tab to separate possible "Category:" from inline keywords
      const tabIdx = line.indexOf('\t');
      const mainPart = (tabIdx >= 0 ? line.substring(0, tabIdx) : line).trim();
      const tabRest  = tabIdx >= 0 ? line.substring(tabIdx + 1).trim() : '';

      // Category header: "Something:" or "Something Name: optional keywords..."
      const catMatch = mainPart.match(/^([A-Z][^:\n]{0,33}):\s*(.*)$/);
      if (catMatch || this._looksLikeSkillCategory(mainPart)) {
        if (!foundFirstCategory) pushIntro();
        foundFirstCategory = true;
        pushCurrent();
        currentCategory = catMatch ? catMatch[1].trim() : mainPart.replace(/:$/, "").trim();
        const inlineContent = catMatch
          ? (catMatch[2] + (tabRest ? ' ' + tabRest : '')).trim()
          : tabRest;
        if (inlineContent) {
          keywords.push(...this._splitSkillKeywords(inlineContent));
        }
      } else if (!foundFirstCategory) {
        // Before first category header: accumulate as intro text
        const fullLine = tabRest ? `${mainPart} ${tabRest}` : mainPart;
        introLines.push(fullLine);
      } else {
        // After first category header: plain keywords line
        const fullLine = tabRest ? `${mainPart}, ${tabRest}` : mainPart;
        keywords.push(...this._splitSkillKeywords(fullLine));
      }
    }

    if (!foundFirstCategory) pushIntro();
    pushCurrent();
    return skills;
  },

  _removeRepeatedHeaderLines(text, headerText) {
    if (!text) return "";
    const normalizedHeader = String(headerText || "").replace(/\s+/g, " ").trim().toLowerCase();
    return text
      .split("\n")
      .filter((line) => {
        const normalizedLine = line.replace(/\s+/g, " ").trim().toLowerCase();
        return normalizedLine && normalizedLine !== normalizedHeader;
      })
      .join("\n")
      .trim();
  },

  _isEducationNoiseLine(line) {
    if (/^(?:education|skills|work experience|experience|projects|awards|certifications|---+)$/i.test(line)) {
      return true;
    }
    return /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(line) && !/\b(university|institute|college|academy|school)\b/i.test(line);
  },

  _looksLikeInstitutionLine(line) {
    if (!line) return false;
    if (/\b(university|institute|college|academy|school)\b/i.test(line)) return true;
    if (this._looksLikeDegreeLine(line)) return false;
    if (/\b(?:dept|department|lab|foundation|company|inc|llc|corp)\b/i.test(line)) return false;
    if (this._looksLikeSkillCategory(line)) return false;
    return /^[A-Z][A-Za-z&.'()/-]+(?:\s+[A-Z][A-Za-z&.'()/-]+){1,6}$/.test(line) && line.length <= 90;
  },

  _findInstitutionLine(lines) {
    return (lines || []).find((line) => this._looksLikeInstitutionLine(line)) || "";
  },

  _extractEducationStudyType(text) {
    const normalized = String(text || "").replace(/[’`]/g, "'");
    const durationMatch = normalized.match(/(\d+(?:\.\d+)?)\s+(semester|semesters|year|years)/i);
    const durationLabel = durationMatch
      ? ` (${durationMatch[1]} ${
          durationMatch[2].toLowerCase().startsWith("semester")
            ? (durationMatch[1] === "1" ? "semester" : "semesters")
            : (durationMatch[1] === "1" ? "year" : "years")
        })`
      : "";
    const isCoursework = /\b(toward|coursework|semester|semesters|year|years)\b/i.test(normalized);

    if (/\b(ph\.?d|doctorate)\b/i.test(normalized)) {
      return isCoursework ? `PhD Coursework${durationLabel}` : "PhD";
    }
    if (/\b(m\.?b\.?a)\b/i.test(normalized)) {
      return "MBA";
    }
    if (/\b(master'?s?|m\.?s\.?|m\.?a\.?)\b/i.test(normalized)) {
      return isCoursework ? `Master's Coursework${durationLabel}` : "Master's";
    }
    if (/\b(bachelor'?s?|b\.?s\.?)\b/i.test(normalized)) {
      return "Bachelor's";
    }
    if (/\b(b\.?a\.?)\b/i.test(normalized)) {
      return "BA";
    }
    if (/\bassociate\b/i.test(normalized)) {
      return "Associate's";
    }
    return "";
  },

  _extractEducationArea(detailLines, blockText) {
    const cleanedDetailLine = (detailLines || [])
      .filter((line) => line && !/^(?:gpa|score)\b/i.test(line))
      .map((line) => this._cleanEducationAreaText(line))
      .find(Boolean);
    const primaryText = (cleanedDetailLine || this._cleanEducationAreaText(blockText || "") || "").split(/(?<=[.!?])\s+/)[0];
    return primaryText
      .replace(/\s+/g, " ")
      .replace(/\s*,\s*/g, ", ")
      .replace(/^[-,.;\s]+|[-,.;\s]+$/g, "");
  },

  _cleanEducationAreaText(text) {
    return String(text || "")
      .replace(/[’`]/g, "'")
      .replace(/\b\d+(?:\.\d+)?\s+(?:semester|semesters|year|years)\s+toward\s+(?:a\s+)?(?:ph\.?d|doctorate|master'?s?|bachelor'?s?)\b/ig, "")
      .replace(/\btoward\s+(?:a\s+)?(?:ph\.?d|doctorate|master'?s?|bachelor'?s?)\b/ig, "")
      .replace(/\b(?:Bachelor'?s?|Master'?s?|Doctorate|Ph\.?D|B\.?A\.?|B\.?S\.?|M\.?A\.?|M\.?S\.?|MBA)\b/ig, "")
      .replace(/\s+/g, " ")
      .replace(/\s*,\s*/g, ", ")
      .replace(/^[-,.;\s]+|[-,.;\s]+$/g, "");
  },

  _looksLikeDegreeLine(text) {
    return /\b(?:Bachelor'?s?|Master'?s?|Doctorate|Ph\.?D|B\.?A\.?|B\.?S\.?|M\.?A\.?|M\.?S\.?|MBA|Associate(?:'s)?)\b/i.test(text || "");
  },

  _looksLikeSkillCategory(text) {
    const trimmed = String(text || "").replace(/:$/, "").trim();
    if (!trimmed || trimmed.length > 48) return false;
    if (/[,.]/.test(trimmed)) return false;
    if (/^(?:skills|loren kevin heyns)$/i.test(trimmed)) return false;
    if (/\b(university|institute|college|academy|school)\b/i.test(trimmed)) return false;
    if (!/^[A-Z][A-Za-z0-9&+/.() -]+$/.test(trimmed)) return false;
    return trimmed.includes("/") || /\b(?:and|&)\b/.test(trimmed) || trimmed.split(/\s+/).length <= 5;
  },

  _splitSkillKeywords(text) {
    return this._dedupePreserveOrder(
      String(text || "")
        .replace(/\.\s+(?=[A-Z])/g, ", ")
        .split(/[,;•]/)
        .map((word) => word.trim())
        .filter((word) => word && word.length > 1)
    );
  },

  _dedupePreserveOrder(items) {
    const seen = new Set();
    return (items || []).filter((item) => {
      const key = String(item).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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
    const issues = Array.isArray(this.parseWarnings) ? this.parseWarnings.slice() : [];
    if (!this.rawText) return issues;

    const lines = this.rawText.split('\n').filter(l => l.trim());
    const normalizedHeaderLines = lines.slice(0, 3).map((line) => this._normalizeHeaderLineText(line));
    const normalizedHeaderText = normalizedHeaderLines.join('\n');

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

    if (!issues.some((issue) => issue.type === 'split-phone')) {
      const malformedPhoneRe = /(?:\+?1[\s.-]*)?\(?\d{3}\)?[\s.-]*\d{3}(?:\s+-\s*|\s*-\s+|(?:\||·)\s*-\s*)\d{4}\b/g;
      const foundPhones = new Set();
      let phoneMatch;
      while ((phoneMatch = malformedPhoneRe.exec(normalizedHeaderText)) !== null) {
        const source = phoneMatch[0].replace(/\s+/g, ' ').trim();
        const repaired = this._normalizePhoneString(source);
        const key = `${source}|${repaired}`;
        if (foundPhones.has(key)) continue;
        foundPhones.add(key);
        issues.push({
          type: 'split-phone',
          message: `Phone number appears split or malformed as "${source}".`,
          fix: `Use one continuous phone string, for example "${repaired}".`
        });
      }
    }

    return issues;
  },
};

// Export for use in modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ResumePDFConverter;
}
