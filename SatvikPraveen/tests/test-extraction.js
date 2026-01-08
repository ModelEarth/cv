// Test the complete extraction pipeline with malformed PDF text

// Simulated malformed PDF text (as it comes from pdf.js)
const testText = `Shanmuga   Priya   Kannan
872 - 330 - 3203   |   shanmugapriyakannan019@gmail.com   |   LinkedIn   |   github
market analysis.

EDUCATION

DePaul   University   Sep   2023   –   June   2025   Master's   in   Computer Science
GPA: 3.9/4.0

Illinois   Institute   of   Technology   Aug   2019   –   May   2023   Bachelor's   of   Science
in   Computer   Science   GPA: 3.75/4.0

EXPERIENCE

Senior Service Manager   -   Accenture   Jan 2023 - Dec 2023 (12 months)
Led project analysis and market evaluation resulting in 30% cost reduction. Coordinated with 5+ cross-functional teams. Developed market analysis strategies.

Analyst   -   TCS   June 2022 - Dec 2022 (7 months)
Worked on data transformation and process optimization using Python scripts. Improved query efficiency by 40%.

PROJECTS

Shopping Platform Portal   Build complete e-commerce portal using React and Node.js. Implemented payment integration with Stripe. Achieved 99.9% uptime with 50K+ daily users.

Weather App   Built real-time weather application using React, D3.js and OpenWeather API. Deployed to AWS with CI/CD pipeline.

TECHNICAL SKILLS

Programming Languages: Python, Java, JavaScript, SQL
Web Development: React, Node.js, Express, HTML/CSS
Databases: MySQL, MongoDB, PostgreSQL
Tools: Git, Docker, AWS, Jenkins
Soft Skills: Leadership, Communication, Problem Solving`;

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

// Test the cleaning function
console.log("=== TESTING TEXT CLEANING ===\n");
console.log("INPUT (first 200 chars):");
console.log(testText.substring(0, 200));
console.log("\n---\n");

const cleaned = cleanAndNormalizeText(testText);
console.log("OUTPUT (first 300 chars):");
console.log(cleaned.substring(0, 300));
console.log("\n---\n");

// Show line-by-line view of cleaned text
console.log("LINE-BY-LINE VIEW OF CLEANED TEXT:");
const lines = cleaned.split("\n");
lines.forEach((line, idx) => {
  if (line.trim()) {
    console.log(`Line ${idx}: ${line.substring(0, 80)}`);
  }
});

console.log("\n=== KEY SECTIONS ===\n");

// Find key sections
const sections = {};
let currentSection = null;
let currentContent = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  if (
    line.match(
      /^(EDUCATION|EXPERIENCE|PROJECTS|TECHNICAL SKILLS|TECHNICALSKILLS|SKILLS)$/i
    )
  ) {
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join("\n");
    }
    currentSection = line;
    currentContent = [];
    console.log(`✓ Found section: ${line}`);
  } else if (currentSection && line) {
    currentContent.push(line);
  }
}

if (currentSection && currentContent.length > 0) {
  sections[currentSection] = currentContent.join("\n");
}

console.log("\n=== SECTION CONTENTS ===\n");
for (const [section, content] of Object.entries(sections)) {
  console.log(`\n[${section}]`);
  const preview = content.substring(0, 150).replace(/\n/g, " ");
  console.log(`${preview}...`);
}

console.log("\n=== SUMMARY ===");
console.log(`✓ Sections found: ${Object.keys(sections).length}`);
console.log(`✓ EDUCATION section: ${sections["EDUCATION"] ? "✓" : "✗"}`);
console.log(`✓ EXPERIENCE section: ${sections["EXPERIENCE"] ? "✓" : "✗"}`);
console.log(`✓ PROJECTS section: ${sections["PROJECTS"] ? "✓" : "✗"}`);
console.log(
  `✓ TECHNICAL SKILLS or SKILLS section: ${
    sections["TECHNICAL SKILLS"] || sections["SKILLS"] ? "✓" : "✗"
  }`
);
