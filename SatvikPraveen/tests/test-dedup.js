// Test with the deduplication logic

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

function identifySectionsWithDedup(text) {
  const sections = {};

  const sectionKeywords = {
    education: [
      "EDUCATION",
      "ACADEMIC BACKGROUND",
      "EDUCATIONAL BACKGROUND",
      "ACADEMIC",
      "QUALIFICATIONS",
      "DEGREES",
    ],
    experience: [
      "PROFESSIONAL EXPERIENCE",
      "WORK EXPERIENCE",
      "WORK HISTORY",
      "PROFESSIONAL HISTORY",
      "EMPLOYMENT",
      "CAREER",
      "EXPERIENCE",
    ],
    projects: [
      "KEY PROJECTS",
      "NOTABLE PROJECTS",
      "PERSONAL PROJECTS",
      "PROJECTS",
      "PORTFOLIO",
    ],
    skills: [
      "TECHNICAL SKILLS",
      "CORE COMPETENCIES",
      "TECHNICAL COMPETENCIES",
      "KEY SKILLS",
      "SKILLS",
      "COMPETENCIES",
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
      "PROFESSIONAL CERTIFICATIONS",
      "CERTIFICATIONS",
      "CERTIFICATES",
      "LICENSES",
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

  // DEDUPLICATION: Remove overlapping matches
  const uniqueMatches = [];
  for (let i = 0; i < headerMatches.length; i++) {
    const current = headerMatches[i];
    let skipCurrent = false;

    if (i + 1 < headerMatches.length) {
      const next = headerMatches[i + 1];
      if (
        current.sectionName === next.sectionName &&
        Math.abs(current.index - next.index) < 20
      ) {
        if (current.keyword.length < next.keyword.length) {
          skipCurrent = true;
        }
      }
    }

    if (!skipCurrent) {
      uniqueMatches.push(current);
    }
  }

  console.log("After dedup:", uniqueMatches);

  for (let i = 0; i < uniqueMatches.length; i++) {
    const currentHeader = uniqueMatches[i];
    const nextHeader = uniqueMatches[i + 1];

    let startIndex = currentHeader.index + currentHeader.keyword.length;
    let endIndex = nextHeader ? nextHeader.index : text.length;
    let content = text.substring(startIndex, endIndex).trim();

    if (!sections[currentHeader.sectionName] && content.length > 0) {
      sections[currentHeader.sectionName] = content;
      console.log(
        `Found ${currentHeader.sectionName}: ${content.substring(0, 60)}...`
      );
    }
  }

  return sections;
}

console.log("===== WITH DEDUPLICATION =====");
const sections = identifySectionsWithDedup(cleaned);

console.log("\n===== SECTIONS FOUND =====");
console.log("Keys:", Object.keys(sections));
for (const [key, value] of Object.entries(sections)) {
  console.log(`\n${key} (length: ${value.length}):`);
  console.log(`  ${value.substring(0, 80)}...`);
}
