function cleanAndNormalizeText(text) {
  if (!text) return "";
  let cleaned = text
    .replace(/[ \t]+/g, " ")
    .replace(/[-–—]/g, "-")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
  return cleaned;
}

function identifySections(text) {
  const sections = {};
  const sectionPatterns = {
    education: /\b(?:E\s*D\s*U\s*C\s*A\s*T\s*I\s*O\s*N|EDUCATION|ACADEMIC)\b/gi,
    experience: /\b(?:E\s*X\s*P\s*E\s*R\s*I\s*E\s*N\s*C\s*E|EXPERIENCE|PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE)\b/gi,
    projects: /\b(?:P\s*R\s*O\s*J\s*E\s*C\s*T\s*S|PROJECTS|PORTFOLIO)\b/gi,
    skills: /\b(?:T\s*E\s*C\s*H\s*N\s*I\s*C\s*A\s*L\s+S\s*K\s*I\s*L\s*L\s*S|TECHNICAL\s+SKILLS|SKILLS)\b/gi,
  };

  const headerMatches = [];
  for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
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

  headerMatches.sort((a, b) => a.index - b.index);
  const uniqueMatches = [];
  const seenSections = new Set();
  for (const match of headerMatches) {
    if (!seenSections.has(match.sectionName)) {
      uniqueMatches.push(match);
      seenSections.add(match.sectionName);
    }
  }

  for (let i = 0; i < uniqueMatches.length; i++) {
    const current = uniqueMatches[i];
    const next = uniqueMatches[i + 1];
    const startIndex = current.index + current.length;
    const endIndex = next ? next.index : text.length;
    let content = text.substring(startIndex, endIndex).trim();
    content = content.replace(/^\s+/, "");
    if (content.length > 0) {
      sections[current.sectionName] = content;
    }
  }
  return sections;
}

// Sample text with spaced letters
const sample = `E D U C A T I O N
DePaul University
Sep. 2023 - June 2025
Master's in Computer Science

E X P E R I E N C E  
Senior Developer
June 2020 - Aug 2023
Description here

T E C H N I C A L S K I L L S
Programming: Java, Python`;

const cleaned = cleanAndNormalizeText(sample);
const sections = identifySections(cleaned);

console.log("=== SECTIONS ===");
for (const [name, content] of Object.entries(sections)) {
  console.log(`\n[${name}] (${content.length} chars)`);
  console.log(content.substring(0, 150));
}
