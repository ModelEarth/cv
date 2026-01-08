// Test the exact extracted education text from the console
const educationText = `DePaul University Sep. 2023 - June 2025 Master's in Computer Science Chicago, USA Velammal Engineering College June. 2016 - April 2020 Bachelor of Technology in Information Technology Chennai, India Senior Service-now Developer (Autodesk, Fortive) June 2020 - Aug 2023`;

console.log("Full text to parse:");
console.log(educationText);
console.log("\n" + "=".repeat(80) + "\n");

// Find all dates
const dateRangePattern =
  /([A-Z][a-z]+\.?\s+\d{4})\s*[-–—]\s*((?:[A-Z][a-z]+\.?\s+\d{4})|Present)/g;
let dateMatch;
const dateMatches = [];

while ((dateMatch = dateRangePattern.exec(educationText)) !== null) {
  dateMatches.push({
    fullMatch: dateMatch[0],
    startDate: dateMatch[1],
    endDate: dateMatch[2],
    index: dateMatch.index,
  });
  console.log(`Found date at index ${dateMatch.index}: "${dateMatch[0]}"`);
}

console.log("\n" + "=".repeat(80) + "\n");

// For each date, analyze what's after it
for (let i = 0; i < dateMatches.length; i++) {
  const current = dateMatches[i];
  const next = dateMatches[i + 1];

  console.log(`\n--- Entry ${i + 1} ---`);
  console.log(`Date: ${current.fullMatch} (index: ${current.index})`);

  // Get text after date
  const afterDateStart = current.index + current.fullMatch.length;
  let afterDateText;
  if (next) {
    afterDateText = educationText.substring(afterDateStart, next.index);
  } else {
    afterDateText = educationText.substring(
      afterDateStart,
      afterDateStart + 200
    );
  }

  console.log(`Text after date: "${afterDateText}"`);

  // Try degree pattern 1
  const pattern1 =
    /^\s*((?:Master|Bachelor|PhD|Doctorate)'?s?\s+(?:in|of)\s+[A-Za-z\s]+?)(?=\s+[A-Z][a-z]+,|\s+(?:University|College|Institute|School|Academy)|\s+$)/i;
  let degreeMatch = afterDateText.match(pattern1);

  console.log(
    `Pattern 1 match: ${degreeMatch ? `"${degreeMatch[1]}"` : "NO MATCH"}`
  );

  if (!degreeMatch) {
    // Try pattern 2
    const pattern2 =
      /^\s*((?:Master|Bachelor|PhD|Doctorate)'?s?\s+(?:in|of)?\s+[A-Za-z\s&(),-]+?)(?=\s+(?:University|College|Institute|School|Academy)|,|$)/i;
    degreeMatch = afterDateText.match(pattern2);
    console.log(
      `Pattern 2 match: ${degreeMatch ? `"${degreeMatch[1]}"` : "NO MATCH"}`
    );
  }

  if (degreeMatch) {
    const fullDegree = degreeMatch[1].trim();
    let studyType = "Degree";
    if (/master/i.test(fullDegree)) {
      studyType = "Master's";
    } else if (/bachelor/i.test(fullDegree)) {
      studyType = "Bachelor's";
    } else if (/phd|doctorate/i.test(fullDegree)) {
      studyType = "PhD";
    }
    console.log(`Study Type: ${studyType}`);
  }
}
