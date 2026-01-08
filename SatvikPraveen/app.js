// ==================== TEXT NORMALIZATION ====================
// Clean and normalize PDF text with malformed spacing
function cleanAndNormalizeText(text) {
  if (!text) return "";

  let cleaned = text
    // Replace multiple spaces/tabs with single space
    .replace(/[ \t]+/g, " ")
    // Normalize common dash characters
    .replace(/[-–—]/g, "-")
    // Clean up EXCESSIVE newlines (3+ becomes 2) but preserve structure-defining blank lines
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    // Remove spaces before common punctuation
    .replace(/\s+([.,;:])/g, "$1")
    .trim();

  return cleaned;
}

// ==================== STATE MANAGEMENT ====================
let STATE = {
  pdfFile: null,
  pdfArrayBuffer: null,
  rawText: "",
  resumeData: null,
  currentTemplate: null,
};

// Demo sample data used to render template previews when no resume is loaded
const SAMPLE_DATA = {
  basics: {
    name: "Jane Doe",
    label: "Product Designer",
    email: "jane.doe@example.com",
    phone: "+1 555-123-4567",
    url: "https://janedoe.design",
    location: "San Francisco, CA",
    summary:
      "Creative product designer with 8+ years building delightful user experiences across web and mobile platforms.",
  },
  work: [
    {
      position: "Senior Product Designer",
      company: "Acme Corp",
      startDate: "Jan 2020",
      endDate: "Present",
      summary:
        "Leading design for core web products. Focused on usability, accessibility, and scalable design systems.",
    },
  ],
  education: [
    {
      institution: "University of Design",
      studyType: "Bachelor's",
      area: "Interaction Design",
      startDate: "2010",
      endDate: "2014",
      location: "Boston, MA",
    },
  ],
  skills: [
    { name: "Design", keywords: ["Figma", "Sketch", "Prototyping"] },
    { name: "Front-end", keywords: ["HTML", "CSS", "JavaScript"] },
  ],
  projects: [
    {
      name: "Design System Revamp",
      keywords: ["Design System", "Accessibility"],
      summary:
        "Led a cross-functional initiative to standardize components and tokens.",
    },
  ],
};

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", function () {
  console.log("[Init] DOMContentLoaded fired");
  initializeEventListeners();
  renderSamplePreview();
  console.log("[Init] ✅ Initialization complete");
});

function initializeEventListeners() {
  console.log("[Init] Starting event listener setup...");

  // File upload
  const pdfInput = document.getElementById("pdfInput");
  const uploadBox = document.getElementById("uploadBox");
  const parseBtn = document.getElementById("parseBtn");
  const removeFile = document.getElementById("removeFile");

  if (!pdfInput) console.error("[Init] pdfInput not found!");
  if (!uploadBox) console.error("[Init] uploadBox not found!");
  if (!parseBtn) console.error("[Init] parseBtn not found!");
  if (!removeFile) console.error("[Init] removeFile not found!");

  pdfInput.addEventListener("change", handleFileSelect);
  console.log("[Init] ✅ File input change listener attached");

  parseBtn.addEventListener("click", handleParsePDF);
  console.log("[Init] ✅ Parse button click listener attached");

  removeFile.addEventListener("click", handleRemoveFile);

  // Drag and drop
  uploadBox.addEventListener("dragover", handleDragOver);
  uploadBox.addEventListener("dragleave", handleDragLeave);
  uploadBox.addEventListener("drop", handleDrop);
  console.log("[Init] ✅ Drag and drop listeners attached");

  // Tabs
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", handleTabSwitch);
  });
  console.log("[Init] ✅ Tab listeners attached");

  // Template cards
  const templateCards = document.querySelectorAll(".template-card");
  templateCards.forEach((card) => {
    card.addEventListener("click", handleTemplateSelect);
  });
  console.log("[Init] ✅ Template card listeners attached");

  // Export buttons
  document.getElementById("exportBtn").addEventListener("click", handleExport);
  document
    .getElementById("downloadJsonBtn")
    .addEventListener("click", handleDownloadJSON);
  document.getElementById("printBtn").addEventListener("click", handlePrint);
}

// Show a sample preview on page load so the resume container isn't blank
function renderSamplePreview() {
  const defaultTemplate = "classic";
  STATE.currentTemplate = defaultTemplate;

  // mark the default card active
  const defaultCard = document.querySelector(
    `.template-card[data-template="${defaultTemplate}"]`
  );
  if (defaultCard) defaultCard.classList.add("active");

  // Render sample data into the preview area
  renderCurrentTemplate();
}

// ==================== FILE HANDLING ====================
function handleFileSelect(e) {
  console.log("[File Upload] File select triggered");
  console.log("[File Upload] event.target.files:", e.target.files);

  const file = e.target.files[0];
  if (!file) {
    console.warn("[File Upload] No file selected");
    return;
  }

  console.log(
    "[File Upload] File selected:",
    file.name,
    "Size:",
    file.size,
    "Type:",
    file.type
  );

  if (!file.type.includes("pdf")) {
    console.error("[File Upload] Not a PDF file, type is:", file.type);
    alert("Please upload a PDF file.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    console.error("[File Upload] File too large:", file.size);
    alert("File size exceeds 10MB. Please upload a smaller file.");
    return;
  }

  STATE.pdfFile = file;
  console.log("[File Upload] File saved to STATE");

  // Read file as ArrayBuffer
  const reader = new FileReader();

  reader.onload = function (event) {
    console.log(
      "[File Upload] FileReader onload - buffer size:",
      event.target.result.byteLength
    );
    STATE.pdfArrayBuffer = event.target.result;
    showFileInfo(file.name);
    document.getElementById("parseBtn").disabled = false;
    console.log("[File Upload] ✅ File ready to parse");
  };

  reader.onerror = function (error) {
    console.error("[File Upload] FileReader error:", error);
    alert("Failed to read file: " + error);
  };

  reader.readAsArrayBuffer(file);
  console.log("[File Upload] Started reading file as ArrayBuffer");
}

function handleRemoveFile() {
  STATE = {
    pdfFile: null,
    pdfArrayBuffer: null,
    rawText: "",
    resumeData: null,
    currentTemplate: null,
  };

  document.getElementById("pdfInput").value = "";
  document.getElementById("fileInfo").classList.add("is-hidden");
  document.getElementById("parseBtn").disabled = true;

  // Reset UI
  resetDataSection();
  disableTemplates();
  resetPreview();
}

function showFileInfo(fileName) {
  document.getElementById("fileName").textContent = fileName;
  document.getElementById("fileInfo").classList.remove("is-hidden");
}

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.style.borderColor = "var(--primary)";
  e.currentTarget.style.background = "rgba(59, 130, 246, 0.05)";
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.style.borderColor = "var(--border-light)";
  e.currentTarget.style.background = "var(--bg-elevated)";
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  const uploadBox = e.currentTarget;
  uploadBox.style.borderColor = "var(--border-light)";
  uploadBox.style.background = "var(--bg-elevated)";

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    document.getElementById("pdfInput").files = files;
    handleFileSelect({ target: { files: files } });
  }
}

// ==================== PDF PARSING ====================
async function handleParsePDF() {
  console.log("[PDF Parsing] Starting...");

  if (!STATE.pdfArrayBuffer) {
    console.error("[PDF Parsing] No PDF buffer available");
    alert("Please select a PDF file first.");
    return;
  }

  showLoading(true);

  try {
    // Check if PDFTextExtractor is available
    console.log("[PDF Parsing] Checking PDFTextExtractor...");
    console.log(
      "[PDF Parsing] window.PDFTextExtractor =",
      typeof window.PDFTextExtractor
    );
    console.log("[PDF Parsing] window.pdfjsLib =", typeof window.pdfjsLib);

    if (!window.PDFTextExtractor || !PDFTextExtractor.extractText) {
      throw new Error(
        "PDFTextExtractor module not available. window.PDFTextExtractor=" +
          typeof window.PDFTextExtractor
      );
    }

    console.log("[PDF Parsing] Extracting text from PDF...");
    const extracted = await PDFTextExtractor.extractText(STATE.pdfArrayBuffer);
    STATE.rawText = extracted || "";
    console.log("[PDF Parsing] Text extracted. Length:", STATE.rawText.length);

    // Parse text into structured data
    console.log("[PDF Parsing] Parsing resume text...");
    STATE.resumeData = parseResumeText(STATE.rawText);
    console.log("[PDF Parsing] Resume data parsed:");
    console.log(
      "[PDF Parsing]   - Work entries:",
      STATE.resumeData.work.length
    );
    console.log(
      "[PDF Parsing]   - Education entries:",
      STATE.resumeData.education.length
    );
    console.log("[PDF Parsing]   - Skills:", STATE.resumeData.skills.length);

    // Update UI
    console.log("[PDF Parsing] Updating UI...");
    updateDataSection();
    enableTemplates();

    showLoading(false);
    console.log("[PDF Parsing] ✅ Complete!");

    // Auto-select first template
    console.log("[PDF Parsing] Clicking classic template...");
    const classicBtn = document.querySelector(
      '.template-card[data-template="classic"]'
    );
    if (classicBtn) {
      classicBtn.click();
    } else {
      console.warn("[PDF Parsing] Classic template button not found");
    }
  } catch (error) {
    console.error("[PDF Parsing] ❌ ERROR:", error);
    console.error("[PDF Parsing] Stack:", error.stack);
    alert("Failed to parse PDF:\n\n" + error.message);
    showLoading(false);
  }
}

function showLoading(show) {
  const loading = document.getElementById("loadingIndicator");
  const parseBtn = document.getElementById("parseBtn");

  if (show) {
    loading.classList.remove("is-hidden");
    parseBtn.disabled = true;
  } else {
    loading.classList.add("is-hidden");
    parseBtn.disabled = false;
  }
}

// ==================== TEXT PARSING ====================
function parseResumeText(text) {
  // CRITICAL: Clean text FIRST to handle malformed PDF spacing
  const cleanedText = cleanAndNormalizeText(text);

  console.log("parseResumeText - Raw text length:", text.length);
  console.log("parseResumeText - Cleaned text length:", cleanedText.length);
  console.log(
    "parseResumeText - First 500 chars:",
    cleanedText.substring(0, 500)
  );

  // CRITICAL DEBUG: Show full cleaned text in console for inspection
  console.log("=== FULL CLEANED TEXT ===");
  console.log(cleanedText);
  console.log("=== END CLEANED TEXT ===");

  // Fallback: local/robust parsing (primary method)
  const lines = cleanedText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  console.log("parseResumeText - Total lines after split:", lines.length);

  // Extract basic info - handle pipe-separated contact info
  let name = lines[0] || "Resume";
  // Extract name from first line before pipe
  if (name.includes("|")) {
    let namePart = name.split("|")[0].trim();
    // Remove phone/numbers: "Shanmuga Priya Kannan 872 - 330 - 3203" → "Shanmuga Priya Kannan"
    namePart = namePart
      .replace(/\s+\d+\s*[-–—]\s*\d+\s*[-–—]\s*\d+\s*$/, "")
      .trim();
    name = namePart;
  }

  const email = extractEmail(cleanedText);
  const phone = extractPhone(cleanedText);
  const url = extractURL(cleanedText);
  const location = extractLocation(cleanedText);

  // Extract sections
  const sections = identifySections(cleanedText);
  console.log(
    "parseResumeText - Sections found:",
    Object.keys(sections),
    sections
  );

  // Build resume data object
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
    skills: parseSkills(sections.skills || sections["technical skills"] || ""),
    projects: parseProjects(sections.projects || ""),
  };

  console.log("parseResumeText - Final resumeData:", resumeData);

  // Clean up common formatting issues
  const cleanedData = cleanupResumeData(resumeData);

  return cleanedData;
}

function extractEmail(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : "";
}

function extractPhone(text) {
  const phoneRegex =
    /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
  const match = text.match(phoneRegex);
  return match ? match[0] : "";
}

function extractURL(text) {
  const urlRegex = /(https?:\/\/[^\s]+)|(linkedin\.com\/[^\s]+)/i;
  const match = text.match(urlRegex);
  return match ? match[0] : "";
}

function extractLocation(text) {
  // Look for location in the FIRST 10 lines only (header section)
  // This avoids matching locations from education/work experience sections
  const lines = text.split("\n").slice(0, 10).join("\n");

  // Look for city, state/country patterns
  // But exclude patterns like "Computer Science Chicago" (degree field with city)
  // We're looking for just "City, State" patterns in contact info
  const locationRegex =
    /(?<![\s\w])([A-Z][a-z]+),\s*([A-Z]{2}|[A-Z][a-z]+)(?![a-z])/;
  const match = lines.match(locationRegex);
  return match ? match[0] : "";
}

function identifySections(text) {
  const sections = {};

  // Section patterns with flexibility for spaced letters (E DUCATION, E XPERIENCE, etc.)
  // Using array to control order - check TECHNICAL SKILLS before SKILLS to avoid partial matches
  const sectionPatterns = [
    {
      sectionName: "education",
      pattern:
        /(?:^|\n)\s*(?:E\s*D\s*U\s*C\s*A\s*T\s*I\s*O\s*N|EDUCATION|ACADEMIC)\s*(?:\n|$)/gi,
    },
    {
      sectionName: "experience",
      pattern:
        /(?:^|\n)\s*(?:E\s*X\s*P\s*E\s*R\s*I\s*E\s*N\s*C\s*E|EXPERIENCE|PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE)\s*(?:\n|$)/gi,
    },
    {
      sectionName: "projects",
      pattern:
        /(?:^|\n)\s*(?:P\s*R\s*O\s*J\s*E\s*C\s*T\s*S|PROJECTS|PORTFOLIO)\s*(?:\n|$)/gi,
    },
    {
      sectionName: "skills",
      pattern:
        /(?:^|\n)\s*(?:T\s*E\s*C\s*H\s*N\s*I\s*C\s*A\s*L\s+S\s*K\s*I\s*L\s*L\s*S|TECHNICAL\s+SKILLS|SKILLS)\s*(?:\n|$)/gi,
    },
    {
      sectionName: "summary",
      pattern: /(?:^|\n)\s*(?:PROFESSIONAL\s+SUMMARY|SUMMARY)\s*(?:\n|$)/gi,
    },
    {
      sectionName: "certifications",
      pattern: /(?:^|\n)\s*(?:CERTIFICATIONS|LICENSES)\s*(?:\n|$)/gi,
    },
    { sectionName: "languages", pattern: /(?:^|\n)\s*LANGUAGES\s*(?:\n|$)/gi },
  ];

  const headerMatches = [];

  // Find all section headers
  for (const { sectionName, pattern } of sectionPatterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      headerMatches.push({
        sectionName: sectionName,
        headerText: match[0],
        index: match.index,
        length: match[0].length,
      });
    }
  }

  // Sort by position in text
  headerMatches.sort((a, b) => a.index - b.index);

  // Remove duplicates AND remove LANGUAGES if SKILLS exists (likely same section with spaced text)
  const uniqueMatches = [];
  const seenSections = new Set();

  for (const match of headerMatches) {
    // Skip LANGUAGES if we already have SKILLS - they're often in the same section in this resume
    if (match.sectionName === "languages" && seenSections.has("skills")) {
      continue;
    }

    if (!seenSections.has(match.sectionName)) {
      uniqueMatches.push(match);
      seenSections.add(match.sectionName);
    }
  }

  console.log(
    "Headers found:",
    uniqueMatches.map((h) => `${h.sectionName}@${h.index}`)
  );

  // Log the index positions to help debug section boundaries
  for (let i = 0; i < uniqueMatches.length; i++) {
    const current = uniqueMatches[i];
    const next = uniqueMatches[i + 1];
    const startIdx = current.index + current.length;
    const endIdx = next ? next.index : text.length;
    const headerText = text
      .substring(current.index, Math.min(current.index + 30, text.length))
      .replace(/\n/g, " ");
    console.log(
      `[Section: ${current.sectionName}] Header: "${headerText}..." at index ${current.index}`
    );
    console.log(
      `  Content from ${startIdx} to ${endIdx} (${endIdx - startIdx} chars)`
    );
  }

  // Extract content between section headers
  for (let i = 0; i < uniqueMatches.length; i++) {
    const current = uniqueMatches[i];
    const next = uniqueMatches[i + 1];

    // Start after the header
    let startIndex = current.index + current.length;

    // For EXPERIENCE section, look back to capture job title/company if it's on same line or right before the date
    // This handles cases where the job info is between the header and next section
    if (current.sectionName === "experience" && next) {
      // Look ahead to find if there's a line with a date pattern right after the header
      const sectionPreview = text.substring(
        startIndex,
        Math.min(startIndex + 500, text.length)
      );
      // If the section starts with description text (not a job title), search backwards from next header
      if (
        !/^\s*[A-Z][A-Za-z\s&(),-]+\s*([-–—]|[0-9]+|$)/.test(sectionPreview)
      ) {
        // No immediate job title found, look in content before next section for job entries
        // Include more context from before the next section
        startIndex = current.index + current.length;
      }
    }

    // End at the next header (or end of text)
    const endIndex = next ? next.index : text.length;

    let content = text.substring(startIndex, endIndex).trim();

    // Remove leading newlines/spaces
    content = content.replace(/^\s+/, "");

    if (content.length > 0) {
      sections[current.sectionName] = content;
      console.log(`✓ ${current.sectionName}: ${content.substring(0, 80)}...`);
    }
  }

  console.log("Sections extracted:", Object.keys(sections));
  return sections;
}

function parseWorkExperience(text) {
  if (!text) return [];

  const jobs = [];

  // Find jobs by looking for date patterns: "Month Year - Month Year" or "Month Year - Present"
  const datePattern =
    /([A-Z][a-z]+\.?\s+\d{4})\s*[-–—]\s*((?:[A-Z][a-z]+\.?\s+\d{4})|Present)/g;

  const dateMatches = [];
  let match;
  while ((match = datePattern.exec(text)) !== null) {
    dateMatches.push({
      fullDate: match[0],
      startDate: match[1],
      endDate: match[2],
      index: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  if (dateMatches.length === 0) return [];

  // Extract job info for each date
  for (let i = 0; i < dateMatches.length; i++) {
    const dateInfo = dateMatches[i];
    const nextDateInfo = dateMatches[i + 1];

    // Find the header by working BACKWARDS from the date
    // The header consists of the 1-2 lines immediately before the date
    const linesBefore = text.substring(0, dateInfo.index);
    const headerLines = linesBefore
      .split("\n")
      .reverse() // Reverse to find the last lines before date
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Take first 2 non-empty lines (they may be position and company, or position (company))
    let position = "";
    let company = "";

    if (headerLines.length >= 2) {
      position = headerLines[1]; // Second-to-last non-empty line
      company = headerLines[0]; // Last non-empty line before date
    } else if (headerLines.length === 1) {
      position = headerLines[0]; // Only one line
    }

    // Get text AFTER the date (description)
    let descStart = dateInfo.endIndex;
    let descEnd = nextDateInfo ? nextDateInfo.index : text.length;
    let description = text.substring(descStart, descEnd).trim();

    // Strip out the next job's position/company header if present
    if (nextDateInfo) {
      // Extract text before next date and find the header lines (non-bullet lines at the end)
      const beforeNextDate = text.substring(0, nextDateInfo.index);
      const allLines = beforeNextDate.split("\n");

      // Find header lines working backwards from the end
      const nextJobHeaderLines = [];
      for (let j = allLines.length - 1; j >= 0; j--) {
        const line = allLines[j].trim();
        if (line.length === 0) {
          // Stop at blank line if we already found header lines
          if (nextJobHeaderLines.length > 0) break;
        } else if (!line.startsWith("•")) {
          // Non-bullet line is likely part of next job's header
          nextJobHeaderLines.unshift(line);
          if (nextJobHeaderLines.length >= 2) break; // Only need position and company
        }
      }

      // Remove these header lines from the description
      if (nextJobHeaderLines.length > 0) {
        const headerText = nextJobHeaderLines.join("\n");
        if (description.includes(headerText)) {
          description = description.replace(headerText, "").trim();
        }
      }
    }

    jobs.push({
      position: position,
      company: company,
      startDate: dateInfo.startDate,
      endDate: dateInfo.endDate,
      summary: description,
    });
  }

  return jobs;
}

function parseEducation(text) {
  if (!text) return [];

  const education = [];

  // Debug: log the actual text being parsed
  if (text && text.length > 0) {
    console.log(
      "[parseEducation] Received text:",
      text.substring(0, 150),
      "... (length:",
      text.length,
      ")"
    );
  }

  // Strategy: Find all date ranges first (these are our anchors)
  // Then extract institution/degree/location around each date
  // Format: [Institution] [StartDate - EndDate] [Degree] [Location]

  const dateRangePattern =
    /([A-Z][a-z]+\.?\s+\d{4})\s*[-–—]\s*((?:[A-Z][a-z]+\.?\s+\d{4})|Present)/g;
  let dateMatch;
  const dateMatches = [];

  while ((dateMatch = dateRangePattern.exec(text)) !== null) {
    dateMatches.push({
      fullMatch: dateMatch[0],
      startDate: dateMatch[1],
      endDate: dateMatch[2],
      index: dateMatch.index,
    });
  }

  console.log(`[parseEducation] Found ${dateMatches.length} date ranges`);
  dateMatches.forEach((dm, i) => {
    console.log(`  Date ${i + 1}: "${dm.fullMatch}" at index ${dm.index}`);
  });

  // Process each date range found
  for (let i = 0; i < dateMatches.length; i++) {
    const current = dateMatches[i];
    const next = dateMatches[i + 1];

    // Extract institution: look backward from date for institution keywords
    // Strategy: Find all institutions before this date, take the one closest to date
    let institution = "";
    const beforeDateText = text.substring(
      Math.max(0, current.index - 200),
      current.index
    );
    // Find all institution occurrences
    const institutionKeywords = [
      "University",
      "College",
      "Institute",
      "School",
      "Academy",
    ];
    let closestInstitution = null;
    let closestIndex = -1;

    for (const keyword of institutionKeywords) {
      let searchStart = 0;
      let idx;
      // Find all occurrences of this keyword
      while ((idx = beforeDateText.indexOf(keyword, searchStart)) !== -1) {
        if (idx > closestIndex) {
          closestIndex = idx;
          // Extract institution name before this keyword
          const beforeThis = beforeDateText.substring(0, idx);
          // Look for the start of institution name (typically one or two words)
          // Go backward to find capitalized word(s) - match SHORT names only
          const nameMatch = beforeThis.match(
            /([A-Z][A-Za-z&()]*(?:\s+[A-Z][A-Za-z&()]*)?)\s*$/
          );
          if (nameMatch) {
            closestInstitution = nameMatch[1].trim() + " " + keyword;
          }
        }
        searchStart = idx + 1;
      }
    }

    if (closestInstitution) {
      institution = closestInstitution;
    }

    // Extract degree and area: look forward from date end for degree keywords
    let studyType = "Degree";
    let area = "";
    const afterDateStart = current.index + current.fullMatch.length;
    let afterDateText;

    // Determine end point for extracting text after date
    // Use next date as boundary if available
    if (next) {
      afterDateText = text.substring(afterDateStart, next.index);
    } else {
      afterDateText = text.substring(afterDateStart, afterDateStart + 200);
    }

    // BRUTE FORCE: Look for degree keywords directly in the text
    console.log(
      `[Entry ${i + 1}] afterDateText (${
        afterDateText.length
      }): "${afterDateText.substring(0, 150).replace(/\n/g, "\\n")}"`
    );

    let degreeFound = false;
    let degreeType = "";
    let fieldOfStudy = "";
    let location = "";

    // Look for each degree keyword
    const degrees = [
      { keyword: "Master's", type: "Master's" },
      { keyword: "Master", type: "Master's" },
      { keyword: "Bachelor's", type: "Bachelor's" },
      { keyword: "Bachelor", type: "Bachelor's" },
      { keyword: "PhD", type: "PhD" },
      { keyword: "Doctorate", type: "PhD" },
    ];

    for (const degreeInfo of degrees) {
      // Case-insensitive search
      const upperText = afterDateText.toUpperCase();
      const upperKeyword = degreeInfo.keyword.toUpperCase();
      const idx = upperText.indexOf(upperKeyword);

      if (idx !== -1) {
        degreeType = degreeInfo.type;
        console.log(
          `[Entry ${i + 1}] Found degree: "${
            degreeInfo.keyword
          }" at position ${idx}`
        );

        // Extract field: Look for "in/of [field]" after the degree keyword
        const afterKeyword = afterDateText.substring(
          idx + degreeInfo.keyword.length
        );

        // Look for "in/of [field]" - stop at location (City, Country) or end of line
        // Location indicators: Capital City, Capital Country/State
        let fieldMatch = afterKeyword.match(
          /\s*(?:in|of)\s+([A-Za-z\s&(),-]+?)(?=\s+[A-Z][a-z]+,\s*[A-Z]|,|\n|$)/i
        );

        if (fieldMatch && fieldMatch[1]) {
          // Clean the field - remove location part if present
          let field = fieldMatch[1].trim();
          // Remove anything after "City," pattern
          field = field.replace(/\s+[A-Z][a-z]+,.*$/, "").trim();
          fieldOfStudy = field;
          console.log(`[Entry ${i + 1}] Found field: "${fieldOfStudy}"`);
        }

        // Extract location (City, Country) - look for comma-separated location pattern
        const locationMatch = afterKeyword.match(
          /\s+([A-Z][a-z]+),\s*([A-Z][A-Za-z]{1,10})/
        );
        if (locationMatch) {
          location = `${locationMatch[1]}, ${locationMatch[2]}`;
          console.log(`[Entry ${i + 1}] Found location: "${location}"`);
        }

        degreeFound = true;
        break;
      }
    }

    if (degreeFound) {
      studyType = degreeType;
      area = fieldOfStudy || degreeType;
      console.log(
        `[Entry ${
          i + 1
        }] ✓ Degree matched: type="${studyType}", field="${area}"`
      );
    } else {
      console.log(`[Entry ${i + 1}] ✗ NO DEGREE FOUND`);
    }

    // Only add if we found at least institution and dates
    // AND: We must have found a degree (studyType should not be the default "Degree" unless we specifically set it)
    // This filters out entries that are jobs, not education
    const isDegreeType =
      studyType === "Master's" ||
      studyType === "Bachelor's" ||
      studyType === "PhD";
    if (institution && current.startDate && current.endDate && isDegreeType) {
      education.push({
        institution: institution,
        studyType: studyType,
        area: area || institution,
        startDate: current.startDate,
        endDate: current.endDate,
        location: location,
      });
      console.log(
        `[parseEducation] Added entry: ${institution} (${studyType})`
      );
    } else {
      console.log(
        `[parseEducation] SKIPPED entry - institution:${!!institution}, startDate:${!!current.startDate}, endDate:${!!current.endDate}, isDegreeType:${isDegreeType}, studyType:${studyType}`
      );
    }
  }

  console.log(
    `[parseEducation] Returning ${education.length} education entries`
  );

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
    // Check if line has a category (e.g., "Programming Languages: Java, Python")
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const name = line.substring(0, colonIndex).trim();
      const keywordsStr = line.substring(colonIndex + 1).trim();

      // Split keywords while preserving content in parentheses
      const keywords = [];
      let current = "";
      let parenDepth = 0;

      for (let i = 0; i < keywordsStr.length; i++) {
        const char = keywordsStr[i];
        if (char === "(") {
          parenDepth++;
          current += char;
        } else if (char === ")") {
          parenDepth--;
          current += char;
        } else if (
          (char === "," || char === ";" || char === "•" || char === "|") &&
          parenDepth === 0
        ) {
          // This is a separator and we're not inside parentheses
          if (current.trim().length > 0) {
            keywords.push(current.trim());
          }
          current = "";
        } else {
          current += char;
        }
      }

      // Add the last keyword
      if (current.trim().length > 0) {
        keywords.push(current.trim());
      }

      if (keywords.length > 0) {
        skills.push({
          name: name,
          keywords: keywords,
        });
      }
    } else {
      // Just a list of skills
      const keywords = line
        .split(/[,;•|]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (keywords.length > 0) {
        skills.push({
          name: "Skills",
          keywords: keywords,
        });
      }
    }
  }

  return skills;
}

function parseProjects(text) {
  if (!text) return [];

  const projects = [];

  // Strategy: Split text into sections by finding project headers
  // Project header format: "Project Name | tech1, tech2"
  // The key is to ONLY capture techs on the SAME line as the pipe, not beyond first newline
  // Don't use ^ anchor - projects might not start at beginning of line in PDF text

  const headerPattern = /([A-Z][A-Za-z0-9\s\-&()]+?)\s*\|\s*([^\n]*)(?=\n|$)/g;

  let headerMatch;
  const headers = [];

  while ((headerMatch = headerPattern.exec(text)) !== null) {
    headers.push({
      name: headerMatch[1].trim(),
      techsRaw: headerMatch[2].trim(),
      index: headerMatch.index,
      matchLength: headerMatch[0].length,
    });
  }

  console.log(`[parseProjects] Found ${headers.length} project headers`);

  // For each header, extract techs and description
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];

    // Extract techs from the header line (between | and end of line, or until bullet)
    let techs = header.techsRaw;
    let description = ""; // IMPORTANT: techs might contain bullet on same line OR newline separates techs from description
    // Handle bullet on same line first
    if (techs.includes("•")) {
      const bulletIndex = techs.indexOf("•");
      // Text before bullet = techs, after = description start
      techs = techs.substring(0, bulletIndex).trim();
      // Description starts after the bullet
      let restOfDescription = header.techsRaw.substring(bulletIndex);

      // Get text from end of header line to start of next project or end
      const headerEnd = header.index + header.matchLength;
      const nextHeaderIndex =
        i + 1 < headers.length ? headers[i + 1].index : text.length;
      const fullDescription = text.substring(headerEnd, nextHeaderIndex).trim();

      description =
        restOfDescription + (fullDescription ? "\n" + fullDescription : "");
    } else {
      // No bullet in header line - description is everything after this header until next project
      const headerEnd = header.index + header.matchLength;
      const nextHeaderIndex =
        i + 1 < headers.length ? headers[i + 1].index : text.length;
      description = text.substring(headerEnd, nextHeaderIndex).trim();
    }

    // Parse techs into keywords array - split by comma/semicolon, filter out descriptions
    const keywords = techs
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter((s) => {
        // Filter: non-empty, no bullets, no newlines, not just whitespace
        if (!s || s === "•" || /[\n]/.test(s) || /^[\s]*$/.test(s))
          return false;
        return true;
      });

    // Clean description - remove bullets, collapse whitespace
    description = description
      .split("\n")
      .map((line) => line.replace(/^•\s*/, "").trim())
      .filter((line) => line.length > 0)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    // Add project
    if (header.name && (keywords.length > 0 || description.length > 0)) {
      projects.push({
        name: header.name,
        keywords: keywords,
        summary: description,
      });
    }
  }

  return projects;
}

// ==================== DATA CLEANUP ====================
function cleanupResumeData(resumeData) {
  // Clean common formatting issues from extracted data
  const cleaned = JSON.parse(JSON.stringify(resumeData)); // Deep copy

  // Fix common company name issues
  const companyFixes = {
    "Service - now": "ServiceNow",
    "service - now": "ServiceNow",
    "Service -": "Service",
  };

  // Apply company fixes
  if (cleaned.work && Array.isArray(cleaned.work)) {
    cleaned.work.forEach((job) => {
      // Fix company name
      for (const [bad, good] of Object.entries(companyFixes)) {
        if (job.company && job.company.includes(bad)) {
          job.company = job.company.replace(bad, good);
        }
      }
      // Also fix position field
      for (const [bad, good] of Object.entries(companyFixes)) {
        if (job.position && job.position.includes(bad)) {
          job.position = job.position.replace(bad, good);
        }
      }
      // Remove extra spaces
      if (job.company) job.company = job.company.replace(/\s+/g, " ").trim();
      if (job.position) job.position = job.position.replace(/\s+/g, " ").trim();
    });
  }

  // Clean education data
  if (cleaned.education && Array.isArray(cleaned.education)) {
    cleaned.education.forEach((edu) => {
      if (edu.institution)
        edu.institution = edu.institution.replace(/\s+/g, " ").trim();
      if (edu.area) edu.area = edu.area.replace(/\s+/g, " ").trim();
      if (edu.location) edu.location = edu.location.replace(/\s+/g, " ").trim();
    });
  }

  // Clean projects
  if (cleaned.projects && Array.isArray(cleaned.projects)) {
    cleaned.projects.forEach((project) => {
      if (project.name) project.name = project.name.replace(/\s+/g, " ").trim();
      if (project.summary)
        project.summary = project.summary.replace(/\s+/g, " ").trim();
      if (project.keywords && Array.isArray(project.keywords)) {
        project.keywords = project.keywords.map((k) =>
          k.replace(/\s+/g, " ").trim()
        );
      }
    });
  }

  // Clean skills
  if (cleaned.skills && Array.isArray(cleaned.skills)) {
    cleaned.skills.forEach((skillGroup) => {
      if (skillGroup.name)
        skillGroup.name = skillGroup.name.replace(/\s+/g, " ").trim();
      if (skillGroup.keywords && Array.isArray(skillGroup.keywords)) {
        skillGroup.keywords = skillGroup.keywords.map((k) =>
          k.replace(/\s+/g, " ").trim()
        );
      }
    });
  }

  return cleaned;
}

// ==================== UI UPDATES ====================
function updateDataSection() {
  // Update raw text
  document.getElementById("rawOutput").value = STATE.rawText;

  // Update JSON
  document.getElementById("jsonOutput").value = JSON.stringify(
    STATE.resumeData,
    null,
    2
  );

  // Update preview
  updateDataPreview();
}

function updateDataPreview() {
  const preview = document.getElementById("dataPreview");
  const data = STATE.resumeData;

  let html = "";

  // Basics
  html += '<div class="info-group">';
  html += "<h3>Basic Information</h3>";
  html += `<p><strong>Name:</strong> ${data.basics.name}</p>`;
  if (data.basics.label)
    html += `<p><strong>Title:</strong> ${data.basics.label}</p>`;
  if (data.basics.email)
    html += `<p><strong>Email:</strong> ${data.basics.email}</p>`;
  if (data.basics.phone)
    html += `<p><strong>Phone:</strong> ${data.basics.phone}</p>`;
  if (data.basics.location)
    html += `<p><strong>Location:</strong> ${data.basics.location}</p>`;
  html += "</div>";

  // Summary
  if (data.basics.summary) {
    html += '<div class="info-group">';
    html += "<h3>Summary</h3>";
    html += `<p>${data.basics.summary}</p>`;
    html += "</div>";
  }

  // Work
  if (data.work && data.work.length > 0) {
    html += '<div class="info-group">';
    html += "<h3>Experience</h3>";
    html += `<p>${data.work.length} position(s) found</p>`;
    html += "</div>";
  }

  // Education
  if (data.education && data.education.length > 0) {
    html += '<div class="info-group">';
    html += "<h3>Education</h3>";
    html += `<p>${data.education.length} degree(s) found</p>`;
    html += "</div>";
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    html += '<div class="info-group">';
    html += "<h3>Skills</h3>";
    html += `<p>${data.skills.length} skill category/ies found</p>`;
    html += "</div>";
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    html += '<div class="info-group">';
    html += "<h3>Projects</h3>";
    html += `<p>${data.projects.length} project(s) found</p>`;
    html += "</div>";
  }

  preview.innerHTML = html;
}

function resetDataSection() {
  document.getElementById("rawOutput").value = "";
  document.getElementById("jsonOutput").value = "";
  document.getElementById("dataPreview").innerHTML =
    '<div class="empty-state"><p>📋 Upload and parse a PDF to see structured data</p></div>';
}

function enableTemplates() {
  const templateCards = document.querySelectorAll(".template-card");
  templateCards.forEach((card) => {
    card.disabled = false;
  });
}

function disableTemplates() {
  const templateCards = document.querySelectorAll(".template-card");
  templateCards.forEach((card) => {
    card.disabled = true;
    card.classList.remove("active");
  });

  document.getElementById("exportBtn").disabled = true;
  document.getElementById("downloadJsonBtn").disabled = true;
  document.getElementById("printBtn").disabled = true;
}

function resetPreview() {
  const container = document.getElementById("resumeContainer");
  container.innerHTML = `
    <div class="empty-state large">
      <div class="empty-icon">📄</div>
      <h3>No Template Applied</h3>
      <p>Upload your PDF resume and select a template to see the preview</p>
    </div>
  `;
}

// ==================== TAB SWITCHING ====================
function handleTabSwitch(e) {
  const targetTab = e.currentTarget.dataset.tab;

  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  e.currentTarget.classList.add("active");

  // Update tab content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  const contentMap = {
    preview: "previewTab",
    json: "jsonTab",
    raw: "rawTab",
  };

  document.getElementById(contentMap[targetTab]).classList.add("active");
}

// ==================== TEMPLATE SELECTION ====================
function handleTemplateSelect(e) {
  const card = e.currentTarget;
  const templateName = card.dataset.template;

  // Allow selecting templates even when no resume is parsed so users can preview styles.

  // Update active state
  document.querySelectorAll(".template-card").forEach((c) => {
    c.classList.remove("active");
  });
  card.classList.add("active");

  // Render template
  STATE.currentTemplate = templateName;
  renderCurrentTemplate();

  // Enable export buttons only if we have parsed resume data
  const hasData = !!STATE.resumeData;
  document.getElementById("exportBtn").disabled = !hasData;
  document.getElementById("downloadJsonBtn").disabled = !hasData;
  document.getElementById("printBtn").disabled = !hasData;
}

function renderCurrentTemplate() {
  const container = document.getElementById("resumeContainer");
  // Use real parsed data when available; otherwise render a friendly sample so the user sees the design
  const dataToRender = STATE.resumeData || SAMPLE_DATA;
  const result = renderTemplate(STATE.currentTemplate, dataToRender);
  // result is { html, css }

  // Inject HTML
  container.innerHTML = result.html || "";

  // Inject CSS by creating a style tag
  let styleTag = document.getElementById("template-styles");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "template-styles";
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = result.css || "";

  STATE.lastRender = result;
}

// ==================== EXPORT & PRINT ====================
function handleExport() {
  if (!STATE.resumeData || !STATE.currentTemplate) {
    alert("Please select a template first.");
    return;
  }
  const renderResult = renderTemplate(STATE.currentTemplate, STATE.resumeData);
  const resumeHTML = renderResult.html || "";
  const resumeCSS = renderResult.css || "";

  const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${STATE.resumeData.basics.name} - Resume</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    @media print { body { padding: 0; } }
    ${resumeCSS}
  </style>
</head>
<body>
  ${resumeHTML}
</body>
</html>
  `;

  // Create download
  const blob = new Blob([fullHTML], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${STATE.resumeData.basics.name.replace(/\s+/g, "_")}_${
    STATE.currentTemplate
  }_resume.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handlePrint() {
  if (!STATE.resumeData || !STATE.currentTemplate) {
    alert("Please select a template first.");
    return;
  }

  window.print();
}

function handleDownloadJSON() {
  if (!STATE.resumeData) {
    alert("No resume data to download. Please parse a resume first.");
    return;
  }

  const content = JSON.stringify(STATE.resumeData, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${STATE.resumeData.basics.name.replace(
    /\s+/g,
    "_"
  )}_resume.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==================== UTILITY FUNCTIONS ====================
function copyToClipboard(elementId, btn) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Select and copy
  element.select();
  document.execCommand("copy");

  // Visual feedback
  const copyBtn = btn || document.activeElement;
  if (copyBtn && copyBtn.classList && copyBtn.classList.contains("btn-copy")) {
    const originalHTML = copyBtn.innerHTML;
    copyBtn.innerHTML = "<span>✓</span> Copied!";
    copyBtn.style.color = "var(--success)";

    setTimeout(() => {
      copyBtn.innerHTML = originalHTML;
      copyBtn.style.color = "";
    }, 2000);
  }
}
