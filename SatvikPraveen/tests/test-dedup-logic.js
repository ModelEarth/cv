// Debug the deduplication logic

const headerMatches = [
  { sectionName: "education", keyword: "EDUCATION", index: 411 },
  { sectionName: "experience", keyword: "EXPERIENCE", index: 620 },
  { sectionName: "projects", keyword: "PROJECTS", index: 1042 },
  { sectionName: "skills", keyword: "TECHNICAL SKILLS", index: 1429 },
  { sectionName: "skills", keyword: "SKILLS", index: 1439 },
];

console.log("Original:", headerMatches);

const uniqueMatches = [];
for (let i = 0; i < headerMatches.length; i++) {
  const current = headerMatches[i];
  console.log(`\n[${i}] Checking ${current.keyword} at ${current.index}`);

  let skipCurrent = false;

  if (i + 1 < headerMatches.length) {
    const next = headerMatches[i + 1];
    const distance = Math.abs(current.index - next.index);
    console.log(
      `  Next is ${next.keyword} at ${next.index}, distance=${distance}`
    );

    if (current.sectionName === next.sectionName && distance < 20) {
      console.log(`  Same section and close!`);
      if (current.keyword.length < next.keyword.length) {
        console.log(
          `  Current is shorter (${current.keyword.length} < ${next.keyword.length}), SKIPPING current`
        );
        skipCurrent = true;
      } else {
        console.log(`  Current is longer, keeping current`);
      }
    }
  }

  if (!skipCurrent) {
    console.log(`  ✓ KEEPING`);
    uniqueMatches.push(current);
  } else {
    console.log(`  ✗ SKIPPING`);
  }
}

console.log("\nFinal:", uniqueMatches);
