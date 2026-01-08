// Read test-simple-upload.html to check what it does
const fs = require("fs");

const htmlContent = fs.readFileSync(
  "/Users/satvikpraveen/Documents/resume-loader/test-simple-upload.html",
  "utf8"
);

// Find the JavaScript that extracts and prints the text
const matches = htmlContent.match(/console\.log[^;]+/g);
if (matches) {
  console.log("Found console.log statements:");
  matches.slice(0, 10).forEach((m) => console.log("  " + m));
}

// The test file should call parseResumeText, which uses PDFTextExtractor and then calls parseResumeText from app.js
// The issue is: we need to see what the actual PDF text contains BEFORE section extraction
// So the PDF might have extra whitespace, different newlines, or formattin issues
