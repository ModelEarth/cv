// Debug: Parse work experience from malformed PDF text

const experienceText = `Senior Service-now Developer (Autodesk, Fortive) Cognizant Technology Solutions (Associate) June 2020 - Aug 2023 Chennai, India Senior ServiceNow Developer with 3+ years of ITSM experience, specializing in CMDB and Event Management for clients like Autodesk and Fortive Developed REST APIs and created 30+ custom workflows and catalog items to automate incident, request, and change processes in ServiceNow Integrated third-party tools such as SAP, QlikView, and Azure, improving platform interoperability and automating cross-system data flows Resolved over 600 incidents and service requests by collaborating with clients to understand requirements and deliver tailored solutions Managed development tasks using Jira and contributed to agile delivery cycles through hands-on design, debugging, testing, and deployment of 60+ client-facing features`;

function parseWorkExperienceBetter(text) {
  if (!text) return [];

  const jobs = [];

  // Strategy: Look for patterns like:
  // [Job Title] ([Company], [Client])
  // or
  // [Job Title] (Company)
  // followed by dates and description

  // Pattern: "Job Title (Optional: Company/Client)" followed by dates
  const jobPattern =
    /([A-Z][^(]+?)\s*\(([^)]+)\)\s*([A-Z][a-z]+ \d{4}\s*[-–—]\s*(?:[A-Z][a-z]+ \d{4}|Present))?/g;

  let match;
  const matches = [];

  while ((match = jobPattern.exec(text)) !== null) {
    matches.push({
      title: match[1].trim(),
      company: match[2].trim(),
      dates: match[3] ? match[3].trim() : "",
      index: match.index,
      length: match[0].length,
    });
  }

  console.log("Found job patterns:", matches);

  // Extract descriptions between jobs
  for (let i = 0; i < matches.length; i++) {
    const currentJob = matches[i];
    const nextJob = matches[i + 1];

    let descStart = currentJob.index + currentJob.length;
    let descEnd = nextJob ? nextJob.index : text.length;

    let description = text.substring(descStart, descEnd).trim();

    // Parse dates from description if not found in pattern
    let startDate = "";
    let endDate = "";

    if (currentJob.dates) {
      const dateParts = currentJob.dates.match(
        /([A-Z][a-z]+ \d{4})\s*[-–—]\s*((?:[A-Z][a-z]+ \d{4})|Present)/
      );
      if (dateParts) {
        startDate = dateParts[1];
        endDate = dateParts[2];
      }
    } else {
      // Try to find dates in description
      const dateMatch = description.match(
        /([A-Z][a-z]+ \d{4})\s*[-–—]\s*((?:[A-Z][a-z]+ \d{4})|Present)/
      );
      if (dateMatch) {
        startDate = dateMatch[1];
        endDate = dateMatch[2];
        // Remove dates from description
        description = description.replace(dateMatch[0], "").trim();
      }
    }

    // Remove location info if present (format: "City, Country")
    description = description
      .replace(
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)\b/g,
        ""
      )
      .trim();

    jobs.push({
      position: currentJob.title,
      company: currentJob.company,
      startDate: startDate,
      endDate: endDate,
      summary: description,
    });
  }

  return jobs;
}

console.log("\n===== PARSED WORK EXPERIENCE =====");
const parsed = parseWorkExperienceBetter(experienceText);
console.log(JSON.stringify(parsed, null, 2));
