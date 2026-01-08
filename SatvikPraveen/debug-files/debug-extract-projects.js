// Debug: Extract and display the PROJECTS section from the PDF
const fs = require("fs");

// Read the resume JSON that was extracted
const resumeJsonPath =
  "/Users/satvikpraveen/Documents/resume-loader/extracted-resume.json";

if (fs.existsSync(resumeJsonPath)) {
  const resumeData = JSON.parse(fs.readFileSync(resumeJsonPath, "utf8"));
  console.log("Resume data found. Projects:", resumeData.projects.length);
  console.log(JSON.stringify(resumeData, null, 2));
} else {
  console.log(
    "No extracted-resume.json found. You need to upload the PDF through the web interface first."
  );
}
