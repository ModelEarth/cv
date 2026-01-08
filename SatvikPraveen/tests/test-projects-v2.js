// Better approach: Use a simpler split strategy

const pdfExtractedText = `Shopping System | Java, Eclipse • Developed user authentication and product catalog features to enhance security and streamline shopping. • Outcome: Reduced login issues and browsing delays, improving system usability.. Market Analysis of Google Play Store Apps | Excel, Tableau, R • Analyzed app store data to identify trends and provide insights for developers and marketers. • Outcome: Identified top-performing app categories, helping guide feature focus and marketing strategies. Real Estate Price Trend Analysis | Excel, R • Performed regression and time-series analysis on Connecticut housing data to forecast pricing. • Outcome: Improved price prediction accuracy and helped isolate location-based impact on pricing. Lung Cancer Risk Prediction Using ML | Python, Jupyter Notebook, Excel • Built and evaluated Naive Bayes, Random Forest, and KNN classifiers on a 220K+ record dataset. • Outcome: Boosted high-risk detection by 25% using oversampling and feature selection. NYC Taxi Fare Prediction Pipeline | PySpark, AWS EMR, Athena • Built a distributed ML pipeline to process 12M+ trip records and predict fares using Spark MLlib. • Outcome: Achieved RMSE of ~10.2; automated visualization and reporting via Matplotlib and S3.`;

function parseProjectsSimple(text) {
  if (!text) return [];

  const projects = [];

  // Strategy: Find all patterns like "Project Name | Technology1, Technology2"
  // These are project titles that appear before descriptions with bullets

  // Split by looking for project title patterns
  // A project title is: [Capitalized words] | [comma-separated tech]
  const projectTitleRegex =
    /([A-Z][A-Za-z0-9\s]+(?:[A-Z][A-Za-z0-9\s]+)*)\s*\|\s*([^•]+?)(?=•|(?:[A-Z][A-Za-z0-9\s]+(?:[A-Z][A-Za-z0-9\s]+)*\s*\|)|$)/g;

  let match;
  const matches = [];

  while ((match = projectTitleRegex.exec(text)) !== null) {
    matches.push({
      title: match[1].trim(),
      tech: match[2].trim(),
      index: match.index,
      length: match[0].length,
    });
  }

  console.log("Found matches:", matches);

  // Now extract descriptions between projects
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];

    // Description starts right after the current match
    let descStart = currentMatch.index + currentMatch.length;
    // Description ends at the start of next project or end of text
    let descEnd = nextMatch ? nextMatch.index : text.length;

    let description = text.substring(descStart, descEnd).trim();

    // Clean up description: remove leading bullet, collapse multiple spaces
    description = description
      .replace(/^•\s*/gm, "") // Remove bullets
      .replace(/\s+/g, " ") // Collapse spaces
      .trim();

    projects.push({
      name: currentMatch.title,
      keywords: currentMatch.tech
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      summary: description,
    });
  }

  return projects;
}

console.log("\n===== PARSED PROJECTS (SIMPLE METHOD) =====");
const parsed = parseProjectsSimple(pdfExtractedText);
console.log(JSON.stringify(parsed, null, 2));
