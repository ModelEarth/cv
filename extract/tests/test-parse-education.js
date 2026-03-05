// Test parseEducation with the correctly extracted EDUCATION section
function parseEducation(text) {
  if (!text) return [];

  const education = [];

  // Debug: log the actual text being parsed
  if (text && text.length > 0) {
    console.log(
      "[parseEducation] Received text:",
      text.substring(0, 150),
      "... (length:",
      text.length,
      ")"
    );
  }

  // Strategy: Find all date ranges first (these are our anchors)
  // Then extract institution/degree/location around each date
  // Format: [Institution] [StartDate - EndDate] [Degree] [Location]

  const dateRangePattern =
    /([A-Z][a-z]+\.?\s+\d{4})\s*[-–—]\s*((?:[A-Z][a-z]+\.?\s+\d{4})|Present)/g;
  let dateMatch;
  const dateMatches = [];

  while ((dateMatch = dateRangePattern.exec(text)) !== null) {
    dateMatches.push({
      fullMatch: dateMatch[0],
      startDate: dateMatch[1],
      endDate: dateMatch[2],
      index: dateMatch.index,
    });
  }

  console.log(`[parseEducation] Found ${dateMatches.length} date ranges`);
  dateMatches.forEach((dm, i) => {
    console.log(`  Date ${i + 1}: "${dm.fullMatch}" at index ${dm.index}`);
  });

  // Process each date range found
  for (let i = 0; i < dateMatches.length; i++) {
    const current = dateMatches[i];
    const next = dateMatches[i + 1];

    // Extract institution: look backward from date for institution keywords
    // Strategy: Find all institutions before this date, take the one closest to date
    let institution = "";
    const beforeDateText = text.substring(
      Math.max(0, current.index - 200),
      current.index
    );
    // Find all institution occurrences
    const institutionKeywords = [
      "University",
      "College",
      "Institute",
      "School",
      "Academy",
    ];
    let closestInstitution = null;
    let closestIndex = -1;

    for (const keyword of institutionKeywords) {
      let searchStart = 0;
      let idx;
      // Find all occurrences of this keyword
      while ((idx = beforeDateText.indexOf(keyword, searchStart)) !== -1) {
        if (idx > closestIndex) {
          closestIndex = idx;
          // Extract institution name before this keyword
          const beforeThis = beforeDateText.substring(0, idx);
          // Look for the start of institution name (typically one or two words)
          // Go backward to find capitalized word(s) - match SHORT names only
          const nameMatch = beforeThis.match(
            /([A-Z][A-Za-z&()]*(?:\s+[A-Z][A-Za-z&()]*)?)\s*$/
          );
          if (nameMatch) {
            closestInstitution = nameMatch[1].trim() + " " + keyword;
          }
        }
        searchStart = idx + 1;
      }
    }

    if (closestInstitution) {
      institution = closestInstitution;
    }

    // Extract degree and area: look forward from date end for degree keywords
    let studyType = "Degree";
    let area = "";
    const afterDateStart = current.index + current.fullMatch.length;
    let afterDateText;

    // Determine end point for extracting text after date
    // Use next date as boundary if available
    if (next) {
      afterDateText = text.substring(afterDateStart, next.index);
    } else {
      afterDateText = text.substring(afterDateStart, afterDateStart + 200);
    }

    console.log(
      `[Entry ${i + 1}] afterDateText: "${afterDateText.substring(0, 80)}"`
    );
    let degreeMatch = afterDateText.match(
      /^\s*((?:Master|Bachelor|PhD|Doctorate)'?s?\s+(?:in|of)\s+[A-Za-z\s]+?)(?=\s+[A-Z][a-z]+,|\s+(?:University|College|Institute|School|Academy)|\s+$)/i
    );
    console.log(
      `[Entry ${i + 1}] Pattern 1 match: ${degreeMatch ? degreeMatch[1] : "NO"}`
    );

    // If first pattern didn't match, try a more lenient one that stops at punctuation or next institution
    if (!degreeMatch) {
      degreeMatch = afterDateText.match(
        /^\s*((?:Master|Bachelor|PhD|Doctorate)'?s?\s+(?:in|of)?\s+[A-Za-z\s&(),-]+?)(?=\s+(?:University|College|Institute|School|Academy)|,|$)/i
      );
      console.log(
        `[Entry ${i + 1}] Pattern 2 match: ${
          degreeMatch ? degreeMatch[1] : "NO"
        }`
      );
    }

    // If STILL no match, try just looking for degree types without strict lookahead
    if (!degreeMatch) {
      degreeMatch = afterDateText.match(
        /(Master|Bachelor|PhD|Doctorate)'?s?\s+(?:in|of)?\s+[A-Za-z\s&(),-]*/i
      );
      console.log(
        `[Entry ${i + 1}] Pattern 3 match: ${
          degreeMatch ? degreeMatch[1] : "NO"
        }`
      );
    }

    if (degreeMatch) {
      const fullDegree = degreeMatch[1].trim();

      // Extract study type
      if (/master/i.test(fullDegree)) {
        studyType = "Master's";
      } else if (/bachelor/i.test(fullDegree)) {
        studyType = "Bachelor's";
      } else if (/phd|doctorate/i.test(fullDegree)) {
        studyType = "PhD";
      }
      console.log(
        `[Entry ${i + 1}] StudyType: ${studyType}, Full: "${fullDegree}"`
      );

      // Extract area (field of study) - everything after "in" or "of"
      const fieldMatch = fullDegree.match(/(?:in|of)\s+([A-Za-z\s&(),-]+)/i);
      area = fieldMatch ? fieldMatch[1].trim() : fullDegree;
    }

    // Extract location: look for patterns like "City, Country" or "City, State"
    // Location comes after degree
    let location = "";
    if (degreeMatch) {
      const afterDegree = afterDateText.substring(degreeMatch[0].length);
      // Match: spaces + City + comma + spaces + Country/State (1-2 words max)
      const locationMatch = afterDegree.match(
        /\s+([A-Z][a-z]+),\s*([A-Z][A-Za-z]{1,5}(?:\s+[A-Z][A-Za-z]{1,5})?)(?:\s|$)/
      );
      if (locationMatch) {
        location = `${locationMatch[1]}, ${locationMatch[2]}`;
      }
    }

    // Only add if we found at least institution and dates
    // AND: We must have found a degree (studyType should not be the default "Degree" unless we specifically set it)
    // This filters out entries that are jobs, not education
    const isDegreeType =
      studyType === "Master's" ||
      studyType === "Bachelor's" ||
      studyType === "PhD";
    if (institution && current.startDate && current.endDate && isDegreeType) {
      education.push({
        institution: institution,
        studyType: studyType,
        area: area || institution,
        startDate: current.startDate,
        endDate: current.endDate,
        location: location,
      });
      console.log(
        `[parseEducation] Added entry: ${institution} (${studyType})`
      );
    } else {
      console.log(
        `[parseEducation] SKIPPED entry - institution:${!!institution}, startDate:${!!current.startDate}, endDate:${!!current.endDate}, isDegreeType:${isDegreeType}, studyType:${studyType}`
      );
    }
  }

  console.log(
    `[parseEducation] Returning ${education.length} education entries`
  );
  return education;
}

// The correctly extracted EDUCATION section from above test
const educationText = `DePaul University Sep. 2023 - June 2025 Master's in Computer Science Chicago, USA

Velammal Engineering College June. 2016 - April 2020 Bachelor of Technology in Information Technology
 Chennai, India`;

console.log("EDUCATION section text:");
console.log(`"${educationText}"`);
console.log("\n" + "=".repeat(80) + "\n");

const result = parseEducation(educationText);

console.log("\n" + "=".repeat(80) + "\n");
console.log("\nFinal Result:");
console.log(`${result.length} education entries:`);
result.forEach((e, i) => {
  console.log(`\n${i + 1}. ${e.institution}`);
  console.log(`   Type: ${e.studyType}`);
  console.log(`   Area: ${e.area}`);
  console.log(`   Dates: ${e.startDate} - ${e.endDate}`);
  console.log(`   Location: ${e.location}`);
});
