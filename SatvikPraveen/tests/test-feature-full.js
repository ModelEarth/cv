// Direct parsing test - functions embedded

function cleanAndNormalizeText(text) {
  if (!text) return "";
  let cleaned = text
    .replace(/[ \t]+/g, " ")
    .replace(/[-–—]/g, "-")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
  return cleaned;
}

function identifySections(text) {
  const sections = {};
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
      while ((match = regex.exec(text)) !== null) {
        headerMatches.push({ sectionName, keyword, index: match.index });
      }
    }
  }

  headerMatches.sort((a, b) => a.index - b.index);
  const uniqueMatches = [];
  const seenSections = new Set();

  for (const match of headerMatches) {
    if (!seenSections.has(match.sectionName)) {
      uniqueMatches.push(match);
      seenSections.add(match.sectionName);
    }
  }

  for (let i = 0; i < uniqueMatches.length; i++) {
    const current = uniqueMatches[i];
    const next = uniqueMatches[i + 1];
    const startIndex = current.index + current.keyword.length;
    const endIndex = next ? next.index : text.length;
    const content = text.substring(startIndex, endIndex).trim();
    if (content.length > 0) {
      sections[current.sectionName] = content;
    }
  }

  return sections;
}

function parseWorkExperience(text) {
  if (!text) return [];

  const jobs = [];

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

  for (let i = 0; i < dateMatches.length; i++) {
    const dateInfo = dateMatches[i];
    const nextDateInfo = dateMatches[i + 1];

    // Find the header by working BACKWARDS from the date
    const linesBefore = text.substring(0, dateInfo.index);
    const headerLines = linesBefore
      .split("\n")
      .reverse()
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let position = "";
    let company = "";

    if (headerLines.length >= 2) {
      position = headerLines[1];
      company = headerLines[0];
    } else if (headerLines.length === 1) {
      position = headerLines[0];
    }

    // Get text AFTER the date (description)
    let descStart = dateInfo.endIndex;
    let descEnd = nextDateInfo ? nextDateInfo.index : text.length;
    let description = text.substring(descStart, descEnd).trim();

    // Strip out the next job's position/company header if present
    if (nextDateInfo) {
      const beforeNextDate = text.substring(0, nextDateInfo.index);
      const allLines = beforeNextDate.split("\n");

      const nextJobHeaderLines = [];
      for (let j = allLines.length - 1; j >= 0; j--) {
        const line = allLines[j].trim();
        if (line.length === 0) {
          if (nextJobHeaderLines.length > 0) break;
        } else if (!line.startsWith("•")) {
          nextJobHeaderLines.unshift(line);
          if (nextJobHeaderLines.length >= 2) break;
        }
      }

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
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  let currentEntry = { institution: "", location: "", degree: "", year: "" };
  const entries = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isLocation = /,/.test(line) && /^[A-Z][\w\s]+,\s*[A-Z]/.test(line);
    const isYear = /^\w+\s+\d{4}$/.test(line);
    const isDegree = /bachelor|master|degree|phd|doctorate/i.test(line);

    if (
      !isLocation &&
      !isYear &&
      !isDegree &&
      currentEntry.institution === ""
    ) {
      currentEntry.institution = line;
    } else if (isLocation && currentEntry.institution !== "") {
      currentEntry.location = line;
    } else if (isDegree && currentEntry.institution !== "") {
      currentEntry.degree = line;
    } else if (isYear && currentEntry.institution !== "") {
      currentEntry.year = line;
      entries.push({ ...currentEntry });
      currentEntry = { institution: "", location: "", degree: "", year: "" };
    }
  }

  if (currentEntry.institution !== "") {
    entries.push(currentEntry);
  }

  for (const entry of entries) {
    let studyType = "Degree";
    let area = "";
    if (entry.degree) {
      if (/master/i.test(entry.degree)) {
        studyType = "Master's";
      } else if (/bachelor/i.test(entry.degree)) {
        studyType = "Bachelor's";
      }
      const fieldMatch = entry.degree.match(
        /(?:Bachelor|Master|PhD)(?:\s+of)?\s+(?:Science|Arts|Technology|Engineering)\s+(?:in\s+)?([^,]+)/i
      );
      if (fieldMatch) {
        area = fieldMatch[1].trim();
      } else {
        area = entry.degree;
      }
    }
    education.push({
      institution: entry.institution,
      studyType: studyType,
      area: area || "Education",
      startDate: "",
      endDate: entry.year,
      location: entry.location,
    });
  }
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
          if (current.trim().length > 0) {
            keywords.push(current.trim());
          }
          current = "";
        } else {
          current += char;
        }
      }

      if (current.trim().length > 0) {
        keywords.push(current.trim());
      }

      if (keywords.length > 0) {
        skills.push({ name: name, keywords: keywords });
      }
    } else {
      const keywords = line
        .split(/[,;•|]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (keywords.length > 0) {
        skills.push({ name: "Skills", keywords: keywords });
      }
    }
  }
  return skills;
}

function parseProjects(text) {
  if (!text) return [];
  const projects = [];
  const projectTitleRegex =
    /([A-Z][A-Za-z0-9\s]+(?:[A-Z][A-Za-z0-9\s]+)*)\s*\|\s*([^•]+?)(?=•|(?:[A-Z][A-Za-z0-9\s]+(?:[A-Z][A-Za-z0-9\s]+)*\s*\|)|$)/g;
  let match;
  const matches = [];
  while ((match = projectTitleRegex.exec(text)) !== null) {
    matches.push({
      title: match[1].trim(),
      tech: match[2].trim(),
      index: match.index,
      length: match[0].length,
    });
  }
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];
    let descStart = currentMatch.index + currentMatch.length;
    let descEnd = nextMatch ? nextMatch.index : text.length;
    let description = text.substring(descStart, descEnd).trim();
    description = description
      .replace(/^•\s*/gm, "")
      .replace(/\s+/g, " ")
      .trim();
    projects.push({
      name: currentMatch.title,
      keywords: currentMatch.tech
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      summary: description,
    });
  }
  return projects;
}

// Test data
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

console.log("=== FULL PARSING TEST ===\n");

const cleanedText = cleanAndNormalizeText(sampleResume);
const sections = identifySections(cleanedText);

console.log("✓ Sections found:", Object.keys(sections));
console.log();

const work = parseWorkExperience(sections.experience || "");
console.log("✓ Work Experience (" + work.length + " entries):");
console.log(JSON.stringify(work, null, 2));
console.log();

const education = parseEducation(sections.education || "");
console.log("✓ Education (" + education.length + " entries):");
console.log(JSON.stringify(education, null, 2));
console.log();

const skills = parseSkills(sections.skills || "");
console.log("✓ Skills (" + skills.length + " categories):");
console.log(JSON.stringify(skills, null, 2));
console.log();

const projects = parseProjects(sections.projects || "");
console.log("✓ Projects (" + projects.length + " projects):");
console.log(JSON.stringify(projects, null, 2));
