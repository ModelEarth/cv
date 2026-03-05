// Fixed deduplication logic

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

  // Check if previous match is same section and very close
  if (i > 0) {
    const prev = headerMatches[i - 1];
    const distance = Math.abs(current.index - prev.index);
    console.log(
      `  Previous is ${prev.keyword} at ${prev.index}, distance=${distance}`
    );

    if (current.sectionName === prev.sectionName && distance < 20) {
      console.log(
        `  Same section and close! Current keyword length=${current.keyword.length}, prev=${prev.keyword.length}`
      );
      if (current.keyword.length < prev.keyword.length) {
        console.log(`  Current is shorter, SKIPPING current`);
        skipCurrent = true;
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
