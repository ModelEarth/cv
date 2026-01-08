// Test the complete JSON extraction pipeline

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

// Copy functions from app.js
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

// Test the pipeline
console.log("=== EXTRACTION PIPELINE TEST ===\n");

const cleaned = cleanAndNormalizeText(testText);
const sections = identifySections(cleaned);

console.log("Sections extracted:");
for (const [name, content] of Object.entries(sections)) {
  const preview = content.substring(0, 80).replace(/\n/g, " ");
  console.log(`  ✓ ${name}: ${preview}...`);
}

console.log("\n=== EXTRACTION RESULTS ===");
console.log(`✓ Summary: ${sections.summary ? "Present" : "Not found"}`);
console.log(`✓ Education: ${sections.education ? "Present" : "Not found"}`);
console.log(`✓ Experience: ${sections.experience ? "Present" : "Not found"}`);
console.log(`✓ Skills: ${sections.skills ? "Present" : "Not found"}`);
console.log(`✓ Projects: ${sections.projects ? "Present" : "Not found"}`);

console.log("\n=== EDUCATION CONTENT (first 200 chars) ===");
console.log(
  sections.education ? sections.education.substring(0, 200) : "NOT FOUND"
);

console.log("\n=== EXPERIENCE CONTENT (first 200 chars) ===");
console.log(
  sections.experience ? sections.experience.substring(0, 200) : "NOT FOUND"
);

console.log("\n=== SKILLS CONTENT (first 200 chars) ===");
console.log(sections.skills ? sections.skills.substring(0, 200) : "NOT FOUND");

console.log("\n=== PROJECTS CONTENT (first 200 chars) ===");
console.log(
  sections.projects ? sections.projects.substring(0, 200) : "NOT FOUND"
);
