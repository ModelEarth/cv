// Test with actual PDF format where everything might be on one line with bullets

const projectText = `Shopping System | Java, Eclipse • Developed user authentication and product catalog features to enhance security and streamline shopping. Outcome: Reduced login issues and browsing delays improving system usability..

Market Analysis of Google Play Store Apps | Excel, Tableau, R • Analyzed app store data to identify trends and provide insights for developers and marketers. Outcome: Identified top - performing app categories helping guide feature focus and marketing strategies.

Real Estate Price Trend Analysis | Excel, R • Performed regression and time - series analysis on Connecticut housing data to forecast pricing. Outcome: Improved price prediction accuracy and helped isolate location - based impact on pricing.

Lung Cancer Risk Prediction Using ML | Python, Jupyter Notebook, Excel • Built and evaluated Naive Bayes, Random Forest, and KNN classifiers on a 220K+ record dataset. Outcome: Boosted high - risk detection by 25% using oversampling and feature selection.

NYC Taxi Fare Prediction Pipeline | PySpark, AWS EMR, Athena • Built a distributed ML pipeline to process 12M+ trip records and predict fares using Spark MLlib. Outcome: Achieved RMSE of ~10.2, automated visualization and reporting via Matplotlib and S3.`;

function parseProjects(text) {
  if (!text) return [];

  const projects = [];

  // Split projects by looking for "Project Name | Tech1, Tech2" pattern
  // followed by bullet points with description

  // First, split by the project pattern: "Capital Words | techs"
  const projectPattern =
    /([A-Z][A-Za-z0-9\s\-&()]+?)\s*\|\s*([^•\n]+?)(?=•|[A-Z][A-Za-z0-9\s\-&()]+?\s*\||$)/g;

  let match;
  const matches = [];

  while ((match = projectPattern.exec(text)) !== null) {
    matches.push({
      name: match[1].trim(),
      techs: match[2].trim(),
      index: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  console.log(`Found ${matches.length} project matches`);
  matches.forEach((m, i) => {
    console.log(
      `Match ${i + 1}: name="${m.name}", techs="${m.techs}", endIndex=${
        m.endIndex
      }`
    );
  });

  // Now extract descriptions between projects
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];

    // Extract technologies (before any bullet point)
    let techText = currentMatch.techs;
    if (techText.includes("•")) {
      techText = techText.substring(0, techText.indexOf("•")).trim();
    }

    const keywords = techText
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !/^•/.test(s) && s !== "•");

    // Extract description: from end of current match to start of next match (or end of text)
    let descStart = currentMatch.endIndex;
    let descEnd = nextMatch ? nextMatch.index : text.length;
    let description = text.substring(descStart, descEnd).trim();

    console.log(`\n[${i + 1}] ${currentMatch.name}`);
    console.log(`  Raw description: "${description.substring(0, 100)}..."`);

    // Clean up description
    description = description
      .replace(/^•\s*/gm, "") // Remove bullet points
      .replace(/\s+/g, " ") // Collapse spaces
      .trim();

    console.log(`  Cleaned: "${description.substring(0, 100)}..."`);

    // Only add if we have a name and either keywords or description
    if (currentMatch.name && (keywords.length > 0 || description.length > 0)) {
      projects.push({
        name: currentMatch.name,
        keywords: keywords,
        summary: description,
      });
    }
  }

  return projects;
}

const result = parseProjects(projectText);
console.log("\n\n=== FINAL RESULT ===");
console.log(JSON.stringify(result, null, 2));
