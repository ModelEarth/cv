// Final version: Better parsing of position/company

const experienceText = `Senior Service-now Developer (Autodesk, Fortive) Cognizant Technology Solutions (Associate) June 2020 - Aug 2023 Chennai, India Senior ServiceNow Developer with 3+ years of ITSM experience, specializing in CMDB and Event Management for clients like Autodesk and Fortive...`;

function parseWorkExperienceFinal(text) {
  if (!text) return [];

  const jobs = [];

  // Find all date patterns like "June 2020 - Aug 2023"
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

  // Process each date range as a separate job
  for (let i = 0; i < dateMatches.length; i++) {
    const dateInfo = dateMatches[i];
    const nextDateInfo = dateMatches[i + 1];

    // Extract the job header (everything before the date on the same block)
    // Look backwards from the date to find the start of this job

    // Get text from start to this date
    let jobStart =
      i === 0 ? 0 : dateMatches[i - 1].index + dateMatches[i - 1].length;
    let jobHeaderEnd = dateInfo.index;

    let jobHeader = text.substring(jobStart, jobHeaderEnd).trim();

    // Extract description (from end of date to start of next date or end)
    let descStart = dateInfo.index + dateInfo.length;
    let descEnd = nextDateInfo ? nextDateInfo.index : text.length;
    let description = text.substring(descStart, descEnd).trim();

    // Remove location (City, Country)
    description = description
      .replace(
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)\b\s*/g,
        ""
      )
      .trim();

    // Parse job header: Split by parentheses pattern
    // Format: "Senior Service-now Developer (Autodesk, Fortive) Cognizant Technology Solutions (Associate)"

    // Extract parenthetical info
    const parensRegex = /\(([^)]+)\)/g;
    const parensMatches = [];
    while ((pmatch = parensRegex.exec(jobHeader)) !== null) {
      parensMatches.push(pmatch[1]);
    }

    // Remove all parenthetical content to get company name parts
    let cleanHeader = jobHeader
      .replace(/\s*\([^)]*\)/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Split the clean header - first part is position, second part is company
    const parts = cleanHeader.split(/\s{2,}/).filter((p) => p.length > 0);

    let position = parts[0] || "";
    let company = parts[1] || "";

    // If we have parenthetical info, add it
    if (parensMatches.length > 0) {
      // Usually first parens is clients, second is role type
      if (parensMatches.length >= 2) {
        position += ` (${parensMatches[0]})`;
        company += ` (${parensMatches[1]})`;
      } else {
        position += ` (${parensMatches[0]})`;
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

console.log("===== FINAL WORK EXPERIENCE PARSING =====");
const result = parseWorkExperienceFinal(experienceText);
console.log(JSON.stringify(result, null, 2));
