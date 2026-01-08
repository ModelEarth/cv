/*
  Resume normalizer
  Exposes window.ResumeNormalizer.normalizeText(text) -> ResumeJSON
  This file contains the parsing heuristics previously embedded in app.js.
*/
(function () {
  function extractEmail(text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(emailRegex);
    return match ? match[0] : "";
  }

  function extractPhone(text) {
    const phoneRegex =
      /(\+?\d{1,3}[-.\s]?)?\(?([0-9]{2,4})\)?[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{3,4})/;
    const match = text.match(phoneRegex);
    return match ? match[0] : "";
  }

  function extractURL(text) {
    const urlRegex = /(https?:\/\/[^\s]+)|(linkedin\.com\/[^\n+s]+)/i;
    const match = text.match(urlRegex);
    return match ? match[0] : "";
  }

  function extractLocation(text) {
    const locationRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2,})/;
    const match = text.match(locationRegex);
    return match ? match[0] : "";
  }

  function identifySections(text) {
    const sections = {};
    const sectionHeaders = [
      "summary",
      "professional summary",
      "about",
      "objective",
      "experience",
      "work experience",
      "employment",
      "education",
      "academic background",
      "skills",
      "technical skills",
      "competencies",
      "projects",
      "portfolio",
    ];

    const lines = text.split("\n").map((l) => l.trim());
    let currentSection = null;
    let currentContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();

      let foundHeader = null;
      for (const header of sectionHeaders) {
        if (lineLower === header || lineLower.startsWith(header)) {
          foundHeader = header;
          break;
        }
      }

      if (foundHeader) {
        if (currentSection) {
          sections[currentSection] = currentContent.join("\n").trim();
        }
        currentSection = foundHeader;
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    if (currentSection) {
      sections[currentSection] = currentContent.join("\n").trim();
    }

    return sections;
  }

  function parseWorkExperience(text) {
    if (!text) return [];

    const jobs = [];
    const blocks = text.split(/\n\s*\n/).filter((b) => b.trim().length > 0);

    for (const block of blocks) {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length === 0) continue;

      const position = lines[0] || "";
      const company = lines[1] || "";

      const dateRegex = /(\w+\.?\s+\d{4})\s*[-–—]\s*(\w+\.?\s+\d{4}|Present)/i;
      const dateMatch = block.match(dateRegex);
      const startDate = dateMatch ? dateMatch[1] : "";
      const endDate = dateMatch ? dateMatch[2] : "";

      const summary = lines.slice(2).join(" ");

      jobs.push({
        position: position,
        company: company,
        startDate: startDate,
        endDate: endDate,
        summary: summary,
      });
    }

    return jobs;
  }

  function parseEducation(text) {
    if (!text) return [];

    const education = [];
    const blocks = text.split(/\n\s*\n/).filter((b) => b.trim().length > 0);

    for (const block of blocks) {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length === 0) continue;

      const institution = lines[0] || "";
      const degree = lines[1] || "";

      const dateRegex = /(\w+\.?\s+\d{4})\s*[-–—]\s*(\w+\.?\s+\d{4}|Present)/i;
      const dateMatch = block.match(dateRegex);
      const startDate = dateMatch ? dateMatch[1] : "";
      const endDate = dateMatch ? dateMatch[2] : "";

      let studyType = "Degree";
      let area = "";

      if (degree.toLowerCase().includes("master")) {
        studyType = "Master's";
        area = degree.replace(/master'?s?\s*(in|of)?/i, "").trim();
      } else if (degree.toLowerCase().includes("bachelor")) {
        studyType = "Bachelor's";
        area = degree.replace(/bachelor'?s?\s*(in|of)?/i, "").trim();
      } else {
        area = degree;
      }

      const locationRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2,})/;
      const locationMatch = block.match(locationRegex);
      const location = locationMatch ? locationMatch[0] : "";

      education.push({
        institution: institution,
        studyType: studyType,
        area: area,
        startDate: startDate,
        endDate: endDate,
        location: location,
      });
    }

    return education;
  }

  function parseSkills(text) {
    if (!text) return [];

    const skills = [];
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const name = line.substring(0, colonIndex).trim();
        const keywordsStr = line.substring(colonIndex + 1).trim();
        const keywords = keywordsStr
          .split(/[,;•|]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        skills.push({ name: name, keywords: keywords });
      } else {
        const keywords = line
          .split(/[,;•|]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        if (keywords.length > 0) {
          skills.push({ name: "Skills", keywords: keywords });
        }
      }
    }

    return skills;
  }

  function parseProjects(text) {
    if (!text) return [];

    const projects = [];
    const blocks = text.split(/\n\s*\n/).filter((b) => b.trim().length > 0);

    for (const block of blocks) {
      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length === 0) continue;

      const name = lines[0] || "";
      const keywordsRegex = /\|([^|]+)$/;
      const keywordsMatch = name.match(keywordsRegex);
      let keywords = [];
      let cleanName = name;

      if (keywordsMatch) {
        keywords = keywordsMatch[1].split(/[,;]/).map((s) => s.trim());
        cleanName = name.replace(keywordsRegex, "").trim();
      }

      const summary = lines.slice(1).join(" ");

      projects.push({ name: cleanName, keywords: keywords, summary: summary });
    }

    return projects;
  }

  function normalizeText(text) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const name = lines[0] || "Resume";
    const email = extractEmail(text);
    const phone = extractPhone(text);
    const url = extractURL(text);
    const location = extractLocation(text);

    const sections = identifySections(text);

    const resumeData = {
      basics: {
        name: name,
        label: lines[1] || "",
        email: email,
        phone: phone,
        url: url,
        location: location,
        summary: sections.summary || sections.about || "",
      },
      work: parseWorkExperience(sections.experience || sections.work || ""),
      education: parseEducation(sections.education || ""),
      skills: parseSkills(
        sections.skills || sections["technical skills"] || ""
      ),
      projects: parseProjects(sections.projects || ""),
    };

    return resumeData;
  }

  window.ResumeNormalizer = {
    normalizeText,
  };
})();
