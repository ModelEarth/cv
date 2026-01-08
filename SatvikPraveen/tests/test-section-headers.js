// Check what sections are actually in the extracted text

// Sample of what PDF.js might extract
const sampleText = `Shanmuga Priya Kannan 872-330-3203 shanmugapriyakannan019@gmail.com https://www.linkedin.com/in/shanmuga-priya-k-95400a194 Computer Science graduate student with 3+ years of experience as a ServiceNow Developer specializing in ITSM, integrations, and workflow automation. Skilled in Java, Python, cloud platforms, and data analytics with hands-on project experience in machine learning and market analysis. EDUCATION DePaul University Sep. 2023 - June 2025 Master's in Computer Science Chicago, USA Velammal Engineering College June. 2016 - April 2020 Bachelor of Technology in Information Technology Chennai, India EXPERIENCE Senior Service-now Developer (Autodesk, Fortive) Cognizant Technology Solutions (Associate) June 2020 - Aug 2023 Chennai, India Senior ServiceNow Developer with 3+ years of ITSM experience, specializing in CMDB and Event Management for clients like Autodesk and Fortive Developed REST APIs and created 30+ custom workflows and catalog items to automate incident, request, and change processes in ServiceNow Integrated third-party tools such as SAP, QlikView, and Azure, improving platform interoperability and automating cross-system data flows Resolved over 600 incidents and service requests by collaborating with clients to understand requirements and deliver tailored solutions Managed development tasks using Jira and contributed to agile delivery cycles through hands-on design, debugging, testing, and deployment of 60+ client-facing features PROJECTS Shopping System | Java, Eclipse Developed user authentication and product catalog features to enhance security and streamline shopping. Outcome: Reduced login issues and browsing delays, improving system usability.. Market Analysis of Google Play Store Apps | Excel, Tableau, R Analyzed app store data to identify trends and provide insights for developers and marketers. Outcome: Identified top-performing app categories, helping guide feature focus and marketing strategies. Real Estate Price Trend Analysis | Excel, R Performed regression and time-series analysis on Connecticut housing data to forecast pricing. Outcome: Improved price prediction accuracy and helped isolate location-based impact on pricing. Lung Cancer Risk Prediction Using ML | Python, Jupyter Notebook, Excel Built and evaluated Naive Bayes, Random Forest, and KNN classifiers on a 220K+ record dataset. Outcome: Boosted high-risk detection by 25% using oversampling and feature selection. NYC Taxi Fare Prediction Pipeline | PySpark, AWS EMR, Athena Built a distributed ML pipeline to process 12M+ trip records and predict fares using Spark MLlib. Outcome: Achieved RMSE of ~10.2; automated visualization and reporting via Matplotlib and S3. TECHNICAL SKILLS Programming Languages: C/C++, Java, Python, R, and SQL Web Development: HTML/CSS, JavaScript, Node.js Tools & Platforms: Git, Docker, AWS (EMR, S3, Athena, SageMaker), GCP, VS Code, Eclipse, JIRA, Step Functions, SNS Data & Analytics: Pandas, NumPy, Matplotlib, Seaborn, Excel, Tableau, Power BI, RStudio, Regression, Exploratory Data Analysis (EDA), Time Series Analysis ML & Big Data: Machine Learning, Spark (PySpark, MLlib), Hadoop, Distributed, Model Evaluation, Algorithms ServiceNow: ITSM, CMDB, Service Catalog, REST APIs, JSON, XML, Flow Design, Integration`;

console.log("=== CHECKING FOR SECTION HEADERS ===\n");

// Check what headers we're looking for
const sectionKeywords = {
  education: ["EDUCATION", "ACADEMIC", "QUALIFICATIONS"],
  experience: ["EXPERIENCE", "PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE"],
  projects: ["PROJECTS", "PORTFOLIO", "KEY PROJECTS"],
  skills: ["TECHNICAL SKILLS", "SKILLS", "COMPETENCIES"],
};

for (const [sectionName, keywords] of Object.entries(sectionKeywords)) {
  console.log(`\n${sectionName.toUpperCase()}:`);
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "g");
    const matches = [];
    let match;
    while ((match = regex.exec(sampleText)) !== null) {
      matches.push({
        keyword: keyword,
        index: match.index,
        found: true,
      });
    }
    if (matches.length > 0) {
      console.log(`  ✓ Found "${keyword}" at position ${matches[0].index}`);
    } else {
      console.log(`  ✗ NOT FOUND: "${keyword}"`);
    }
  }
}

console.log("\n=== ALL CAPS WORDS IN TEXT ===");
const allCapsRegex = /\b([A-Z][A-Z\s]{2,})\b/g;
const capsWords = new Set();
let match;
while ((match = allCapsRegex.exec(sampleText)) !== null) {
  const word = match[1].trim();
  if (word.length > 2) {
    capsWords.add(word);
  }
}
console.log("Found ALL-CAPS words:", Array.from(capsWords).sort());

console.log("\n=== CASE-SENSITIVE TEST ===");
// Test case-sensitive matching
const testWords = [
  "EDUCATION",
  "EXPERIENCE",
  "PROJECTS",
  "TECHNICAL SKILLS",
  "experience",
  "projects",
];
for (const word of testWords) {
  const caseInsensitiveRegex = new RegExp(`\\b${word}\\b`, "gi");
  const caseSensitiveRegex = new RegExp(`\\b${word}\\b`, "g");

  const ciMatch = sampleText.match(caseInsensitiveRegex);
  const csMatch = sampleText.match(caseSensitiveRegex);

  console.log(`"${word}":`);
  console.log(
    `  Case-insensitive (i flag): ${
      ciMatch ? ciMatch.length + " matches" : "NO MATCH"
    }`
  );
  console.log(
    `  Case-sensitive: ${csMatch ? csMatch.length + " matches" : "NO MATCH"}`
  );
}
