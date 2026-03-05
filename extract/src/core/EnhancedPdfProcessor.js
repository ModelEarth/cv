/**
 * EnhancedPdfProcessor
 *
 * HIGH-LEVEL PDF PROCESSING ENGINE
 * Builds on PdfMasterApi to provide domain-specific functionality:
 * - Resume parsing with advanced features
 * - Form data extraction
 * - Annotation processing
 * - Signature verification
 * - Multi-page coordination
 * - Caching and optimization
 */

class EnhancedPdfProcessor {
  constructor() {
    this.api = new PdfMasterApi();
    this.cache = new Map();
    this.processingOptions = {
      extractMetadata: true,
      extractText: true,
      extractAnnotations: true,
      extractForms: true,
      renderThumbnails: true,
      detectLanguage: true,
      structuralAnalysis: true,
    };
  }

  /**
   * Initialize processor
   */
  async initialize() {
    await this.api.initialize();
    return this;
  }

  /**
   * Process complete PDF for resume/document extraction
   */
  async processPdf(source, options = {}) {
    const mergedOptions = { ...this.processingOptions, ...options };

    try {
      // Load document
      const pdfDoc = await this.api.openDocument(source);
      const docInfo = await this.api.getDocumentInfo(pdfDoc);

      const result = {
        metadata: null,
        pages: [],
        text: "",
        annotations: [],
        forms: null,
        signatures: null,
        structure: null,
        statistics: {
          totalPages: docInfo.pages,
          processingTime: 0,
          extractedTextLength: 0,
          annotationCount: 0,
        },
      };

      const startTime = performance.now();

      // Extract metadata
      if (mergedOptions.extractMetadata) {
        result.metadata = await this.api.getDocumentInfo(pdfDoc);
      }

      // Extract annotations
      if (mergedOptions.extractAnnotations) {
        result.annotations = await this._extractAllAnnotations(pdfDoc);
        result.statistics.annotationCount = result.annotations.length;
      }

      // Extract forms
      if (mergedOptions.extractForms) {
        result.forms = await this.api.extractFormData(pdfDoc);
      }

      // Extract signatures
      try {
        result.signatures = await this.api.extractSignatures(pdfDoc);
      } catch (error) {
        console.warn("Signature extraction skipped");
      }

      // Get structure
      if (mergedOptions.structuralAnalysis) {
        result.structure = await this.api.getDocumentStructure(pdfDoc);
      }

      // Process each page
      for (let pageNum = 1; pageNum <= docInfo.pages; pageNum++) {
        const page = await this.api.getPage(pdfDoc, pageNum);

        const pageData = {
          pageNumber: pageNum,
          text: "",
          annotations: [],
          forms: [],
          thumbnail: null,
          dimensions: null,
        };

        try {
          // Extract text
          if (mergedOptions.extractText) {
            const textData = await this.api.extractPageText(page, {
              includeLayout: true,
              includeFontInfo: true,
              normalizeSpacing: true,
            });

            pageData.text = textData.fullText;
            result.text += textData.fullText + "\n---PAGE BREAK---\n";
          }

          // Get page dimensions
          const viewport = page.getViewport({ scale: 1 });
          pageData.dimensions = {
            width: viewport.width,
            height: viewport.height,
          };

          // Extract page annotations
          if (mergedOptions.extractAnnotations) {
            pageData.annotations = await this.api.getPageAnnotations(page);
          }

          // Create thumbnail
          if (mergedOptions.renderThumbnails && pageNum <= 3) {
            // Only first 3 pages for performance
            const canvas = document.createElement("canvas");
            const thumbResult = await this.api.renderPageToCanvas(
              page,
              canvas,
              {
                scale: 0.25,
                renderText: false,
              }
            );
            pageData.thumbnail = canvas.toDataURL("image/jpeg", 0.5);
          }
        } catch (error) {
          console.warn(`Error processing page ${pageNum}:`, error);
        }

        result.pages.push(pageData);
      }

      result.statistics.processingTime = performance.now() - startTime;
      result.statistics.extractedTextLength = result.text.length;

      // Cache result
      const cacheKey = this._getCacheKey(source);
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.error("PDF processing failed:", error);
      const normalizedError = this.api.normalizeException(error);
      throw {
        error: normalizedError,
        recoveryOptions: this.api.getErrorRecoveryOptions(),
      };
    }
  }

  /**
   * Extract all annotations from all pages
   */
  async _extractAllAnnotations(pdfDoc) {
    const allAnnotations = [];

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const annotations = await this.api.getPageAnnotations(page);

        for (const annotation of annotations) {
          annotation.page = pageNum;
          allAnnotations.push(annotation);
        }
      } catch (error) {
        console.warn(`Could not extract annotations from page ${pageNum}`);
      }
    }

    return allAnnotations;
  }

  /**
   * Advanced resume parsing using all extracted data
   * ENHANCED: Follows JSON Resume schema with precision extraction
   */
  async parseResume(pdfDoc) {
    const processingResult = await this.processPdf(pdfDoc, {
      extractMetadata: true,
      extractText: true,
      extractAnnotations: true,
      extractForms: true,
      structuralAnalysis: true,
    });

    // Use extracted text and structure for intelligent parsing
    const fullText = processingResult.text;
    const structure = processingResult.structure;
    const metadata = processingResult.metadata;
    const forms = processingResult.forms;

    // Enhanced section parsing with better accuracy
    const sections = this._identifySections(fullText);
    const contact = this._extractContact(fullText);

    // Parse with precision extraction methods
    const experience = this._parseExperiencePrecise(
      sections.experience || "",
      fullText
    );
    const education = this._parseEducationPrecise(
      sections.education || "",
      fullText
    );
    const skills = this._parseSkillsPrecise(sections.skills || "", fullText);
    const projects = this._parseProjectsPrecise(
      sections.projects || "",
      fullText
    );

    // Extract from form fields if available
    const formData = forms?.fieldValues || {};

    // Build structured JSON Resume object
    return {
      metadata: {
        source: metadata?.title || "Resume",
        author: metadata?.author || contact.name || "Unknown",
        extractedAt: new Date().toISOString(),
        totalPages: processingResult.statistics.totalPages,
      },
      basics: {
        name: contact.name || formData.name || "Not Found",
        label:
          contact.title || this._extractJobTitle(fullText) || "Professional",
        image: "", // Can be populated from external source
        email: contact.email || formData.email || "",
        phone: contact.phone || formData.phone || "",
        url: this._normalizeUrl(contact.website || formData.website || ""),
        summary: this._sanitizeText(
          sections.summary || this._extractSummary(fullText)
        ),
        location: {
          address: "",
          postalCode: "",
          city: contact.location || this._extractCity(fullText) || "",
          countryCode: "",
          region: this._extractRegion(fullText) || "",
        },
        profiles: this._extractProfiles(fullText),
      },
      work: experience,
      education: education,
      skills: skills,
      projects: projects,
      languages: this._parseLanguagesPrecise(fullText),
      certifications: this._parseCertificationsPrecise(fullText),
      references: this._parseReferencesPrecise(fullText),
      rawData: {
        fullText: fullText,
        annotations: processingResult.annotations,
        formFields: forms,
        extractedSections: sections,
      },
    };
  }

  /**
   * Identify resume sections with enhanced pattern matching
   */
  /**
   * CRITICAL FIX: Clean and normalize PDF text with malformed spacing
   * This handles irregular spacing from PDF extraction like "S h a n m u g a   P r i y a"
   */
  _cleanAndNormalizeText(text) {
    if (!text) return "";

    let cleaned = text
      // Replace multiple spaces/tabs with single space
      .replace(/[ \t]+/g, " ")
      // Fix spaced-out letters: "E D U C A T I O N" → "EDUCATION"
      .replace(/([A-Z])\s+([A-Z])\s+([A-Z])/g, (match) => {
        const parts = match.split(/\s+/);
        if (parts.length >= 3 && parts.every((p) => /^[A-Z]$/.test(p))) {
          return parts.join(""); // "E D U" → "EDU"
        }
        return match;
      })
      // Fix spaced names: "S h a n m u g a" → "Shanmuga" (consecutive single letters)
      .replace(/([A-Z])\s+(?=[a-z](?:\s+[a-z])*(?:\s+[A-Z]|$))/g, "$1")
      // Replace multiple newlines with double newline
      .replace(/\n\s*\n+/g, "\n\n")
      .trim();

    return cleaned;
  }

  _identifySections(text) {
    // CRITICAL: Clean text FIRST to normalize spacing
    const cleanedText = this._cleanAndNormalizeText(text);

    const sections = {
      summary: "",
      experience: "",
      education: "",
      skills: "",
      projects: [],
      languages: "",
      certifications: "",
    };

    const lines = cleanedText.split("\n");
    let currentSection = null;
    let sectionContent = [];
    const sectionPatterns = {
      summary:
        /^(PROFESSIONAL\s+SUMMARY|^SUMMARY$|^OBJECTIVE$|^PROFILE$|^OVERVIEW$|^ABOUT$|PROFESSIONAL\s+PROFILE)$/i,
      experience:
        /^(PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE|EMPLOYMENT|CAREER|EXPERIENCE|WORK\s+HISTORY|XPERIENCE)$/i,
      education:
        /^(EDUCATION|ACADEMIC|QUALIFICATIONS|DEGREES|ACADEMIC\s+BACKGROUND|DUCATION)$/i,
      skills:
        /^(SKILLS|COMPETENCIES|TECHNICAL\s+SKILLS|CORE\s+COMPETENCIES|EXPERTISE|CAPABILITIES|KILLS)$/i,
      projects:
        /^(PROJECTS|PORTFOLIO|KEY\s+PROJECTS|NOTABLE\s+PROJECTS|ROJECTS)$/i,
      languages:
        /^(LANGUAGES|LANGUAGE\s+PROFICIENCY|LINGUISTIC\s+ABILITIES|ANGUAGES)$/i,
      certifications:
        /^(CERTIFICATIONS|LICENSES|CREDENTIALS|PROFESSIONAL\s+CERTIFICATIONS|AWARDS|ERTIFICATIONS)$/i,
    };

    for (const line of lines) {
      const upperLine = line.toUpperCase().trim();
      let foundSection = null;

      // Check which section this line belongs to
      for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(upperLine)) {
          foundSection = sectionName;
          break;
        }
      }

      if (foundSection) {
        // Save previous section
        if (currentSection && sectionContent.length > 0) {
          sections[currentSection] = sectionContent.join("\n").trim();
        }
        currentSection = foundSection;
        sectionContent = [];
      } else if (currentSection && line.trim().length > 0) {
        // Add content to current section
        sectionContent.push(line);
      } else if (currentSection && sectionContent.length > 0) {
        // Preserve empty lines within section
        sectionContent.push(line);
      }
    }

    // Save final section
    if (currentSection && sectionContent.length > 0) {
      sections[currentSection] = sectionContent.join("\n").trim();
    }

    return sections;
  }

  /**
   * Extract contact information
   */
  _extractContact(text) {
    const contact = {
      name: "",
      title: "",
      email: "",
      phone: "",
      website: "",
      location: "",
      linkedin: "",
    };

    // Clean text first for better contact extraction
    const cleanedText = this._cleanAndNormalizeText(text);

    // Email
    const emailMatch = cleanedText.match(
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/
    );
    if (emailMatch) contact.email = emailMatch[1];

    // Phone
    const phoneMatch = cleanedText.match(
      /(\+?1?\s*[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/
    );
    if (phoneMatch) contact.phone = phoneMatch[1];

    // Website/LinkedIn
    const urlMatch = cleanedText.match(
      /(https?:\/\/(www\.)?(linkedin\.com\/in\/|github\.com\/|[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+))/i
    );
    if (urlMatch) contact.website = urlMatch[1];

    // LinkedIn profile extraction
    const linkedinMatch = cleanedText.match(
      /linkedin\.com\/in\/([a-zA-Z0-9-]+)/i
    );
    if (linkedinMatch) contact.linkedin = linkedinMatch[0];

    // Location (city, state pattern)
    const locationMatch = cleanedText.match(/([A-Z][a-z]+),\s*([A-Z]{2})/);
    if (locationMatch)
      contact.location = `${locationMatch[1]}, ${locationMatch[2]}`;

    // Extract name (usually first line with title case words)
    // Skip section headers and other metadata
    const sectionHeaders =
      /^(PROFESSIONAL|SUMMARY|OBJECTIVE|PROFILE|EDUCATION|SKILLS|EXPERIENCE|PROJECTS|CONTACT|LANGUAGES|CERTIFICATIONS)/i;
    const lines = cleanedText.split("\n");

    // First, try to get name from first line before pipe separator
    const firstLine = lines[0].trim();
    if (firstLine.includes("|")) {
      let namePart = firstLine.split("|")[0].trim();
      // Remove phone/numbers from the end: "Shanmuga Priya Kannan 872 - 330 - 3203" → "Shanmuga Priya Kannan"
      namePart = namePart
        .replace(/\s+\d+\s*[-–—]\s*\d+\s*[-–—]\s*\d+\s*$/, "")
        .trim();
      if (
        namePart.length > 0 &&
        namePart.length < 100 &&
        !namePart.includes("@")
      ) {
        const words = namePart.split(/\s+/);
        const titleCaseWords = words.filter(
          (w) => w[0] === w[0].toUpperCase() && w.length > 1
        );
        if (titleCaseWords.length >= 2) {
          contact.name = namePart;
        }
      }
    }

    // If not found, search subsequent lines
    if (!contact.name) {
      for (const line of lines.slice(0, 8)) {
        const trimmed = line.trim();
        if (
          trimmed.length > 0 &&
          trimmed.length < 100 &&
          !sectionHeaders.test(trimmed) &&
          !trimmed.includes("|")
        ) {
          const words = trimmed.split(/\s+/);
          const titleCaseWords = words.filter(
            (w) => w[0] === w[0].toUpperCase() && w.length > 1
          );

          // Must have at least 2 title case words (like "Shanmuga Priya")
          if (
            titleCaseWords.length >= 2 &&
            !trimmed.includes("@") &&
            !trimmed.match(/\d+\s*-\s*\d+/)
          ) {
            contact.name = trimmed;
            break;
          }
        }
      }
    }

    return contact;
  }

  /**
   * Parse work experience
   */
  _parseExperience(text) {
    const experiences = [];
    const entries = text.split(/\n(?=[A-Z])/);

    for (const entry of entries) {
      const lines = entry.split("\n").filter((l) => l.trim());
      if (lines.length < 2) continue;

      const dateMatch = entry.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4})/g);
      const experience = {
        position: lines[0]?.trim() || "",
        company: lines[1]?.trim() || "",
        startDate: dateMatch?.[0] || "",
        endDate: dateMatch?.[1] || "Present",
        summary: lines.slice(2).join(" "),
        highlights: [],
      };

      experiences.push(experience);
    }

    return experiences;
  }

  /**
   * Parse education
   */
  _parseEducation(text) {
    const education = [];
    const entries = text.split(/\n(?=[A-Z])/);

    for (const entry of entries) {
      const lines = entry.split("\n").filter((l) => l.trim());
      if (lines.length < 1) continue;

      const edu = {
        institution: lines[0]?.trim() || "",
        studyType: this._extractDegreeType(entry),
        area: lines[1]?.trim() || "",
        startDate: "",
        endDate: "",
        score: "",
      };

      education.push(edu);
    }

    return education;
  }

  /**
   * Parse skills
   */
  _parseSkills(text) {
    const skills = [];
    const lines = text.split("\n").filter((l) => l.trim());

    for (const line of lines) {
      const items = line.split(/[,;•]/);
      for (const item of items) {
        const skill = item.trim();
        if (skill.length > 0 && skill.length < 50) {
          skills.push({
            name: skill,
            level: "intermediate",
          });
        }
      }
    }

    return skills;
  }

  /**
   * Extract degree type
   */
  _extractDegreeType(text) {
    const patterns = {
      "Bachelor's": /bachelor|b\.?a\.?|b\.?s\.?/i,
      "Master's": /master|m\.?a\.?|m\.?b\.?a\.?|m\.?s\.?/i,
      "Ph.D.": /phd|ph\.?d\.?|doctorate/i,
      "Associate's": /associate|a\.?a\.?|a\.?s\.?/i,
    };

    for (const [degree, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return degree;
      }
    }

    return "Degree";
  }

  /**
   * Parse languages
   */
  _parseLanguages(text) {
    const languages = [];
    const languageNames = [
      "English",
      "Spanish",
      "French",
      "German",
      "Mandarin",
      "Japanese",
      "Arabic",
      "Portuguese",
      "Russian",
      "Italian",
    ];

    for (const lang of languageNames) {
      if (new RegExp(lang, "i").test(text)) {
        languages.push({
          language: lang,
          fluency: "Fluent",
        });
      }
    }

    return languages;
  }

  /**
   * Parse certifications
   */
  _parseCertifications(text) {
    const certifications = [];
    const certPattern =
      /(?:certification|certified|credential|certificate)[\s:]*([^\n]+)/gi;

    let match;
    while ((match = certPattern.exec(text))) {
      certifications.push({
        name: match[1].trim(),
        issuer: "Unknown",
        date: "",
      });
    }

    return certifications;
  }

  /**
   * Parse references
   */
  _parseReferences(text) {
    const references = [];
    const refPattern = /references?[\s:]*\n([\s\S]*?)(?:\n\n|$)/i;

    const match = text.match(refPattern);
    if (match) {
      const refText = match[1];
      const entries = refText.split("\n\n");

      for (const entry of entries) {
        const lines = entry.split("\n");
        if (lines.length >= 1) {
          references.push({
            name: lines[0]?.trim() || "",
            reference: lines.slice(1).join(" ").trim() || "",
          });
        }
      }
    }

    return references;
  }

  // ============= ENHANCED PRECISION EXTRACTION METHODS =============

  /**
   * Extract job title with higher precision
   */
  _extractJobTitle(text) {
    const titlePatterns = [
      /(?:title|position|role|designation)[\s:]*([^\n]+)/i,
      /^([A-Z][a-zA-Z\s]{5,50})(?:\s+(?:at|@|\||-)|\n)/m,
      /(?:Senior|Junior|Lead|Principal|Staff|Manager|Engineer|Developer|Analyst|Designer|Consultant)\s+([A-Za-z\s]+)/,
    ];

    for (const pattern of titlePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().split("\n")[0];
      }
    }

    return "";
  }

  /**
   * Extract professional summary with better accuracy
   */
  _extractSummary(text) {
    const summaryPatterns = [
      /(?:professional\s+summary|summary|objective|profile)[\s:]*\n([\s\S]{20,500})(?:\n\n|experience|education|skills|$)/i,
      /^([\s\S]{20,500})(?:\n\n|experience|education|skills)/i,
    ];

    for (const pattern of summaryPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const summary = match[1].trim();
        if (summary.length > 20) {
          return summary.split("\n\n")[0];
        }
      }
    }

    return "";
  }

  /**
   * Extract city/location with better matching
   */
  _extractCity(text) {
    // Look for City patterns
    const cityMatch = text.match(
      /(?:location|city)[\s:]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
    );
    if (cityMatch) return cityMatch[1];

    // Look for "City, State" pattern
    const stateMatch = text.match(/([A-Z][a-z]+),\s*([A-Z]{2})/);
    if (stateMatch) return stateMatch[1];

    return "";
  }

  /**
   * Extract region/state
   */
  _extractRegion(text) {
    const regionMatch = text.match(/,\s*([A-Z]{2})(?:\s|$)/);
    return regionMatch ? regionMatch[1] : "";
  }

  /**
   * Extract profiles (LinkedIn, GitHub, etc.)
   */
  _extractProfiles(text) {
    const profiles = [];

    // LinkedIn
    const linkedinMatch = text.match(
      /(https?:\/\/)?(www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-]+)/i
    );
    if (linkedinMatch) {
      profiles.push({
        network: "LinkedIn",
        username: linkedinMatch[3],
        url: `https://linkedin.com/in/${linkedinMatch[3]}`,
      });
    }

    // GitHub
    const githubMatch = text.match(
      /(https?:\/\/)?(www\.)?github\.com\/([a-zA-Z0-9\-]+)/i
    );
    if (githubMatch) {
      profiles.push({
        network: "GitHub",
        username: githubMatch[3],
        url: `https://github.com/${githubMatch[3]}`,
      });
    }

    // Personal website
    const websiteMatch = text.match(
      /(https?:\/\/)((?!linkedin|github)[a-zA-Z0-9\-]+\.[a-zA-Z0-9]+)/i
    );
    if (websiteMatch) {
      profiles.push({
        network: "Website",
        username: websiteMatch[2],
        url: websiteMatch[0],
      });
    }

    return profiles;
  }

  /**
   * Normalize URLs to proper format
   */
  _normalizeUrl(url) {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    if (url.startsWith("www")) return `https://${url}`;
    if (url.includes(".")) return `https://${url}`;
    return "";
  }

  /**
   * Sanitize text by removing extra whitespace
   */
  _sanitizeText(text) {
    if (!text) return "";
    return text.replace(/\s+/g, " ").trim().substring(0, 1000); // Limit to 1000 chars
  }

  /**
   * PRECISE work experience parsing - matches JSON Resume schema
   */
  _parseExperiencePrecise(experienceText, fullText) {
    if (!experienceText || experienceText.trim().length < 5) return [];

    const experiences = [];

    // Split by common job entry separators
    const entries = experienceText
      .split(/\n(?=[A-Z][a-zA-Z\s]{2,}[\s]*(?:\||–|—|-|·|\n|$))/m)
      .filter((e) => e.trim().length > 10);

    for (const entry of entries) {
      const lines = entry.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length < 2) continue;

      // Extract dates
      const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}|\d{4})/g;
      const dates = entry.match(datePattern) || [];

      // Extract company and position
      let company = "";
      let position = "";
      let startDate = "";
      let endDate = "";
      let summary = "";

      // Try to identify company and position
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Position is usually longer and first
        if (!position && line.length > 5 && line.length < 100) {
          position = line;
          if (i + 1 < lines.length) {
            company = lines[i + 1].trim();
            i++;
          }
          break;
        }
      }

      // Parse dates
      if (dates.length >= 2) {
        startDate = dates[0];
        endDate = dates[1];
      } else if (dates.length === 1) {
        startDate = dates[0];
        endDate = "Present";
      }

      // Get summary from remaining lines
      const summaryLines = lines.slice(2).join(" ");
      summary = this._sanitizeText(summaryLines);

      if (position || company) {
        experiences.push({
          name: company || "Company",
          position: position || "Position",
          startDate: startDate || "",
          endDate: endDate || "Present",
          summary: summary,
          highlights: this._extractHighlights(entry),
          url: "",
          isWork: true,
        });
      }
    }

    return experiences;
  }

  /**
   * Extract bullet points/highlights from text
   */
  _extractHighlights(text) {
    const highlights = [];
    const bulletPatterns = /[•\-\*]\s+([^\n]+)/g;

    let match;
    while ((match = bulletPatterns.exec(text))) {
      const highlight = this._sanitizeText(match[1]);
      if (highlight.length > 5 && highlight.length < 200) {
        highlights.push(highlight);
      }
    }

    return highlights;
  }

  /**
   * PRECISE education parsing - matches JSON Resume schema
   */
  _parseEducationPrecise(educationText, fullText) {
    if (!educationText || educationText.trim().length < 5) return [];

    const education = [];
    const entries = educationText
      .split(/\n(?=[A-Z])/m)
      .filter((e) => e.trim().length > 10);

    for (const entry of entries) {
      const lines = entry.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length < 1) continue;

      // Extract institution and degree
      const institution = lines[0]?.trim() || "";
      const degreeType = this._extractDegreeType(entry);
      const area = lines[1]?.trim() || this._extractStudyArea(entry);

      // Extract dates
      const dateMatch = entry.match(/(\d{4})/g);
      const startDate = dateMatch?.[0] || "";
      const endDate = dateMatch?.[1] || dateMatch?.[0] || "";

      // Extract GPA/score if present
      const gpaMatch = entry.match(/(?:gpa|score)[\s:]*([0-9.]+)/i);
      const score = gpaMatch ? gpaMatch[1] : "";

      if (institution) {
        education.push({
          institution: institution,
          studyType: degreeType,
          area: area,
          startDate: startDate,
          endDate: endDate,
          score: score,
          courses: this._extractCourses(entry),
        });
      }
    }

    return education;
  }

  /**
   * Extract study area/major from education text
   */
  _extractStudyArea(text) {
    const areaPatterns = [
      /(?:major|degree in|field|specialization)[\s:]*([^\n,]+)/i,
      /(?:computer science|engineering|business|arts|science|technology)[\s\w]*/i,
    ];

    for (const pattern of areaPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1]?.trim() || match[0];
      }
    }

    return "";
  }

  /**
   * Extract courses from education text
   */
  _extractCourses(text) {
    const courses = [];
    const coursePattern = /(?:coursework|courses)[\s:]*([^\n]+)/i;
    const match = text.match(coursePattern);

    if (match) {
      const courseText = match[1];
      const items = courseText.split(/[,;]/);
      for (const item of items) {
        const course = item.trim();
        if (course.length > 2 && course.length < 100) {
          courses.push(course);
        }
      }
    }

    return courses;
  }

  /**
   * PRECISE skills parsing - returns structured objects, not strings
   */
  _parseSkillsPrecise(skillsText, fullText) {
    if (!skillsText || skillsText.trim().length < 3) return [];

    const skills = [];
    const skillCategoryPattern = /([A-Za-z\s]+)[\s:]*([^\n]+)/g;

    // Try to identify skill categories
    const lines = skillsText.split("\n").filter((l) => l.trim().length > 0);
    let currentCategory = "";

    for (const line of lines) {
      const trimmed = line.trim();

      // Check if this is a category header (usually short and ends with colon or has bullets following)
      if (
        trimmed.endsWith(":") ||
        (trimmed.length < 50 && trimmed.match(/^[A-Za-z\s]+$/))
      ) {
        currentCategory = trimmed.replace(":", "").trim();
      } else {
        // This is a skill item
        const skillItems = trimmed.split(/[,;•\-]/);

        for (const skillItem of skillItems) {
          const skill = skillItem.trim();
          if (skill.length > 0 && skill.length < 100) {
            skills.push({
              name: skill,
              level: this._inferSkillLevel(skill, fullText),
              keywords: this._extractKeywords(skill),
            });
          }
        }
      }
    }

    // Deduplicate skills
    const uniqueSkills = [];
    const seen = new Set();
    for (const skill of skills) {
      const key = skill.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSkills.push(skill);
      }
    }

    return uniqueSkills;
  }

  /**
   * Infer skill level from context
   */
  _inferSkillLevel(skillName, fullText) {
    const text = fullText.toLowerCase();
    const skill = skillName.toLowerCase();

    if (
      text.includes(`expert ${skill}`) ||
      text.includes(`mastered ${skill}`)
    ) {
      return "Expert";
    }
    if (
      text.includes(`advanced ${skill}`) ||
      text.includes(`proficient ${skill}`)
    ) {
      return "Advanced";
    }
    if (
      text.includes(`intermediate ${skill}`) ||
      text.includes(`experienced ${skill}`)
    ) {
      return "Intermediate";
    }
    if (text.includes(`beginner ${skill}`) || text.includes(`basic ${skill}`)) {
      return "Beginner";
    }

    return "Intermediate"; // Default
  }

  /**
   * Extract keywords from skill text
   */
  _extractKeywords(skillText) {
    return skillText
      .split(/[,\s\-]/)
      .filter((k) => k.length > 2 && k.length < 30)
      .slice(0, 3);
  }

  /**
   * PRECISE projects parsing
   */
  _parseProjectsPrecise(projectsText, fullText) {
    if (!projectsText || projectsText.trim().length < 5) return [];

    const projects = [];
    const entries = projectsText
      .split(/\n(?=[A-Z])/m)
      .filter((e) => e.trim().length > 10);

    for (const entry of entries) {
      const lines = entry.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length < 1) continue;

      const name = lines[0]?.trim() || "";
      const description = lines.slice(1).join(" ");

      // Extract dates if present
      const dateMatch = entry.match(/(\d{4})/g);
      const startDate = dateMatch?.[0] || "";
      const endDate = dateMatch?.[1] || "";

      // Extract keywords/technologies
      const keywords = this._extractTechnologies(entry);

      if (name) {
        projects.push({
          name: name,
          description: this._sanitizeText(description),
          highlights: this._extractHighlights(entry),
          keywords: keywords,
          startDate: startDate,
          endDate: endDate,
          url: this._extractUrl(entry),
          roles: ["Developer"],
          entity: "",
          type: "application",
        });
      }
    }

    return projects;
  }

  /**
   * Extract technologies from text
   */
  _extractTechnologies(text) {
    const commonTechs = [
      "JavaScript",
      "Python",
      "Java",
      "C++",
      "C#",
      "Ruby",
      "PHP",
      "Go",
      "Rust",
      "React",
      "Angular",
      "Vue",
      "Node.js",
      "Express",
      "Django",
      "Flask",
      "SQL",
      "MongoDB",
      "PostgreSQL",
      "MySQL",
      "Redis",
      "Docker",
      "Kubernetes",
      "AWS",
      "GCP",
      "Azure",
      "Heroku",
      "Git",
      "GitHub",
      "GitLab",
      "Linux",
      "Unix",
      "Windows",
      "REST",
      "GraphQL",
      "WebSocket",
      "API",
      "HTML",
      "CSS",
      "Sass",
      "Bootstrap",
      "Tailwind",
      "PySpark",
      "Pandas",
      "NumPy",
      "Matplotlib",
      "Tableau",
      "Power BI",
    ];

    const found = [];
    for (const tech of commonTechs) {
      if (new RegExp(`\\b${tech}\\b`, "i").test(text)) {
        found.push(tech);
      }
    }

    return found;
  }

  /**
   * Extract URL from text
   */
  _extractUrl(text) {
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[1] : "";
  }

  /**
   * PRECISE languages parsing
   */
  _parseLanguagesPrecise(fullText) {
    const languages = [];
    const languageList = [
      { name: "English", variants: ["English", "ENG"] },
      { name: "Spanish", variants: ["Spanish", "Español", "SPA"] },
      { name: "French", variants: ["French", "Français", "FRA"] },
      { name: "German", variants: ["German", "Deutsch", "DEU"] },
      { name: "Mandarin", variants: ["Mandarin", "Chinese", "中文", "ZH"] },
      { name: "Japanese", variants: ["Japanese", "日本語", "JPN"] },
      { name: "Korean", variants: ["Korean", "한국어", "KOR"] },
      { name: "Arabic", variants: ["Arabic", "العربية", "ARA"] },
      { name: "Portuguese", variants: ["Portuguese", "Português", "POR"] },
      { name: "Russian", variants: ["Russian", "Русский", "RUS"] },
      { name: "Italian", variants: ["Italian", "Italiano", "ITA"] },
      { name: "Hindi", variants: ["Hindi", "हिंदी", "HIN"] },
      { name: "Tamil", variants: ["Tamil", "தமிழ்", "TAM"] },
    ];

    for (const lang of languageList) {
      for (const variant of lang.variants) {
        const pattern = new RegExp(`\\b${variant}\\b`, "i");
        if (pattern.test(fullText)) {
          // Infer proficiency
          const proficiency = this._inferLanguageProficiency(
            fullText,
            lang.name
          );
          languages.push({
            language: lang.name,
            fluency: proficiency,
          });
          break;
        }
      }
    }

    return languages;
  }

  /**
   * Infer language proficiency level
   */
  _inferLanguageProficiency(text, language) {
    const patterns = {
      Native: new RegExp(
        `${language}.*(?:native|mother|native\s+speaker)`,
        "i"
      ),
      Fluent: new RegExp(`${language}.*(?:fluent|professional|business)`, "i"),
      Advanced: new RegExp(
        `${language}.*(?:advanced|upper\s+intermediate)`,
        "i"
      ),
      Intermediate: new RegExp(
        `${language}.*(?:intermediate|conversational)`,
        "i"
      ),
      Elementary: new RegExp(`${language}.*(?:basic|elementary)`, "i"),
    };

    for (const [level, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return level;
      }
    }

    return "Professional"; // Default
  }

  /**
   * PRECISE certifications parsing
   */
  _parseCertificationsPrecise(fullText) {
    const certifications = [];

    // Enhanced patterns for certifications
    const certPatterns = [
      /(?:certified|certification|credential|certificate)[\s:]*([^\n,]+?)(?:\s+(?:from|by|issued)\s+([^\n]+)|$)/gi,
      /([A-Z][A-Za-z\s\-]{3,50})\s+(?:Certification|Certificate|Credential)/gi,
      /(?:CSA|CAD|PMP|CISSP|AWS|Azure|GCP|CCNA|CPA)\b[^\n]*/gi,
    ];

    for (const pattern of certPatterns) {
      let match;
      while ((match = pattern.exec(fullText))) {
        const name = match[1]?.trim() || match[0];
        const issuer = match[2]?.trim() || "Issuer Unknown";

        // Avoid duplicates
        if (
          !certifications.some(
            (c) => c.name.toLowerCase() === name.toLowerCase()
          )
        ) {
          certifications.push({
            name: name,
            issuer: issuer,
            date: this._extractDateFromContext(fullText, name),
            url: "",
          });
        }
      }
    }

    return certifications;
  }

  /**
   * Extract date from context around a string
   */
  _extractDateFromContext(text, contextStr) {
    const idx = text.toLowerCase().indexOf(contextStr.toLowerCase());
    if (idx === -1) return "";

    const context = text.substring(idx, idx + 200);
    const dateMatch = context.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4})/);
    return dateMatch ? dateMatch[1] : "";
  }

  /**
   * PRECISE references parsing
   */
  _parseReferencesPrecise(fullText) {
    const references = [];

    // Look for references section
    const refPattern =
      /(?:references?|contact\s+information)[\s:]*\n([\s\S]{0,1000})(?:\n\n|$)/i;
    const match = fullText.match(refPattern);

    if (!match) return references;

    const refText = match[1];
    const entries = refText.split(/\n\n+/).filter((e) => e.trim().length > 5);

    for (const entry of entries) {
      const lines = entry.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length >= 1) {
        const name = lines[0]?.trim() || "";

        // Extract email and phone
        const emailMatch = entry.match(
          /([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9_-]+)/
        );
        const phoneMatch = entry.match(
          /(\+?1?\s*[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/
        );

        references.push({
          name: name,
          reference: lines.slice(1).join(" ").trim() || "",
          email: emailMatch ? emailMatch[1] : "",
          phone: phoneMatch ? phoneMatch[1] : "",
        });
      }
    }

    return references;
  }

  /**
   * Get cache key for document
   */
  _getCacheKey(source) {
    if (source instanceof ArrayBuffer) {
      // Create hash of buffer
      return "buffer_" + new Date().getTime();
    }
    return String(source);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Cleanup
   */
  destroy() {
    this.api.destroy();
    this.cache.clear();
  }
}

// Export to global scope
if (typeof window !== "undefined") {
  window.EnhancedPdfProcessor = EnhancedPdfProcessor;
}
