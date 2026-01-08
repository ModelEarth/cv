// Extract and copy the key functions from app.js manually for testing
function cleanAndNormalizeText(text) {
  if (!text) return "";

  let cleaned = text
    // Replace multiple spaces/tabs with single space
    .replace(/[ \t]+/g, " ")
    // Normalize common dash characters
    .replace(/[-–—]/g, "-")
    // Clean up EXCESSIVE newlines (3+ becomes 2) but preserve structure-defining blank lines
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    // Remove spaces before common punctuation
    .replace(/\s+([.,;:])/g, "$1")
    .trim();

  return cleaned;
}

function identifySections(text) {
  const sections = {};

  // Section patterns with flexibility for spaced letters (E DUCATION, E XPERIENCE, etc.)
  // Using array to control order - check TECHNICAL SKILLS before SKILLS to avoid partial matches
  const sectionPatterns = [
    {
      sectionName: "education",
      pattern:
        /(?:^|\n)\s*(?:E\s*D\s*U\s*C\s*A\s*T\s*I\s*O\s*N|EDUCATION|ACADEMIC)\s*(?:\n|$)/gi,
    },
    {
      sectionName: "experience",
      pattern:
        /(?:^|\n)\s*(?:E\s*X\s*P\s*E\s*R\s*I\s*E\s*N\s*C\s*E|EXPERIENCE|PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE)\s*(?:\n|$)/gi,
    },
    {
      sectionName: "projects",
      pattern:
        /(?:^|\n)\s*(?:P\s*R\s*O\s*J\s*E\s*C\s*T\s*S|PROJECTS|PORTFOLIO)\s*(?:\n|$)/gi,
    },
    {
      sectionName: "skills",
      pattern:
        /(?:^|\n)\s*(?:T\s*E\s*C\s*H\s*N\s*I\s*C\s*A\s*L\s+S\s*K\s*I\s*L\s*L\s*S|TECHNICAL\s+SKILLS|SKILLS)\s*(?:\n|$)/gi,
    },
    {
      sectionName: "summary",
      pattern: /(?:^|\n)\s*(?:PROFESSIONAL\s+SUMMARY|SUMMARY)\s*(?:\n|$)/gi,
    },
    {
      sectionName: "certifications",
      pattern: /(?:^|\n)\s*(?:CERTIFICATIONS|LICENSES)\s*(?:\n|$)/gi,
    },
    { sectionName: "languages", pattern: /(?:^|\n)\s*LANGUAGES\s*(?:\n|$)/gi },
  ];

  const headerMatches = [];

  // Find all section headers
  for (const { sectionName, pattern } of sectionPatterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      headerMatches.push({
        sectionName: sectionName,
        headerText: match[0],
        index: match.index,
        length: match[0].length,
      });
    }
  }

  // Sort by position in text
  headerMatches.sort((a, b) => a.index - b.index);

  // Remove duplicates AND remove LANGUAGES if SKILLS exists (likely same section with spaced text)
  const uniqueMatches = [];
  const seenSections = new Set();

  for (const match of headerMatches) {
    // Skip LANGUAGES if we already have SKILLS - they're often in the same section in this resume
    if (match.sectionName === "languages" && seenSections.has("skills")) {
      continue;
    }

    if (!seenSections.has(match.sectionName)) {
      uniqueMatches.push(match);
      seenSections.add(match.sectionName);
    }
  }

  console.log(
    "Headers found:",
    uniqueMatches.map((h) => `${h.sectionName}@${h.index}`)
  );

  // Log the index positions to help debug section boundaries
  for (let i = 0; i < uniqueMatches.length; i++) {
    const current = uniqueMatches[i];
    const next = uniqueMatches[i + 1];
    const startIdx = current.index + current.length;
    const endIdx = next ? next.index : text.length;
    const headerText = text
      .substring(current.index, Math.min(current.index + 30, text.length))
      .replace(/\n/g, " ");
    console.log(
      `[Section: ${current.sectionName}] Header: "${headerText}..." at index ${current.index}`
    );
    console.log(
      `  Content from ${startIdx} to ${endIdx} (${endIdx - startIdx} chars)`
    );
  }

  // Extract content between section headers
  for (let i = 0; i < uniqueMatches.length; i++) {
    const current = uniqueMatches[i];
    const next = uniqueMatches[i + 1];

    // Start after the header
    let startIndex = current.index + current.length;

    // For EXPERIENCE section, look back to capture job title/company if it's on same line or right before the date
    // This handles cases where the job info is between the header and next section
    if (current.sectionName === "experience" && next) {
      // Look ahead to find if there's a line with a date pattern right after the header
      const sectionPreview = text.substring(
        startIndex,
        Math.min(startIndex + 500, text.length)
      );
      // If the section starts with description text (not a job title), search backwards from next header
      if (
        !/^\s*[A-Z][A-Za-z\s&(),-]+\s*([-–—]|[0-9]+|$)/.test(sectionPreview)
      ) {
        // No immediate job title found, look in content before next section for job entries
        // Include more context from before the next section
        startIndex = current.index + current.length;
      }
    }

    // End at the next header (or end of text)
    const endIndex = next ? next.index : text.length;

    let content = text.substring(startIndex, endIndex).trim();

    // Remove leading newlines/spaces
    content = content.replace(/^\s+/, "");

    if (content.length > 0) {
      sections[current.sectionName] = content;
      console.log(`✓ ${current.sectionName}: ${content.substring(0, 80)}...`);
    }
  }

  console.log("Sections extracted:", Object.keys(sections));
  return sections;
}

// Mock resume text similar to what should be extracted
const mockText = `EDUCATION

DePaul University Sep. 2023 - June 2025 Master's in Computer Science Chicago, USA

Velammal Engineering College June. 2016 - April 2020 Bachelor of Technology in Information Technology Chennai, India

EXPERIENCE

Senior Service-now Developer (Autodesk, Fortive) June 2020 - Aug 2023
Cognizant Technology Solutions (Associate) Chennai, India

PROJECTS`;

console.log("Mock resume text:");
console.log(mockText);
console.log("\n" + "=".repeat(80) + "\n");

// Clean and identify sections
const cleaned = cleanAndNormalizeText(mockText);
console.log("After normalization:");
console.log(cleaned);
console.log("\n" + "=".repeat(80) + "\n");

const sections = identifySections(cleaned);
console.log("\nExtracted sections:");
Object.entries(sections).forEach(([name, content]) => {
  console.log(`\n${name.toUpperCase()} (${content.length} chars):`);
  console.log(`"${content}"`);
  console.log();
});
