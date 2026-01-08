// Detailed diagnostic to see what's being extracted from sections
const fs = require("fs");

// Sample resume text that matches the actual PDF structure
const sampleResume = `Shanmuga Priya Kannan
872 - 330 - 3203 | shanmugapriyakannan019@gmail.com | https://www.linkedin.com/in/shanmuga-priya-k-95400a194

B.Tech Computer Science
Chicago, US

EDUCATION
DePaul University
Chicago, Illinois
Bachelor of Science in Computer Science
May 2016

Velammal Engineering College
Chennai, India
Bachelor of Technology in Information Technology
June 2013

PROFESSIONAL EXPERIENCE
Senior ServiceNow Developer
ServiceNow Consulting Services, Inc.
May 2022 - Present
• Designed and implemented advanced incident management and change management workflows
• Developed custom CMDB applications for enterprise resource planning
• Led discovery tool configuration for infrastructure inventory management

ServiceNow Developer
TechCorp Solutions
June 2018 - Apr 2022
• Built and configured IT service management solutions
• Customized workflows using JavaScript and Workflow Editor

PROJECTS
Shopping System | Java, MySQL, Spring Framework
E-commerce platform with product catalog and inventory management system

Real Estate Application | React.js, Node.js, MongoDB
Full-stack application for property management and listing services

TECHNICAL SKILLS
Programming Languages: C/C++, Java, Python, R, and SQL
Web Development: HTML/CSS, JavaScript, Node.js
Tools & Platforms: Git, Docker, AWS (EMR, S3, Athena, SageMaker), GCP, VS Code, Eclipse, JIRA, Step Functions, SNS
Data & Analytics: Pandas, NumPy, Matplotlib, Seaborn, Excel, Tableau, Power BI, RStudio, Regression, Exploratory
ML & Big Data: Machine Learning, Spark (PySpark, MLlib), Hadoop, Distributed, Model Evaluation, Algorithms
ServiceNow: ITSM, CMDB, Service Catalog, REST APIs, JSON, XML, Flow Design, Integration
`;

console.log("=== DIAGNOSTIC: Section Extraction Analysis ===\n");
console.log("Sample resume length:", sampleResume.length);
console.log("\nSearching for section headers...\n");

// Test identifySections logic
const sectionKeywords = {
  education: ["EDUCATION", "ACADEMIC"],
  experience: ["PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE", "EXPERIENCE"],
  projects: ["PROJECTS", "PORTFOLIO"],
  skills: ["TECHNICAL SKILLS", "SKILLS"],
};

const headerMatches = [];

for (const [sectionName, keywords] of Object.entries(sectionKeywords)) {
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    let match;
    while ((match = regex.exec(sampleResume)) !== null) {
      headerMatches.push({
        sectionName,
        keyword,
        index: match.index,
      });
    }
  }
}

headerMatches.sort((a, b) => a.index - b.index);

console.log("Headers found:", headerMatches.length);
for (const h of headerMatches) {
  console.log(`  [${h.index}] ${h.sectionName.toUpperCase()}: "${h.keyword}"`);
}

// Remove duplicates (keep first occurrence only)
const uniqueMatches = [];
const seenSections = new Set();

for (const match of headerMatches) {
  if (!seenSections.has(match.sectionName)) {
    uniqueMatches.push(match);
    seenSections.add(match.sectionName);
  }
}

console.log("\nAfter deduplication:", uniqueMatches.length);

// Extract content
console.log("\n=== EXTRACTED SECTION CONTENT ===\n");

const sections = {};
for (let i = 0; i < uniqueMatches.length; i++) {
  const current = uniqueMatches[i];
  const next = uniqueMatches[i + 1];

  const startIndex = current.index + current.keyword.length;
  const endIndex = next ? next.index : sampleResume.length;
  const content = sampleResume.substring(startIndex, endIndex).trim();

  console.log(`>>> ${current.sectionName.toUpperCase()}`);
  console.log(`    Length: ${content.length}`);
  console.log(`    Content:\n${content.substring(0, 300)}\n`);

  sections[current.sectionName] = content;
}

// Test parsers
console.log("\n=== PARSER RESULTS ===\n");

// Work Experience Parser
console.log("WORK EXPERIENCE:");
const workText = sections.experience || "";
const datePattern =
  /([A-Z][a-z]+\.?\s+\d{4})\s*[-–—]\s*((?:[A-Z][a-z]+\.?\s+\d{4})|Present)/g;
const dateMatches = [];
let match;
while ((match = datePattern.exec(workText)) !== null) {
  dateMatches.push({
    startDate: match[1],
    endDate: match[2],
    index: match.index,
    endIndex: match.index + match[0].length,
  });
}
console.log(`  Dates found: ${dateMatches.length}`);
for (const dm of dateMatches) {
  console.log(`    ${dm.startDate} - ${dm.endDate}`);
}

// Education Parser
console.log("\nEDUCATION:");
const eduText = sections.education || "";
const eduLines = eduText
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.length > 0);
console.log(`  Lines: ${eduLines.length}`);
for (const line of eduLines) {
  console.log(`    "${line}"`);
}

// Skills Parser
console.log("\nSKILLS:");
const skillsText = sections.skills || "";
const skillLines = skillsText
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.length > 0);
console.log(`  Lines: ${skillLines.length}`);
for (const line of skillLines) {
  if (line.includes(":")) {
    const [name, keywords] = line.split(":");
    console.log(`    ${name.trim()}: ${keywords.trim().substring(0, 60)}...`);
  }
}

// Projects Parser
console.log("\nPROJECTS:");
const projectsText = sections.projects || "";
const projLines = projectsText.split("\n").filter((l) => l.trim().length > 0);
console.log(`  Lines: ${projLines.length}`);
for (const line of projLines.slice(0, 3)) {
  console.log(`    "${line.substring(0, 80)}..."`);
}
