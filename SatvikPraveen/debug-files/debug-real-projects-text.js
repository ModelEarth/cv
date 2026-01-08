const fs = require("fs");
const pdfParse = require("pdf-parse");

(async () => {
  const pdfPath =
    "/Users/satvikpraveen/Documents/resume-loader/shanmuga-priya-resume.pdf";

  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    let text = data.text;

    // Find PROJECTS section like identifySections does
    const projectsMatch =
      /(?:^|\n)\s*(?:P\s*R\s*O\s*J\s*E\s*C\s*T\s*S|PROJECTS|PORTFOLIO)\s*(?:\n|$)/gi.exec(
        text
      );

    if (!projectsMatch) {
      console.log("❌ No PROJECTS section found");
      return;
    }

    // Find where PROJECTS section ends (next section header)
    const sectionPattern =
      /(?:^|\n)\s*(?:E\s*D\s*U\s*C\s*A\s*T\s*I\s*O\s*N|EDUCATION|ACADEMIC|E\s*X\s*P\s*E\s*R\s*I\s*E\s*N\s*C\s*E|EXPERIENCE|PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE|T\s*E\s*C\s*H\s*N\s*I\s*C\s*A\s*L\s+S\s*K\s*I\s*L\s*L\s*S|TECHNICAL\s+SKILLS|SKILLS|CERTIFICATIONS|LICENSES|LANGUAGES|PROFESSIONAL\s+SUMMARY|SUMMARY)\s*(?:\n|$)/gi;

    let nextSectionMatch = null;
    sectionPattern.lastIndex = projectsMatch.index + projectsMatch[0].length;
    nextSectionMatch = sectionPattern.exec(text);

    const projectsStart = projectsMatch.index + projectsMatch[0].length;
    const projectsEnd = nextSectionMatch ? nextSectionMatch.index : text.length;
    const projectsText = text.substring(projectsStart, projectsEnd).trim();

    console.log("======== PROJECTS SECTION TEXT ========");
    console.log(`Length: ${projectsText.length} chars`);
    console.log("\n--- RAW TEXT (first 500 chars) ---");
    console.log(JSON.stringify(projectsText.substring(0, 500)));
    console.log("\n--- FULL TEXT ---");
    console.log(JSON.stringify(projectsText));

    console.log("\n======== PROJECTS LINES ========");
    const lines = projectsText.split("\n");
    lines.forEach((line, idx) => {
      if (line.trim()) {
        console.log(`Line ${idx}: ${JSON.stringify(line)}`);
      }
    });
  } catch (err) {
    console.error("Error:", err.message);
  }
})();
