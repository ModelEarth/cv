// Test to diagnose section extraction issue
// This simulates the exact resume content from the PDF

const sampleResume = `Shanmuga Priya Kannan 872-330-3203 | shanmugapriya@gmail.com | www.linkedin.com/in/shanmuga

Senior ServiceNow Developer | ServiceNow Administrator | ITIL Foundation Certified

Senior ServiceNow Developer with 9 years of experience in ServiceNow configurations and customization, including incident management, change management, CMDB, discovery, and IT asset management. Proven expertise with multi-instance administration, solution design, implementation, and support for enterprise clients.

EDUCATION
DePaul University Chicago, Illinois Bachelor of Science in Computer Science May 2016
Velammal Engineering College Chennai, India Bachelor of Technology in Information Technology June 2013

PROFESSIONAL EXPERIENCE
Senior ServiceNow Developer ServiceNow Consulting Services, Inc. May 2022 - Present
• Designed and implemented advanced incident management and change management workflows
• Developed custom CMDB applications for enterprise resource planning
• Led discovery tool configuration for infrastructure inventory management
• Mentored team of 5 junior developers on ServiceNow best practices

ServiceNow Developer TechCorp Solutions June 2018 - Apr 2022
• Built and configured IT service management solutions for 50+ clients
• Customized workflows using JavaScript and Workflow Editor
• Supported multi-instance environments with performance optimization

TECHNICAL SKILLS
Programming Languages: Java, JavaScript, Python, SQL
ServiceNow: ServiceNow Platform, ITSM, IT Service Management, Change Management, Incident Management, CMDB, Discovery, Asset Management
Web Technologies: HTML, CSS, React.js, REST APIs, SOAP Web Services
Databases: MySQL, SQL Server, PostgreSQL, MongoDB
Tools: Git, Jenkins, Jira, ServiceNow Studio, Eclipse, Visual Studio Code

PROJECTS
Shopping System | Java, MySQL, Spring Framework
E-commerce platform with product catalog and inventory management system

Real Estate Application | React.js, Node.js, MongoDB
Full-stack application for property management and listing services

Market Analysis Dashboard | Python, Pandas, Matplotlib
Data analysis tool for market trend visualization and reporting

Lung Cancer Prediction ML Model | Python, scikit-learn, TensorFlow
Machine learning model for cancer diagnosis using medical imaging data

NYC Taxi Trip Analysis | Python, SQL, Tableau
Big data analytics project analyzing 1M+ taxi trip records
`;

console.log("Sample Resume Length:", sampleResume.length);
console.log("\n=== TESTING identifySections ===\n");

// Mock the function
function identifySections(text) {
  const sections = {};
  const sectionKeywords = {
    education: ["EDUCATION", "ACADEMIC", "QUALIFICATIONS"],
    experience: ["PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE", "EXPERIENCE"],
    projects: ["PROJECTS", "PORTFOLIO"],
    skills: ["TECHNICAL SKILLS", "SKILLS"],
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

  console.log("Raw headers found:", headerMatches.length);
  for (const h of headerMatches) {
    console.log(`  [${h.index}] ${h.sectionName}: "${h.keyword}"`);
    const context = text.substring(
      Math.max(0, h.index - 30),
      Math.min(text.length, h.index + h.keyword.length + 30)
    );
    console.log(`      Context: ...${context}...`);
  }

  // Deduplication
  const uniqueMatches = [];
  for (let i = 0; i < headerMatches.length; i++) {
    const current = headerMatches[i];
    let skipCurrent = false;

    if (i > 0) {
      const prev = headerMatches[i - 1];
      const distance = Math.abs(current.index - prev.index);
      if (current.sectionName === prev.sectionName && distance < 20) {
        if (current.keyword.length < prev.keyword.length) {
          skipCurrent = true;
        }
      }
    }

    if (!skipCurrent) {
      uniqueMatches.push(current);
    }
  }

  console.log("\nAfter dedup:", uniqueMatches.length);

  // Extract content
  for (let i = 0; i < uniqueMatches.length; i++) {
    const currentHeader = uniqueMatches[i];
    const nextHeader = uniqueMatches[i + 1];

    let startIndex = currentHeader.index + currentHeader.keyword.length;
    let endIndex = nextHeader ? nextHeader.index : text.length;
    let content = text.substring(startIndex, endIndex).trim();

    console.log(`\n>>> ${currentHeader.sectionName.toUpperCase()}`);
    console.log(
      `    Start: ${startIndex}, End: ${endIndex}, Length: ${content.length}`
    );
    console.log(`    Content: "${content.substring(0, 200)}..."`);
    console.log(`    Lines: ${content.split("\n").length}`);

    if (!sections[currentHeader.sectionName] && content.length > 0) {
      sections[currentHeader.sectionName] = content;
    }
  }

  return sections;
}

const sections = identifySections(sampleResume);

console.log("\n\n=== FINAL SECTIONS ===");
for (const [name, content] of Object.entries(sections)) {
  console.log(`\n${name}:`);
  console.log(`  Length: ${content.length}`);
  console.log(`  Content:\n${content}`);
}

// Now test parsing each section
console.log("\n\n=== TESTING PARSERS ===\n");

function parseWorkExperience(text) {
  if (!text) return [];
  console.log("parseWorkExperience input length:", text.length);

  const datePattern =
    /([A-Z][a-z]+\.?\s+\d{4})\s*[-–—]\s*((?:[A-Z][a-z]+\.?\s+\d{4})|Present)/g;

  const dateMatches = [];
  let match;
  while ((match = datePattern.exec(text)) !== null) {
    dateMatches.push({
      startDate: match[1],
      endDate: match[2],
      index: match.index,
      length: match[0].length,
    });
  }

  console.log("  Dates found:", dateMatches.length);
  for (const dm of dateMatches) {
    console.log(`    ${dm.startDate} - ${dm.endDate} at index ${dm.index}`);
  }

  return dateMatches.length;
}

function parseEducation(text) {
  if (!text) return [];
  console.log("parseEducation input length:", text.length);

  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim().length > 0);
  console.log("  Blocks found:", blocks.length);

  return blocks.length;
}

function parseSkills(text) {
  if (!text) return [];
  console.log("parseSkills input length:", text.length);

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  console.log("  Lines found:", lines.length);

  let count = 0;
  for (const line of lines) {
    if (line.includes(":")) {
      count++;
      console.log(`    ${line.substring(0, 50)}...`);
    }
  }

  return count;
}

function parseProjects(text) {
  if (!text) return [];
  console.log("parseProjects input length:", text.length);

  const projectTitleRegex =
    /([A-Z][A-Za-z0-9\s]+(?:[A-Z][A-Za-z0-9\s]+)*)\s*\|\s*([^•]+?)(?=•|(?:[A-Z][A-Za-z0-9\s]+(?:[A-Z][A-Za-z0-9\s]+)*\s*\|)|$)/g;

  let count = 0;
  let m;
  while ((m = projectTitleRegex.exec(text)) !== null) {
    count++;
    console.log(`    ${m[1]}`);
  }

  return count;
}

console.log(
  "\nWork experience entries:",
  parseWorkExperience(sections.experience || "")
);
console.log("Education entries:", parseEducation(sections.education || ""));
console.log("Skills categories:", parseSkills(sections.skills || ""));
console.log("Projects count:", parseProjects(sections.projects || ""));
