// Test mimicking actual web app flow

// Copy the cleanAndNormalizeText function from app.js
function cleanAndNormalizeText(text) {
  if (!text) return "";

  let cleaned = text.replace(/[ \t]+/g, " ");

  for (let i = 0; i < 10; i++) {
    const before = cleaned;
    cleaned = cleaned.replace(/([A-Z])\s+([A-Z])/g, "$1$2");
    if (cleaned === before) break;
  }

  const multiWordHeaders = [
    "PROFESSIONAL EXPERIENCE",
    "WORK EXPERIENCE",
    "TECHNICAL SKILLS",
    "CORE COMPETENCIES",
    "PROFESSIONAL SUMMARY",
  ];

  for (const header of multiWordHeaders) {
    const headerPatternSpaced = header.replace(/\s+/g, "\\s+");
    const regexSpaced = new RegExp(`\\s+(${headerPatternSpaced})\\s+`, "gi");
    cleaned = cleaned.replace(regexSpaced, "\n$1\n");

    const headerNoSpace = header.replace(/\s+/g, "");
    const regexNoSpace = new RegExp(`(${headerNoSpace})([A-Z][a-z]+)`, "gi");
    cleaned = cleaned.replace(regexNoSpace, "$1\n$2");
  }

  const singleWordHeaders = [
    "EDUCATION",
    "ACADEMIC",
    "QUALIFICATIONS",
    "DEGREES",
    "EXPERIENCE",
    "EMPLOYMENT",
    "CAREER",
    "WORK",
    "PROJECTS",
    "PORTFOLIO",
    "SKILLS",
    "COMPETENCIES",
    "CERTIFICATIONS",
    "LICENSES",
    "CERTIFICATES",
    "LANGUAGES",
    "LANGUAGE",
    "SUMMARY",
    "OBJECTIVE",
  ];

  for (const header of singleWordHeaders) {
    const regex = new RegExp(`(${header})([A-Z][a-z]+)`, "gi");
    cleaned = cleaned.replace(regex, "$1\n$2");
  }

  cleaned = cleaned
    .replace(/\n\s*\n+/g, "\n\n")
    .replace(/\n\s+/g, "\n")
    .trim();

  return cleaned;
}

function identifySections(text) {
  const sections = {};

  const sectionPatterns = {
    summary:
      /^(professional\s+summary|professionalsummary|summary|objective|profile|overview|about|professional\s+profile)(\s|$)/i,
    experience:
      /^(professional\s+experience|professionalexperience|work\s+experience|workexperience|employment|career|experience|work\s+history|professional\s+history)(\s|$)/i,
    education:
      /^(education|academic|qualifications|degrees|academic\s+background|educational\s+background)(\s|$)/i,
    skills:
      /^(skills|competencies|technical\s+skills|technicalskills|core\s+competencies|corecompetencies|technical\s+competencies|key\s+skills)(\s|$)/i,
    projects:
      /^(projects|portfolio|key\s+projects|notable\s+projects|personal\s+projects)(\s|$)/i,
    certifications:
      /^(certifications|licenses|certificates|professional\s+certifications)(\s|$)/i,
    languages: /^(languages|language)(\s|$)/i,
  };

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let currentSection = null;
  let currentContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    let foundSection = null;
    for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(lineLower)) {
        foundSection = sectionName;
        const match = lineLower.match(pattern);
        if (match) {
          const headerLength = match[0].length;
          const contentAfterHeader = line.substring(headerLength).trim();

          if (currentSection && currentContent.length > 0) {
            const content = currentContent.join("\n").trim();
            sections[currentSection] = content;
          }

          currentSection = foundSection;
          currentContent = [];

          if (contentAfterHeader) {
            currentContent.push(contentAfterHeader);
          }
        }
        break;
      }
    }

    if (!foundSection && currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection && currentContent.length > 0) {
    const content = currentContent.join("\n").trim();
    sections[currentSection] = content;
  }

  return sections;
}

// Simulated raw extracted text from the user's actual PDF
const rawTextFromPDF = `Shanmuga Priya Kannan
872 - 330 - 3203 | shanmugapriyakannan019@gmail.com | LinkedIn | github

flow automation. Skilled in Java, Python, cloud platforms, and data analytics with hands-on project experience in machine learning and market analysis.

EDUCATION

DePaul University
Sep 2023 – June 2025
Master's in Computer Science
GPA: 3.9/4.0

Illinois Institute of Technology
Aug 2019 – May 2023
Bachelor's of Science in Computer Science
GPA: 3.75/4.0

EXPERIENCE

Senior Service Manager - Accenture
Jan 2023 - Dec 2023 (12 months)
Led project analysis and market evaluation resulting in 30% cost reduction.

Analyst - TCS
June 2022 - Dec 2022 (7 months)
Worked on data transformation and process optimization using Python scripts.

PROJECTS

Shopping Platform Portal
Build complete e-commerce portal using React and Node.js.

Weather App
Built real-time weather application using React and D3.js.

TECHNICAL SKILLS

Programming Languages: Python, Java, JavaScript, SQL
Web Development: React, Node.js, Express, HTML/CSS`;

console.log("=== TESTING WEB APP FLOW ===\n");

console.log("1. Raw PDF text (first 150 chars):");
console.log(rawTextFromPDF.substring(0, 150));
console.log("\n");

console.log("2. Calling cleanAndNormalizeText()...");
const cleanedText = cleanAndNormalizeText(rawTextFromPDF);

console.log("3. Cleaned text (first 300 chars):");
console.log(cleanedText.substring(0, 300));
console.log("\n");

console.log("4. Calling identifySections()...");
const sections = identifySections(cleanedText);

console.log("5. Sections found:");
console.log(JSON.stringify(Object.keys(sections), null, 2));
console.log("\n");

console.log("6. Sections content preview:");
for (const [name, content] of Object.entries(sections)) {
  console.log(`\n${name}: ${content.substring(0, 100)}`);
}

console.log("\n\n=== VERDICT ===");
if (Object.keys(sections).length >= 3) {
  console.log("✅ Sections ARE extracting properly!");
  console.log(`✅ Found ${Object.keys(sections).length} sections`);
} else {
  console.log("❌ Sections are NOT extracting");
  console.log("Issue: Check cleaned text and section patterns");
}
