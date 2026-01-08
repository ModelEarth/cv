// Test to understand what's in the EDUCATION section
const fs = require("fs");
const appCode = fs.readFileSync(
  "/Users/satvikpraveen/Documents/resume-loader/app.js",
  "utf8"
);

// Extract just the functions we need
const functionsToExtract = [
  "cleanAndNormalizeText",
  "identifySections",
  "parseEducation",
];

eval(appCode);

// Mock resume text similar to what should be extracted
const mockText = `EDUCATION

DePaul University Sep. 2023 - June 2025 Master's in Computer Science Chicago, USA

Velammal Engineering College June. 2016 - April 2020 Bachelor of Technology in Information Technology Chennai, India

EXPERIENCE

Senior Service-now Developer (Autodesk, Fortive) June 2020 - Aug 2023
Cognizant Technology Solutions (Associate) Chennai, India

PROJECTS`;

console.log("Mock resume text:");
console.log(mockText);
console.log("\n" + "=".repeat(80) + "\n");

// Clean and identify sections
const cleaned = cleanAndNormalizeText(mockText);
console.log("After normalization:");
console.log(cleaned);
console.log("\n" + "=".repeat(80) + "\n");

const sections = identifySections(cleaned);
console.log("\nExtracted sections:");
Object.entries(sections).forEach(([name, content]) => {
  console.log(`\n${name.toUpperCase()} (${content.length} chars):`);
  console.log(`"${content}"`);
  console.log();
});

console.log("\n" + "=".repeat(80) + "\n");

// Parse education
if (sections.education) {
  console.log("\nParsing EDUCATION section...");
  const edu = parseEducation(sections.education);
  console.log(`\nResult: ${edu.length} entries`);
  edu.forEach((e, i) => {
    console.log(`${i + 1}. ${e.institution} - ${e.studyType}`);
  });
}
