// Test the exact pattern matching for DePaul entry
const text = `DePaul University Sep. 2023 – June 2025
  Master's in Computer Science Chicago, USA
Velammal Engineering College June. 2016 – April 2020
  Bachelor of Technology in Information Technology Chennai, India`;

// Find the first date
const datePattern =
  /([A-Z][a-z]+\.?\s+\d{4})\s*[-–—]\s*((?:[A-Z][a-z]+\.?\s+\d{4})|Present)/g;
const matches = [];
let m;
while ((m = datePattern.exec(text)) !== null) {
  matches.push({
    fullMatch: m[0],
    index: m.index,
  });
}

console.log("Found matches:");
matches.forEach((match, i) => {
  console.log(`${i + 1}. "${match.fullMatch}" at index ${match.index}`);
});

// Get afterDateText for first entry (DePaul)
if (matches.length >= 2) {
  const current = matches[0];
  const next = matches[1];
  const afterDateStart = current.index + current.fullMatch.length;
  const afterDateText = text.substring(afterDateStart, next.index);

  console.log("\n=== DEPAUL ENTRY ===");
  console.log(`afterDateText length: ${afterDateText.length}`);
  console.log(`afterDateText (raw): ${JSON.stringify(afterDateText)}`);
  console.log(
    `afterDateText (visible): "${afterDateText.replace(/\n/g, "\\n")}"`
  );

  // Test each pattern
  console.log("\n--- Testing Patterns ---");

  // Pattern 1
  let pattern1 =
    /[\s\n]+((?:Master|Bachelor|PhD|Doctorate)'?s?)\s+(?:in|of)\s+([A-Za-z\s&(),-]+?)(?=\s+[A-Z][a-z]*,|\s+(?:University|College|Institute|School|Academy)|\n|$)/i;
  let m1 = afterDateText.match(pattern1);
  console.log(
    `Pattern 1: ${m1 ? "MATCH" : "NO"} ${m1 ? `"${m1[1]}" | "${m1[2]}"` : ""}`
  );

  // Pattern 2
  let pattern2 =
    /[\s\n]+((?:Master|Bachelor|PhD|Doctorate)'?s?)\s+(?:in|of)?\s+([A-Za-z\s&(),-]+?)(?=\s+[A-Z][a-z]*,|\s+(?:University|College|Institute|School|Academy)|\n|$)/i;
  let m2 = afterDateText.match(pattern2);
  console.log(
    `Pattern 2: ${m2 ? "MATCH" : "NO"} ${m2 ? `"${m2[1]}" | "${m2[2]}"` : ""}`
  );

  // Pattern 3
  let pattern3 =
    /[\s\n]+(Master|Bachelor|PhD|Doctorate)'?s?\s+([A-Za-z\s&(),-]+?)(?=\s+[A-Z][a-z]*,|\n|$)/i;
  let m3 = afterDateText.match(pattern3);
  console.log(
    `Pattern 3: ${m3 ? "MATCH" : "NO"} ${m3 ? `"${m3[1]}" | "${m3[2]}"` : ""}`
  );

  // Try simpler pattern
  console.log("\n--- Trying Simpler Patterns ---");

  let simplePattern = /[\s\n]+Master/i;
  let sm = afterDateText.match(simplePattern);
  console.log(`Simple "Master": ${sm ? "MATCH" : "NO"}`);

  let verySimple = /Master|Bachelor/i;
  let vsm = afterDateText.match(verySimple);
  console.log(`Very simple degree keyword: ${vsm ? "MATCH: " + vsm[0] : "NO"}`);
}
