// Test date pattern matching

const datePattern =
  /([A-Z][a-z]+\.?\s+\d{4})\s*[-–—]\s*((?:[A-Z][a-z]+\.?\s+\d{4})|Present)/g;

const testCases = [
  "Sep. 2023 - June 2025",
  "Sep. 2023 – June 2025",
  "June. 2016 - April 2020",
  "June 2020 - Aug 2023",
  "Sep.2023-June2025",
];

console.log("Testing date pattern: " + datePattern.source);
console.log();

testCases.forEach((testCase) => {
  datePattern.lastIndex = 0;
  const match = datePattern.exec(testCase);
  if (match) {
    console.log(`✓ MATCH: "${testCase}"`);
    console.log(`  Full: "${match[0]}"`);
    console.log(`  Start: "${match[1]}"`);
    console.log(`  End: "${match[2]}"`);
  } else {
    console.log(`✗ NO MATCH: "${testCase}"`);
  }
  console.log();
});
