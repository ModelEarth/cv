// Debug why Entry 1 is not matching degree pattern

// From console: "DePaul University Sep. 2023 - June 2025 Master's in Computer Science Chicago, USA..."
const fullText =
  "DePaul University Sep. 2023 - June 2025 Master's in Computer Science Chicago, USA Velammal Engineering College June. 2016 - April 2020 Bachelor of Technology in Information Technology Chennai, India Senior Service-now Developer (Autodesk, Fortive) June 2020 - Aug 2023";

// Find first date
const firstDateMatch = fullText.match(/Sep\.\s+2023\s*[-–—]\s*June\s+2025/);
console.log(
  "First date found:",
  firstDateMatch ? firstDateMatch[0] : "NOT FOUND"
);
console.log("First date index:", firstDateMatch ? firstDateMatch.index : "N/A");

if (firstDateMatch) {
  const dateEnd = firstDateMatch.index + firstDateMatch[0].length;
  const afterDate = fullText.substring(dateEnd, dateEnd + 100);

  console.log("\nText after first date:");
  console.log(`"${afterDate}"`);

  // Test the degree patterns
  const pattern1 =
    /^\s*((?:Master|Bachelor|PhD|Doctorate)'?s?\s+(?:in|of)\s+[A-Za-z\s]+?)(?=\s+[A-Z][a-z]+,|\s+(?:University|College|Institute|School|Academy)|\s+$)/i;
  const match1 = afterDate.match(pattern1);

  console.log("\nPattern 1 result:", match1 ? match1[1] : "NO MATCH");
  if (match1) {
    console.log("Full match:", match1[0]);
    console.log("Lookahead would have matched:", match1[0].length, "chars");
  }

  // Let's also test simpler pattern
  const simplePattern = /Master's\s+in\s+Computer\s+Science/i;
  const simpleMatch = afterDate.match(simplePattern);
  console.log(
    "\nSimple 'Master's in Computer Science' pattern:",
    simpleMatch ? simpleMatch[0] : "NO MATCH"
  );

  // Let's check what comes after "Master's in Computer Science"
  const masterIndex = afterDate.indexOf("Master's in Computer Science");
  if (masterIndex !== -1) {
    const endOfMasters = masterIndex + "Master's in Computer Science".length;
    const afterMasters = afterDate.substring(endOfMasters, endOfMasters + 30);
    console.log(`\nAfter 'Master's in Computer Science': "${afterMasters}"`);
  }
}
