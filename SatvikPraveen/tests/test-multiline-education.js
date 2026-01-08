// Test the multiline education parsing
function parseEducation(text) {
  if (!text) return [];
  const education = [];

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

  console.log(`Found ${dateMatches.length} dates`);

  for (let i = 0; i < dateMatches.length; i++) {
    const current = dateMatches[i];
    const next = dateMatches[i + 1];

    // Extract institution
    let institution = "";
    const beforeDateText = text.substring(
      Math.max(0, current.index - 200),
      current.index
    );
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
      while ((idx = beforeDateText.indexOf(keyword, searchStart)) !== -1) {
        if (idx > closestIndex) {
          closestIndex = idx;
          const beforeThis = beforeDateText.substring(0, idx);
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

    // Extract degree
    let studyType = "Degree";
    let area = "";
    const afterDateStart = current.index + current.fullMatch.length;
    let afterDateText = next
      ? text.substring(afterDateStart, next.index)
      : text.substring(afterDateStart, afterDateStart + 200);

    // NEW: Allow newlines in patterns
    let degreeMatch = afterDateText.match(
      /[\s\n]*((?:Master|Bachelor|PhD|Doctorate)'?s?\s+(?:in|of)\s+[A-Za-z\s]+?)(?=\s+[A-Z][a-z]+,|\s+(?:University|College|Institute|School|Academy)|\s|$)/i
    );

    if (!degreeMatch) {
      degreeMatch = afterDateText.match(
        /[\s\n]*((?:Master|Bachelor|PhD|Doctorate)'?s?\s+(?:in|of)?\s+[A-Za-z\s&(),-]+?)(?=\s+(?:University|College|Institute|School|Academy)|,|\n|$)/i
      );
    }

    if (!degreeMatch) {
      degreeMatch = afterDateText.match(
        /[\s\n]*(Master|Bachelor|PhD|Doctorate)'?s?\s+(?:in|of)?\s+[A-Za-z\s&(),-]*/i
      );
    }

    if (degreeMatch) {
      const fullDegree = degreeMatch[1].trim();
      if (/master/i.test(fullDegree)) {
        studyType = "Master's";
      } else if (/bachelor/i.test(fullDegree)) {
        studyType = "Bachelor's";
      } else if (/phd|doctorate/i.test(fullDegree)) {
        studyType = "PhD";
      }
      const fieldMatch = fullDegree.match(/(?:in|of)\s+([A-Za-z\s&(),-]+)/i);
      area = fieldMatch ? fieldMatch[1].trim() : fullDegree;
    }

    // Extract location
    let location = "";
    if (degreeMatch) {
      const afterDegree = afterDateText.substring(degreeMatch[0].length);
      const locationMatch = afterDegree.match(
        /\s+([A-Z][a-z]+),\s*([A-Z][A-Za-z]{1,5}(?:\s+[A-Z][A-Za-z]{1,5})?)(?:\s|$)/
      );
      if (locationMatch) {
        location = `${locationMatch[1]}, ${locationMatch[2]}`;
      }
    }

    // Filter by degree type
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
    }
  }

  return education;
}

// Test with real multiline format
const educationText = `DePaul University Sep. 2023 – June 2025
  Master's in Computer Science Chicago, USA
Velammal Engineering College June. 2016 – April 2020
  Bachelor of Technology in Information Technology Chennai, India`;

console.log("Testing with real multiline format:\n");
const result = parseEducation(educationText);

console.log(`\nResult: ${result.length} entries`);
result.forEach((e, i) => {
  console.log(`\n${i + 1}. ${e.institution} (${e.studyType})`);
  console.log(`   Area: ${e.area}`);
  console.log(`   Location: ${e.location}`);
});
