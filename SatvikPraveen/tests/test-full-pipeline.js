// Full end-to-end test of the parsing pipeline

function cleanAndNormalizeText(text) {
  if (!text) return "";

  let cleaned = text
    .replace(/[ \t]+/g, " ")
    .replace(/[-–—]/g, "-")
    .replace(/\n\s*\n+/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();

  return cleaned;
}

const rawText = `Shanmuga Priya Kannan
872-330-3203 | shanmugapriyakannan019@gmail.com | https://www.linkedin.com/in/shanmuga-priya-k-95400a194
Computer Science graduate student with 3+ years of experience as a ServiceNow Developer specializing in ITSM,
integrations, and workflow automation. Skilled in Java, Python, cloud platforms, and data analytics with hands-on
project experience in machine learning and market analysis.
EDUCATION
DePaul University
Master's in Computer Science
Sep. 2023 - June 2025
Chicago, USA
Velammal Engineering College
Bachelor of Technology in Information Technology
June. 2016 - April 2020
Chennai, India
EXPERIENCE
Senior Service-now Developer (Autodesk, Fortive)
Cognizant Technology Solutions (Associate)
June 2020 - Aug 2023
Chennai, India
• Senior ServiceNow Developer with 3+ years of ITSM experience, specializing in CMDB and Event
Management for clients like Autodesk and Fortive
• Developed REST APIs and created 30+ custom workflows and catalog items to automate incident,
request, and change processes in ServiceNow
PROJECTS
Shopping System | Java, Eclipse
• Developed user authentication and product catalog features to enhance security and streamline shopping.
• Outcome: Reduced login issues and browsing delays, improving system usability..
Market Analysis of Google Play Store Apps | Excel, Tableau, R
• Analyzed app store data to identify trends and provide insights for developers and marketers.
TECHNICAL SKILLS
Programming Languages: C/C++, Java, Python, R, and SQL
Web Development: HTML/CSS, JavaScript, Node.js`;

const cleaned = cleanAndNormalizeText(rawText);

function identifySections(text) {
  const sections = {};

  const sectionKeywords = {
    education: [
      "EDUCATION",
      "ACADEMIC",
      "QUALIFICATIONS",
      "DEGREES",
      "ACADEMIC BACKGROUND",
      "EDUCATIONAL BACKGROUND",
    ],
    experience: [
      "PROFESSIONAL EXPERIENCE",
      "WORK EXPERIENCE",
      "EMPLOYMENT",
      "CAREER",
      "EXPERIENCE",
      "WORK HISTORY",
      "PROFESSIONAL HISTORY",
    ],
    projects: [
      "PROJECTS",
      "PORTFOLIO",
      "KEY PROJECTS",
      "NOTABLE PROJECTS",
      "PERSONAL PROJECTS",
    ],
    skills: [
      "TECHNICAL SKILLS",
      "SKILLS",
      "COMPETENCIES",
      "CORE COMPETENCIES",
      "TECHNICAL COMPETENCIES",
      "KEY SKILLS",
    ],
    summary: [
      "PROFESSIONAL SUMMARY",
      "SUMMARY",
      "OBJECTIVE",
      "PROFILE",
      "OVERVIEW",
      "ABOUT",
    ],
    certifications: [
      "CERTIFICATIONS",
      "LICENSES",
      "CERTIFICATES",
      "PROFESSIONAL CERTIFICATIONS",
    ],
    languages: ["LANGUAGES", "LANGUAGE"],
  };

  const headerMatches = [];

  for (const [sectionName, keywords] of Object.entries(sectionKeywords)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      let match;

      while ((match = regex.exec(text)) !== null) {
        headerMatches.push({
          sectionName: sectionName,
          keyword: keyword,
          index: match.index,
        });
      }
    }
  }

  headerMatches.sort((a, b) => a.index - b.index);

  console.log("Header matches:", headerMatches);

  for (let i = 0; i < headerMatches.length; i++) {
    const currentHeader = headerMatches[i];
    const nextHeader = headerMatches[i + 1];

    let startIndex = currentHeader.index + currentHeader.keyword.length;
    let endIndex = nextHeader ? nextHeader.index : text.length;

    let content = text.substring(startIndex, endIndex).trim();

    if (!sections[currentHeader.sectionName] && content.length > 0) {
      sections[currentHeader.sectionName] = content;
      console.log(`\nFound ${currentHeader.sectionName}:`);
      console.log(`  Length: ${content.length}`);
      console.log(`  Preview: ${content.substring(0, 80)}...`);
    }
  }

  return sections;
}

console.log("===== SECTION IDENTIFICATION =====");
const sections = identifySections(cleaned);

console.log("\n===== FINAL SECTIONS OBJECT =====");
console.log("Keys:", Object.keys(sections));
for (const [key, value] of Object.entries(sections)) {
  console.log(`${key}: ${value.substring(0, 50)}...`);
}

console.log("\n===== TRYING TO ACCESS SECTIONS =====");
console.log("sections.education:", sections.education ? "FOUND" : "NOT FOUND");
console.log(
  "sections.experience:",
  sections.experience ? "FOUND" : "NOT FOUND"
);
console.log("sections.projects:", sections.projects ? "FOUND" : "NOT FOUND");
console.log("sections.skills:", sections.skills ? "FOUND" : "NOT FOUND");
console.log(
  "sections['technical skills']:",
  sections["technical skills"] ? "FOUND" : "NOT FOUND"
);
