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
   * Ensure PDF.js library is loaded
   */
  async _ensurePdfjsReady() {
    if (this.pdfjsLib) {
      return;
    }

    // Check if already available
    if (window.pdfjsLib) {
      this.pdfjsLib = window.pdfjsLib;
      return;
    }

    // Wait for pdfjs-ready event
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("PDF.js did not load within 10 seconds"));
      }, 10000);

      const handler = () => {
        clearTimeout(timeout);
        window.removeEventListener("pdfjs-ready", handler);
        this.pdfjsLib = window.pdfjsLib;
        if (!this.pdfjsLib) {
          reject(new Error("PDF.js library not found"));
        } else {
          resolve();
        }
      };

      window.addEventListener("pdfjs-ready", handler);
    });
  },

  /**
   * Fetch PDF from external URL
   */
  async _fetchPdfFromUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }
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

      // Group text by line
      const lines = [];
      let currentLine = { y: null, text: [] };

      for (const item of items) {
        const y = (item.transform && item.transform[5]) || 0;
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

      if (currentLine.text.length > 0) {
        lines.push(currentLine.text.join(" "));
      }

      fullText += lines.join("\n") + "\n\n";
    }

    return fullText.trim();
  },

  /**
   * Parse resume text to JSON Resume format
   */
  _parseResumeText(text) {
    // Clean and normalize text
    const cleanedText = this._cleanText(text);
    const lines = cleanedText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    // Extract basic info
    let name = lines[0] || "Resume";
    if (name.includes("|")) {
      name = name.split("|")[0].trim();
    }
    // Remove phone numbers from name
    name = name.replace(/\s+\d+\s*[-–—]\s*\d+\s*[-–—]\s*\d+\s*$/, "").trim();

    const email = this._extractEmail(cleanedText);
    const phone = this._extractPhone(cleanedText);
    const url = this._extractURL(cleanedText);
    const location = this._extractLocation(cleanedText);

    // Identify sections
    const sections = this._identifySections(cleanedText);

    // Build JSON Resume object
    return {
      basics: {
        name: name,
        label: lines[1] || "",
        email: email,
        phone: phone,
        url: url,
        location: location,
        summary: sections.summary || sections.about || "",
      },
      work: this._parseWorkExperience(sections.experience || sections.work || ""),
      education: this._parseEducation(sections.education || ""),
      skills: this._parseSkills(sections.skills || sections["technical skills"] || ""),
      projects: this._parseProjects(sections.projects || ""),
    };
  },

  /**
   * Clean and normalize text
   */
  _cleanText(text) {
    return text
      .replace(/[ \t]+/g, " ")
      .replace(/[-–—]/g, "-")
      .replace(/\n\s*\n\s*\n+/g, "\n\n")
      .replace(/\s+([.,;:])/g, "$1")
      .trim();
  },

  /**
   * Extract email from text
   */
  _extractEmail(text) {
    const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0] : "";
  },

  /**
   * Extract phone from text
   */
  _extractPhone(text) {
    const match = text.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    return match ? match[0] : "";
  },

  /**
   * Extract URL from text
   */
  _extractURL(text) {
    const match = text.match(/(https?:\/\/[^\s]+)|(linkedin\.com\/[^\s]+)/i);
    return match ? match[0] : "";
  },

  /**
   * Extract location from text (first 10 lines only)
   */
  _extractLocation(text) {
    const lines = text.split("\n").slice(0, 10).join("\n");
    const match = lines.match(/(?<![\s\w])([A-Z][a-z]+),\s*([A-Z]{2}|[A-Z][a-z]+)(?![a-z])/);
    return match ? match[0] : "";
  },

  /**
   * Identify resume sections
   */
  _identifySections(text) {
    const sections = {};
    const sectionPatterns = [
      { name: "education", pattern: /(?:^|\n)\s*(?:EDUCATION|ACADEMIC)\s*(?:\n|$)/gi },
      { name: "experience", pattern: /(?:^|\n)\s*(?:EXPERIENCE|PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE)\s*(?:\n|$)/gi },
      { name: "projects", pattern: /(?:^|\n)\s*(?:PROJECTS|PORTFOLIO)\s*(?:\n|$)/gi },
      { name: "skills", pattern: /(?:^|\n)\s*(?:TECHNICAL\s+SKILLS|SKILLS)\s*(?:\n|$)/gi },
      { name: "summary", pattern: /(?:^|\n)\s*(?:PROFESSIONAL\s+SUMMARY|SUMMARY|ABOUT)\s*(?:\n|$)/gi },
      { name: "about", pattern: /(?:^|\n)\s*(?:ABOUT|PROFILE)\s*(?:\n|$)/gi },
    ];

    // Find all section matches first
    const matches = [];
    for (const { name, pattern } of sectionPatterns) {
      // Reset regex lastIndex and create a fresh match
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match) {
        matches.push({
          name,
          index: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }

    // Sort matches by position
    matches.sort((a, b) => a.index - b.index);

    // Extract sections between matches
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const startIndex = match.endIndex;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index : text.length;
      sections[match.name] = text.substring(startIndex, endIndex).trim();
    }

    return sections;
  },

  /**
   * Parse work experience section
   */
  _parseWorkExperience(text) {
    const entries = [];
    const lines = text.split("\n").filter(l => l.trim());
    
    // Simple parsing - can be enhanced
    let currentEntry = null;
    for (const line of lines) {
      // Look for company/position patterns
      if (line.match(/^[A-Z][^•\n]+(?:•|$)/)) {
        if (currentEntry) entries.push(currentEntry);
        currentEntry = {
          company: line.replace(/•.*$/, "").trim(),
          position: "",
          startDate: "",
          endDate: "",
          summary: "",
        };
      } else if (currentEntry) {
        currentEntry.summary += (currentEntry.summary ? " " : "") + line;
      }
    }
    if (currentEntry) entries.push(currentEntry);

    return entries;
  },

  /**
   * Parse education section
   */
  _parseEducation(text) {
    const entries = [];
    const lines = text.split("\n").filter(l => l.trim());
    
    for (const line of lines) {
      // Look for institution patterns
      if (line.match(/^[A-Z]/)) {
        entries.push({
          institution: line,
          studyType: "",
          area: "",
          startDate: "",
          endDate: "",
          location: "",
        });
      }
    }

    return entries;
  },

  /**
   * Parse skills section
   */
  _parseSkills(text) {
    const skills = [];
    const lines = text.split("\n").filter(l => l.trim());
    
    // Group skills by category if detected
    let currentCategory = "Skills";
    const keywords = [];
    
    for (const line of lines) {
      if (line.match(/^[A-Z][^:]+:$/)) {
        if (keywords.length > 0) {
          skills.push({ name: currentCategory, keywords: [...keywords] });
          keywords.length = 0;
        }
        currentCategory = line.replace(":", "").trim();
      } else {
        // Extract keywords (comma or space separated)
        const words = line.split(/[,•]/).map(w => w.trim()).filter(w => w);
        keywords.push(...words);
      }
    }
    
    if (keywords.length > 0) {
      skills.push({ name: currentCategory, keywords });
    }

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
};

// Export for use in modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ResumePDFConverter;
}
