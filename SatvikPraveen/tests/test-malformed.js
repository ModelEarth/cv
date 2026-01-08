// Test with malformed PDF text (simulating real pdf.js output)

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

// Simulate malformed PDF text like from real pdf.js
// Notice: Everything is on few lines, headers have issues
const malformedPDF = `Shanmuga   Priya   Kannan
872 - 330 - 3203 | shanmugapriyakannan019@gmail.com | LinkedIn | github
flow automation. Skilled in Java, Python, cloud platforms, and data analytics with hands - on project experience in machine learning and market analysis. E D U C A T I O N DePaul University Sep 2023 – June 2025 Master's in Computer Science GPA: 3.9/4.0 Illinois Institute of Technology Aug 2019 – May 2023 Bachelor's of Science in Computer Science GPA: 3.75/4.0 EXPERIENCE Senior Service Manager - Accenture Jan 2023 - Dec 2023 (12 months) Led project analysis and market evaluation. Analyst - TCS June 2022 - Dec 2022 (7 months) PROJECTS Shopping Platform Portal. Weather App. TECHNICAL SKILLS Programming Languages: Python, Java`;

console.log("=== MALFORMED PDF TEST ===\n");

console.log("Raw malformed text (first 200 chars):");
console.log(malformedPDF.substring(0, 200));
console.log("\n");

console.log("After cleanAndNormalizeText:");
const cleaned = cleanAndNormalizeText(malformedPDF);
console.log(cleaned.substring(0, 400));
console.log("\n");

// Show line by line
const lines = cleaned
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.length > 0);
console.log(`Total lines after split: ${lines.length}\n`);
console.log("First 15 lines:");
for (let i = 0; i < Math.min(15, lines.length); i++) {
  console.log(`Line ${i}: ${lines[i].substring(0, 70)}`);
}

// What would lines[1] be?
console.log(`\nWhat is lines[1]? "${lines[1] || "UNDEFINED"}"`);
console.log("This is what gets set as the 'label'");
