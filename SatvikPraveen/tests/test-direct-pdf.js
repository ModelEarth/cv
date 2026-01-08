const fs = require("fs");

// Read app.js functions
const appCode = fs.readFileSync(
  "/Users/satvikpraveen/Documents/resume-loader/app.js",
  "utf8"
);

// Execute the code to get the functions
eval(appCode);

// Read the PDF
const pdfBuffer = fs.readFileSync(
  "/Users/satvikpraveen/Documents/resume-loader/shanmuga-priya-resume.pdf"
);

// We need pdf-parse to extract text
const pdfParse = require("pdf-parse");

// Extract text from PDF
(async () => {
  try {
    const data = await pdfParse(pdfBuffer);
    const fullText = data.text;

    console.log("\n=== FULL EXTRACTED TEXT ===");
    console.log(fullText.substring(0, 500));
    console.log("...\n");

    // Clean and normalize
    const normalized = cleanAndNormalizeText(fullText);

    console.log("\n=== AFTER NORMALIZATION ===");
    console.log(normalized.substring(0, 500));
    console.log("...\n");

    // Extract sections
    console.log("\n=== EXTRACTING SECTIONS ===\n");
    const sections = identifySections(normalized);

    console.log("\n=== EDUCATION SECTION ===");
    console.log("Length:", sections.education ? sections.education.length : 0);
    console.log("Content:");
    console.log(sections.education);

    console.log("\n=== EXPERIENCE SECTION ===");
    console.log(
      "Length:",
      sections.experience ? sections.experience.length : 0
    );
    console.log("Content:");
    console.log(sections.experience);

    console.log("\n=== PARSING EDUCATION ===\n");
    const education = parseEducation(sections.education || "");
    console.log("\nFinal education entries:", education.length);
    education.forEach((e, i) => {
      console.log(`\n${i + 1}. ${e.institution}`);
      console.log(`   Type: ${e.studyType}`);
      console.log(`   Area: ${e.area}`);
      console.log(`   Dates: ${e.startDate} - ${e.endDate}`);
      console.log(`   Location: ${e.location}`);
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
