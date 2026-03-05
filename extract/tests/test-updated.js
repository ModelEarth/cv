// Updated test with fixed parsers
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

function parseWorkExperience(text) {
  if (!text) return [];

  const jobs = [];
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

  if (dateMatches.length === 0) return [];

  for (let i = 0; i < dateMatches.length; i++) {
    const dateInfo = dateMatches[i];
    const nextDateInfo = dateMatches[i + 1];

    let headerStart =
      i === 0 ? 0 : dateMatches[i - 1].index + dateMatches[i - 1].length;
    let headerEnd = dateInfo.index;
    let header = text.substring(headerStart, headerEnd).trim();

    let descStart = dateInfo.index + dateInfo.length;
    let descEnd = nextDateInfo ? nextDateInfo.index : text.length;
    let description = text.substring(descStart, descEnd).trim();

    const locationRemoved = description.replace(
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)\b\s*/,
      ""
    );

    const headerLines = header
      .split(/[\n•]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.match(/^\s*$/));

    let position = "";
    let company = "";

    if (headerLines.length >= 2) {
      position = headerLines[0];
      company = headerLines[1];
    } else if (headerLines.length === 1) {
      const line = headerLines[0];
      if (line.includes("|")) {
        const parts = line.split("|").map((p) => p.trim());
        position = parts[0] || "";
        company = parts[1] || "";
      } else {
        position = line;
      }
    }

    jobs.push({
      position: position || "Position",
      company: company || "Company",
      startDate: dateInfo.startDate,
      endDate: dateInfo.endDate,
      summary: locationRemoved.trim(),
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

  for (const line of lines) {
    const locationMatch = line.match(
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+|[A-Z]{2}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/
    );
    const location = locationMatch ? locationMatch[0] : "";

    const yearMatch = line.match(/\b(20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : "";

    let studyType = "Degree";
    if (line.match(/\b(Master['']?s?)\b/i)) {
      studyType = "Master's";
    } else if (line.match(/\b(Bachelor['']?s?)\b/i)) {
      studyType = "Bachelor's";
    } else if (line.match(/\b(PhD|Doctorate)\b/i)) {
      studyType = "Doctorate";
    }

    let area = "Education";
    const degreePattern =
      /\b(Bachelor|Master|PhD|Doctorate)\b[^,]*(?:,|\s+(in|of)\s+([^,]+))?/i;
    const degreeMatch = line.match(degreePattern);
    if (degreeMatch) {
      area = degreeMatch[0]
        .replace(/Bachelor['']?s?\s*/i, "")
        .replace(/Master['']?s?\s*/i, "")
        .replace(/\s+(in|of)\s+/i, "")
        .replace(/Computer Science/i, "Computer Science")
        .replace(/Information Technology/i, "Information Technology")
        .trim();
    }

    let institution = line;
    if (locationMatch) {
      const beforeLocation = line.substring(0, locationMatch.index).trim();
      institution = beforeLocation;
    }

    const namePattern =
      /^([A-Z][A-Za-z\s]+?)(?:\s+[A-Z][a-z]+,|\s+Bachelor|\s+Master)/;
    const nameMatch = institution.match(namePattern);
    if (nameMatch) {
      institution = nameMatch[1].trim();
    }

    education.push({
      institution: institution,
      studyType: studyType,
      area: area,
      startDate: "",
      endDate: year,
      location: location,
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
    .filter((l) => l.length > 0 && !l.match(/^\s*$/));

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    line = line.replace(/\s+/g, " ").trim();

    if (line.length < 3) continue;

    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const name = line.substring(0, colonIndex).trim();
      const keywordsStr = line.substring(colonIndex + 1).trim();

      const keywords = keywordsStr
        .split(/[,;•|]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.match(/^\s*$/));

      if (keywords.length > 0) {
        skills.push({
          name: name,
          keywords: keywords,
        });
      }
    } else {
      const keywords = line
        .split(/[,;•|]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.match(/^\s*$/));

      if (keywords.length > 0) {
        skills.push({
          name: "Skills",
          keywords: keywords,
        });
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

// Mock identifySections
function identifySections(text) {
  const sections = {};
  const sectionKeywords = {
    education: ["EDUCATION"],
    experience: ["PROFESSIONAL EXPERIENCE", "EXPERIENCE"],
    projects: ["PROJECTS"],
    skills: ["TECHNICAL SKILLS"],
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

  for (let i = 0; i < uniqueMatches.length; i++) {
    const currentHeader = uniqueMatches[i];
    const nextHeader = uniqueMatches[i + 1];

    let startIndex = currentHeader.index + currentHeader.keyword.length;
    let endIndex = nextHeader ? nextHeader.index : text.length;
    let content = text.substring(startIndex, endIndex).trim();

    if (!sections[currentHeader.sectionName] && content.length > 0) {
      sections[currentHeader.sectionName] = content;
    }
  }

  return sections;
}

const sections = identifySections(sampleResume);

console.log("\n=== TESTING UPDATED PARSERS ===\n");

const work = parseWorkExperience(sections.experience || "");
console.log(`✓ Work Experience: ${work.length} entries`);
for (const job of work) {
  console.log(
    `    ${job.position} @ ${job.company} (${job.startDate} - ${job.endDate})`
  );
}

const edu = parseEducation(sections.education || "");
console.log(`\n✓ Education: ${edu.length} entries`);
for (const e of edu) {
  console.log(`    ${e.institution} - ${e.studyType} in ${e.area}`);
  console.log(
    `    Location: ${e.location}, Dates: ${e.startDate} - ${e.endDate}`
  );
}

const sk = parseSkills(sections.skills || "");
console.log(`\n✓ Skills: ${sk.length} categories`);
for (const s of sk) {
  console.log(
    `    ${s.name}: ${s.keywords.slice(0, 3).join(", ")}${
      s.keywords.length > 3 ? "..." : ""
    }`
  );
}

const proj = parseProjects(sections.projects || "");
console.log(`\n✓ Projects: ${proj.length} projects`);
for (const p of proj) {
  console.log(`    ${p.name}`);
  console.log(`    Tech: ${p.keywords.join(", ")}`);
}
