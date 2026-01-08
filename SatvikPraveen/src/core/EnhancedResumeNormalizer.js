/**
 * EnhancedResumeNormalizer
 *
 * Advanced resume parsing that uses structured extraction data
 * - Intelligent section detection
 * - Contact information extraction
 * - Work experience parsing
 * - Education parsing
 * - Skills categorization
 * - Achievement extraction
 */

class EnhancedResumeNormalizer {
  constructor(extractedData) {
    this.rawText = extractedData.text || "";
    this.structured = extractedData.structured || [];
    this.data = {
      basics: {
        name: "",
        label: "",
        image: "",
        email: "",
        phone: "",
        url: "",
        summary: "",
        location: {
          address: "",
          postalCode: "",
          city: "",
          countryCode: "",
          region: "",
        },
        profiles: [],
      },
      work: [],
      education: [],
      skills: [],
      projects: [],
      languages: [],
      references: [],
      certifications: [],
      achievements: [],
    };
  }

  /**
   * Main normalization method
   */
  normalize() {
    const lines = this.rawText.split("\n").filter((line) => line.trim());

    // Phase 1: Extract contact info
    this._extractContactInfo(lines);

    // Phase 2: Extract name (usually first line)
    this._extractName(lines);

    // Phase 3: Identify and extract sections
    const sections = this._identifySections(lines);

    // Phase 4: Parse identified sections
    for (const [sectionType, sectionLines] of Object.entries(sections)) {
      this._parseSection(sectionType, sectionLines);
    }

    // Phase 5: Post-process and clean
    this._postProcess();

    return this.data;
  }

  /**
   * Extract contact information (email, phone, URL, location)
   */
  _extractContactInfo(lines) {
    const fullText = lines.join(" ");

    // Email
    const emailMatch = fullText.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );
    if (emailMatch) this.data.basics.email = emailMatch[0];

    // Phone
    const phoneMatch = fullText.match(
      /(?:\+\d{1,3}[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/
    );
    if (phoneMatch) this.data.basics.phone = phoneMatch[0].trim();

    // Website/URL
    const urlMatch = fullText.match(
      /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i
    );
    if (urlMatch) this.data.basics.url = urlMatch[0];

    // Location (look for common location patterns)
    const locationMatch = fullText.match(
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2})\b|([A-Z][a-z]+),?\s*([A-Z][a-z]+)/
    );
    if (locationMatch) {
      this.data.basics.location.city = locationMatch[1] || locationMatch[3];
      this.data.basics.location.region = locationMatch[2] || locationMatch[4];
    }
  }

  /**
   * Extract name (usually first substantial line)
   */
  _extractName(lines) {
    // Look for a line that looks like a name (2-4 words, capitalized)
    for (const line of lines.slice(0, 5)) {
      const trimmed = line.trim();
      const words = trimmed.split(/\s+/);

      if (
        words.length >= 2 &&
        words.length <= 4 &&
        words.every((w) => /^[A-Z][a-z]*$/.test(w))
      ) {
        this.data.basics.name = trimmed;
        break;
      }
    }
  }

  /**
   * Identify resume sections by detecting common headers
   */
  _identifySections(lines) {
    const sections = {
      summary: [],
      experience: [],
      education: [],
      skills: [],
      projects: [],
      languages: [],
      certifications: [],
      references: [],
    };

    const sectionPatterns = {
      summary: /^(PROFESSIONAL\s+SUMMARY|ABOUT|OBJECTIVE|SUMMARY|PROFILE)/i,
      experience:
        /^(PROFESSIONAL\s+EXPERIENCE|EXPERIENCE|WORK\s+HISTORY|EMPLOYMENT)/i,
      education: /^(EDUCATION|QUALIFICATIONS|ACADEMIC)/i,
      skills: /^(SKILLS|TECHNICAL\s+SKILLS|COMPETENCIES|EXPERTISE)/i,
      projects: /^(PROJECTS|PORTFOLIO|WORK|NOTABLE\s+PROJECTS)/i,
      languages: /^(LANGUAGES|LANGUAGE\s+SKILLS)/i,
      certifications: /^(CERTIFICATIONS|CERTIFICATES|LICENSES)/i,
      references: /^(REFERENCES|REFEREES)/i,
    };

    let currentSection = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Check if line is a section header
      for (const [sectionType, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(trimmed)) {
          currentSection = sectionType;
          break;
        }
      }

      // Add line to current section (skip headers)
      if (
        currentSection &&
        !Object.values(sectionPatterns).some((p) => p.test(trimmed))
      ) {
        sections[currentSection].push(trimmed);
      }
    }

    return sections;
  }

  /**
   * Parse identified section content
   */
  _parseSection(sectionType, sectionLines) {
    switch (sectionType) {
      case "summary":
        this._parseSummary(sectionLines);
        break;
      case "experience":
        this._parseExperience(sectionLines);
        break;
      case "education":
        this._parseEducation(sectionLines);
        break;
      case "skills":
        this._parseSkills(sectionLines);
        break;
      case "projects":
        this._parseProjects(sectionLines);
        break;
      case "languages":
        this._parseLanguages(sectionLines);
        break;
      case "certifications":
        this._parseCertifications(sectionLines);
        break;
      case "references":
        this._parseReferences(sectionLines);
        break;
    }
  }

  /**
   * Parse summary section
   */
  _parseSummary(lines) {
    const summary = lines
      .filter((l) => l.length > 10)
      .slice(0, 3)
      .join(" ");
    if (summary) {
      this.data.basics.summary = summary;
    }
  }

  /**
   * Parse work experience
   */
  _parseExperience(lines) {
    let currentJob = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect job title (usually ALL CAPS or contains common job titles)
      if (this._isJobTitle(trimmed)) {
        if (currentJob && currentJob.position) {
          this.data.work.push(currentJob);
        }
        currentJob = {
          position: trimmed,
          name: "",
          startDate: "",
          endDate: "",
          summary: "",
          highlights: [],
        };
      } else if (currentJob && this._isCompanyName(trimmed)) {
        currentJob.name = trimmed;
      } else if (currentJob && this._isDateRange(trimmed)) {
        const dates = this._parseDateRange(trimmed);
        currentJob.startDate = dates.start;
        currentJob.endDate = dates.end;
      } else if (currentJob && trimmed.length > 10) {
        if (!currentJob.summary) {
          currentJob.summary = trimmed;
        } else {
          currentJob.highlights.push(trimmed);
        }
      }
    }

    if (currentJob && currentJob.position) {
      this.data.work.push(currentJob);
    }
  }

  /**
   * Parse education section
   */
  _parseEducation(lines) {
    let currentEdu = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect degree (Bachelor, Master, PhD, etc.)
      if (this._isDegree(trimmed)) {
        if (currentEdu && currentEdu.studyType) {
          this.data.education.push(currentEdu);
        }
        currentEdu = {
          institution: "",
          studyType: this._extractDegreeType(trimmed),
          area: this._extractStudyArea(trimmed),
          startDate: "",
          endDate: "",
          score: "",
          courses: [],
        };
      } else if (currentEdu && this._isUniversityName(trimmed)) {
        currentEdu.institution = trimmed;
      } else if (currentEdu && this._isDateRange(trimmed)) {
        const dates = this._parseDateRange(trimmed);
        currentEdu.startDate = dates.start;
        currentEdu.endDate = dates.end;
      }
    }

    if (currentEdu && currentEdu.studyType) {
      this.data.education.push(currentEdu);
    }
  }

  /**
   * Parse skills
   */
  _parseSkills(lines) {
    const skills = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 2) continue;

      // Split by commas, slashes, or pipes
      const skillList = trimmed
        .split(/[,/|•]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 1);

      skills.push(...skillList);
    }

    // Group skills by category (if pattern detected)
    const grouped = this._groupSkills(skills);

    for (const category of Object.keys(grouped)) {
      this.data.skills.push({
        name: category,
        level: "proficient",
        keywords: grouped[category],
      });
    }
  }

  /**
   * Parse projects
   */
  _parseProjects(lines) {
    let currentProject = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Project names often start with capital letters and are short
      if (trimmed.length < 100 && this._looksLikeProjectName(trimmed)) {
        if (currentProject && currentProject.name) {
          this.data.projects.push(currentProject);
        }
        currentProject = {
          name: trimmed,
          description: "",
          highlights: [],
          keywords: [],
        };
      } else if (currentProject && trimmed.length > 10) {
        if (!currentProject.description) {
          currentProject.description = trimmed;
        } else {
          currentProject.highlights.push(trimmed);
        }
      }
    }

    if (currentProject && currentProject.name) {
      this.data.projects.push(currentProject);
    }
  }

  /**
   * Parse languages
   */
  _parseLanguages(lines) {
    const languageNames = [
      "English",
      "Spanish",
      "French",
      "German",
      "Chinese",
      "Japanese",
      "Portuguese",
      "Italian",
      "Russian",
      "Dutch",
      "Korean",
      "Arabic",
      "Hindi",
      "Bengali",
      "Swedish",
      "Norwegian",
      "Danish",
      "Finnish",
      "Polish",
      "Turkish",
      "Greek",
      "Hebrew",
      "Vietnamese",
      "Thai",
      "Indonesian",
    ];

    for (const line of lines) {
      for (const lang of languageNames) {
        if (line.toLowerCase().includes(lang.toLowerCase())) {
          const level = this._extractLanguageLevel(line);
          this.data.languages.push({
            language: lang,
            fluency: level,
          });
        }
      }
    }
  }

  /**
   * Parse certifications
   */
  _parseCertifications(lines) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 5) {
        this.data.certifications.push({
          name: trimmed,
          issuer: "",
          date: "",
          url: "",
        });
      }
    }
  }

  /**
   * Parse references
   */
  _parseReferences(lines) {
    let currentRef = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (this._looksLikePersonName(trimmed)) {
        if (currentRef && currentRef.name) {
          this.data.references.push(currentRef);
        }
        currentRef = {
          name: trimmed,
          reference: "",
          contact: "",
        };
      } else if (currentRef && trimmed.includes("@")) {
        currentRef.contact = trimmed;
      }
    }

    if (currentRef && currentRef.name) {
      this.data.references.push(currentRef);
    }
  }

  /**
   * Post-process and clean data
   */
  _postProcess() {
    // Remove duplicates
    this.data.skills = [
      ...new Map(this.data.skills.map((item) => [item.name, item])).values(),
    ];

    // Clean empty entries
    this.data.work = this.data.work.filter((w) => w.position);
    this.data.education = this.data.education.filter((e) => e.studyType);
  }

  // ===== HELPER METHODS =====

  _isJobTitle(text) {
    const jobTitles = [
      "engineer",
      "developer",
      "manager",
      "director",
      "analyst",
      "designer",
      "architect",
      "scientist",
      "specialist",
      "coordinator",
      "consultant",
      "officer",
      "executive",
      "lead",
      "senior",
      "junior",
    ];
    return jobTitles.some((t) => text.toLowerCase().includes(t));
  }

  _isCompanyName(text) {
    const companyIndicators = ["inc", "ltd", "llc", "corp", "co.", "group"];
    return companyIndicators.some((i) => text.toLowerCase().includes(i));
  }

  _isDateRange(text) {
    return /\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(text);
  }

  _parseDateRange(text) {
    // Simple date extraction
    const datePattern =
      /(\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi;
    const dates = text.match(datePattern) || [];
    return {
      start: dates[0] || "",
      end: dates[1] || "present",
    };
  }

  _isDegree(text) {
    const degrees = [
      "bachelor",
      "master",
      "phd",
      "diploma",
      "degree",
      "bs",
      "ba",
      "ms",
      "ma",
      "bsc",
      "msc",
      "associate",
    ];
    return degrees.some((d) => text.toLowerCase().includes(d));
  }

  _extractDegreeType(text) {
    const typeMap = {
      bachelor: "Bachelor",
      master: "Master",
      phd: "PhD",
      diploma: "Diploma",
      associate: "Associate",
    };
    for (const [key, value] of Object.entries(typeMap)) {
      if (text.toLowerCase().includes(key)) return value;
    }
    return "Degree";
  }

  _extractStudyArea(text) {
    // Extract the field of study (usually after "in")
    const match = text.match(/in\s+([a-zA-Z\s]+)/i);
    return match ? match[1].trim() : "General Studies";
  }

  _isUniversityName(text) {
    return (
      text.length > 10 && /university|college|institute|academy/i.test(text)
    );
  }

  _groupSkills(skills) {
    const groups = {
      "Languages & Frameworks": [],
      "Databases & Tools": [],
      "Soft Skills": [],
      Other: [],
    };

    for (const skill of skills) {
      if (
        /javascript|python|java|c\+\+|ruby|php|react|vue|angular|node/i.test(
          skill
        )
      ) {
        groups["Languages & Frameworks"].push(skill);
      } else if (
        /sql|mongodb|mysql|postgres|git|docker|linux|aws/i.test(skill)
      ) {
        groups["Databases & Tools"].push(skill);
      } else if (
        /communication|leadership|teamwork|problem.solving/i.test(skill)
      ) {
        groups["Soft Skills"].push(skill);
      } else {
        groups["Other"].push(skill);
      }
    }

    return Object.fromEntries(
      Object.entries(groups).filter(([_, v]) => v.length > 0)
    );
  }

  _looksLikeProjectName(text) {
    return text.length < 80 && !text.includes("\n");
  }

  _looksLikePersonName(text) {
    const words = text.split(/\s+/);
    return words.length <= 4 && words.every((w) => /^[A-Z][a-z]*$/.test(w));
  }

  _extractLanguageLevel(text) {
    if (/fluent|native|mother\s*tongue/i.test(text)) return "Native Speaker";
    if (/professional|business|advanced/i.test(text)) return "Professional";
    if (/intermediate|intermediate|working/i.test(text))
      return "Working Proficiency";
    return "Elementary";
  }
}

// Export for use
window.EnhancedResumeNormalizer = EnhancedResumeNormalizer;
