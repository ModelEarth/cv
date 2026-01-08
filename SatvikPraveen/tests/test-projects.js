// Debug: What does the projects section actually contain?

const rawProjectsText = `Shopping System | Java, Eclipse
• Developed user authentication and product catalog features to enhance security and streamline shopping.
• Outcome: Reduced login issues and browsing delays, improving system usability..
Market Analysis of Google Play Store Apps | Excel, Tableau, R
• Analyzed app store data to identify trends and provide insights for developers and marketers.
• Outcome: Identified top-performing app categories, helping guide feature focus and marketing strategies.
Real Estate Price Trend Analysis | Excel, R
• Performed regression and time-series analysis on Connecticut housing data to forecast pricing.
• Outcome: Improved price prediction accuracy and helped isolate location-based impact on pricing.
Lung Cancer Risk Prediction Using ML | Python, Jupyter Notebook, Excel
• Built and evaluated Naive Bayes, Random Forest, and KNN classifiers on a 220K+ record dataset.
• Outcome: Boosted high-risk detection by 25% using oversampling and feature selection.
NYC Taxi Fare Prediction Pipeline | PySpark, AWS EMR, Athena
• Built a distributed ML pipeline to process 12M+ trip records and predict fares using Spark MLlib.
• Outcome: Achieved RMSE of ~10.2; automated visualization and reporting via Matplotlib and S3.`;

// What it probably looks like after PDF.js extracts it (no newlines)
const pdfExtractedText = `Shopping System | Java, Eclipse • Developed user authentication and product catalog features to enhance security and streamline shopping. • Outcome: Reduced login issues and browsing delays, improving system usability.. Market Analysis of Google Play Store Apps | Excel, Tableau, R • Analyzed app store data to identify trends and provide insights for developers and marketers. • Outcome: Identified top-performing app categories, helping guide feature focus and marketing strategies. Real Estate Price Trend Analysis | Excel, R • Performed regression and time-series analysis on Connecticut housing data to forecast pricing. • Outcome: Improved price prediction accuracy and helped isolate location-based impact on pricing. Lung Cancer Risk Prediction Using ML | Python, Jupyter Notebook, Excel • Built and evaluated Naive Bayes, Random Forest, and KNN classifiers on a 220K+ record dataset. • Outcome: Boosted high-risk detection by 25% using oversampling and feature selection. NYC Taxi Fare Prediction Pipeline | PySpark, AWS EMR, Athena • Built a distributed ML pipeline to process 12M+ trip records and predict fares using Spark MLlib. • Outcome: Achieved RMSE of ~10.2; automated visualization and reporting via Matplotlib and S3.`;

console.log("===== PROPER FORMAT (WITH NEWLINES) =====");
console.log(rawProjectsText);

console.log("\n\n===== PDF EXTRACTED FORMAT (NO NEWLINES) =====");
console.log(pdfExtractedText);

// NEW APPROACH: Split by project title pattern
// Project titles have format: "Name | Technologies"
// and are followed by bullet points

function parseProjectsBetter(text) {
  if (!text) return [];

  const projects = [];

  // Pattern: Project Title | Technologies
  // Followed by description lines starting with •
  // Until the next project title (which has a |) or end of text

  // Split by the pipe character to find project starts
  // Each project starts with a title that has a pipe

  // Better approach: Find all "Title | Tech" patterns
  const projectTitlePattern =
    /([^•\n]+?)\s*\|\s*([^•\n]+?)(?=(?:[A-Z][a-z]+ [A-Z][a-z]+.*\|)|•|$)/g;

  let match;
  while ((match = projectTitlePattern.exec(text)) !== null) {
    const titlePart = match[1].trim();
    const techPart = match[2].trim();

    // Find the description that follows this project
    const projectStartIndex = match.index;
    const nextProjectMatch = text
      .substring(projectStartIndex + match[0].length)
      .match(/([A-Z][a-z]+ [A-Z][a-z]+.*?\|)/);
    let projectEndIndex = nextProjectMatch
      ? projectStartIndex + match[0].length + nextProjectMatch.index
      : text.length;

    const projectBlock = text.substring(projectStartIndex, projectEndIndex);
    const description = projectBlock
      .replace(match[0], "") // Remove the title line
      .split("•")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .join(" ");

    projects.push({
      name: titlePart,
      keywords: techPart.split(/[,;]/).map((s) => s.trim()),
      summary: description,
    });
  }

  return projects;
}

console.log("\n\n===== PARSED PROJECTS (NEW METHOD) =====");
const parsed = parseProjectsBetter(pdfExtractedText);
console.log(JSON.stringify(parsed, null, 2));
