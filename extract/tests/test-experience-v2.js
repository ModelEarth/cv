// Better parsing for single position with complex formatting

const experienceText = `Senior Service-now Developer (Autodesk, Fortive) Cognizant Technology Solutions (Associate) June 2020 - Aug 2023 Chennai, India Senior ServiceNow Developer with 3+ years of ITSM experience, specializing in CMDB and Event Management for clients like Autodesk and Fortive Developed REST APIs and created 30+ custom workflows and catalog items to automate incident, request, and change processes in ServiceNow Integrated third-party tools such as SAP, QlikView, and Azure, improving platform interoperability and automating cross-system data flows Resolved over 600 incidents and service requests by collaborating with clients to understand requirements and deliver tailored solutions Managed development tasks using Jira and contributed to agile delivery cycles through hands-on design, debugging, testing, and deployment of 60+ client-facing features`;

function parseWorkExperienceFixed(text) {
  if (!text) return [];

  const jobs = [];

  // Strategy: Look for date patterns to identify separate jobs
  // Each job should have at least one date like "June 2020 - Aug 2023"
  // Everything between two date patterns is one job

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
      fullMatch: match[0],
    });
  }

  console.log("Found dates:", dateMatches);

  if (dateMatches.length === 0) {
    console.log("No dates found");
    return [];
  }

  // Extract job info for each date range
  for (let i = 0; i < dateMatches.length; i++) {
    const dateInfo = dateMatches[i];
    const nextDateInfo = dateMatches[i + 1];

    // Job title and company are BEFORE the date
    const beforeDate = text.substring(0, dateInfo.index).trim();

    // Description is AFTER the date until the next date or end
    let descStart = dateInfo.index + dateInfo.length;
    let descEnd = nextDateInfo ? nextDateInfo.index : text.length;
    let description = text.substring(descStart, descEnd).trim();

    // Remove location line (City, Country pattern)
    description = description
      .replace(
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)\b\s*/g,
        ""
      )
      .trim();

    // Get the last 2 lines before the date for position and company
    const linesBefore = beforeDate
      .split(/[\n•]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    let position = "";
    let company = "";

    if (linesBefore.length >= 2) {
      // Assume last line is company/role, second-to-last is position
      company = linesBefore[linesBefore.length - 1];
      position = linesBefore[linesBefore.length - 2];
    } else if (linesBefore.length === 1) {
      position = linesBefore[0];
      company = "";
    }

    console.log(`Job ${i + 1}:`);
    console.log(`  Position: ${position}`);
    console.log(`  Company: ${company}`);
    console.log(`  Dates: ${dateInfo.startDate} - ${dateInfo.endDate}`);

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

console.log("\n===== PARSED WORK EXPERIENCE (FIXED) =====");
const parsed = parseWorkExperienceFixed(experienceText);
console.log(JSON.stringify(parsed, null, 2));
