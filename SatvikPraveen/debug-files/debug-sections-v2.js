// Better approach: Match section headers as UPPERCASE or followed by specific patterns

const simulatedText = `Shanmuga Priya Kannan 872-330-3203 shanmugapriyakannan019@gmail.com https://www.linkedin.com/in/shanmuga-priya-k-95400a194 Computer Science graduate student with 3+ years of experience as a ServiceNow Developer specializing in ITSM, integrations, and workflow automation. Skilled in Java, Python, cloud platforms, and data analytics with hands-on project experience in machine learning and market analysis. EDUCATION DePaul University Sep. 2023 - June 2025 Master's in Computer Science Chicago, USA Velammal Engineering College June. 2016 - April 2020 Bachelor of Technology in Information Technology Chennai, India EXPERIENCE Senior Service-now Developer (Autodesk, Fortive) June 2020 - Aug 2023 Cognizant Technology Solutions (Associate) Chennai, India Senior ServiceNow Developer with 3+ years of ITSM experience, specializing in CMDB and Event Management for clients like Autodesk and Fortive Developed REST APIs and created 30+ custom workflows and catalog items to automate incident, request, and change processes in ServiceNow Integrated third-party tools such as SAP, QlikView, and Azure, improving platform interoperability and automating cross-system data flows Resolved over 600 incidents and service requests by collaborating with clients to understand requirements and deliver tailored solutions Managed development tasks using Jira and contributed to agile delivery cycles through hands-on design, debugging, testing, and deployment of 60+ client-facing features PROJECTS Shopping System | Java, Eclipse Developed user authentication and product catalog features to enhance security and streamline shopping. Outcome: Reduced login issues and browsing delays, improving system usability.. Market Analysis of Google Play Store Apps | Excel, Tableau, R Analyzed app store data to identify trends and provide insights for developers and marketers. Outcome: Identified top-performing app categories, helping guide feature focus and marketing strategies. Real Estate Price Trend Analysis | Excel, R Performed regression and time-series analysis on Connecticut housing data to forecast pricing. Outcome: Improved price prediction accuracy and helped isolate location-based impact on pricing. Lung Cancer Risk Prediction Using ML | Python, Jupyter Notebook, Excel Built and evaluated Naive Bayes, Random Forest, and KNN classifiers on a 220K+ record dataset. Outcome: Boosted high-risk detection by 25% using oversampling and feature selection. NYC Taxi Fare Prediction Pipeline | PySpark, AWS EMR, Athena Built a distributed ML pipeline to process 12M+ trip records and predict fares using Spark MLlib. Outcome: Achieved RMSE of ~10.2; automated visualization and reporting via Matplotlib and S3. TECHNICAL SKILLS Programming Languages: C/C++, Java, Python, R, and SQL Web Development: HTML/CSS, JavaScript, Node.js Tools & Platforms: Git, Docker, AWS (EMR, S3, Athena, SageMaker), GCP, VS Code, Eclipse, JIRA, Step Functions, SNS Data & Analytics: Pandas, NumPy, Matplotlib, Seaborn, Excel, Tableau, Power BI, RStudio, Regression, Exploratory Data Analysis (EDA), Time Series Analysis ML & Big Data: Machine Learning, Spark (PySpark, MLlib), Hadoop, Distributed, Model Evaluation, Algorithms ServiceNow: ITSM, CMDB, Service Catalog, REST APIs, JSON, XML, Flow Design, Integration`;

// BEST APPROACH: Find ALL uppercase headers, split by them, and use ordered processing

function findAllSectionHeaders(text) {
  // Match section headers: ALL CAPS words (and variations like "TECHNICAL SKILLS")
  const headerPattern = /\b([A-Z][A-Z\s]{3,})\b(?=\s|$)/g;
  const headers = [];
  let match;

  while ((match = headerPattern.exec(text)) !== null) {
    const headerText = match[1].trim();
    const startIndex = match.index;
    headers.push({ text: headerText, index: startIndex });
  }

  return headers;
}

console.log("=== FOUND HEADERS ===");
const headers = findAllSectionHeaders(simulatedText);
headers.forEach((h, i) => {
  console.log(`${i}: "${h.text}" at position ${h.index}`);
});

console.log("\n=== EXTRACTING SECTIONS ===");

// Known section headers (in expected order)
const sectionHeaders = [
  "EDUCATION",
  "EXPERIENCE",
  "PROJECTS",
  "TECHNICAL SKILLS",
  "SKILLS",
];

function extractSectionsByHeaders(text, knownHeaders) {
  const sections = {};

  // Find positions of each known header
  const headerPositions = [];
  for (const header of knownHeaders) {
    // Match EXACTLY this header (case insensitive, but as whole words)
    const regex = new RegExp(`\\b${header}\\b`, "gi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      headerPositions.push({
        name: header.toLowerCase().replace(/\s+/g, "_"),
        header: header,
        index: match.index,
      });
    }
  }

  // Sort by position
  headerPositions.sort((a, b) => a.index - b.index);

  console.log("Header positions found:", headerPositions);

  // Extract content between headers
  for (let i = 0; i < headerPositions.length; i++) {
    const currentHeader = headerPositions[i];
    const nextHeader = headerPositions[i + 1];

    let startIndex = currentHeader.index + currentHeader.header.length;
    let endIndex = nextHeader ? nextHeader.index : text.length;

    let content = text.substring(startIndex, endIndex).trim();

    sections[currentHeader.name] = content;
    console.log(`\n${currentHeader.name.toUpperCase()}:`);
    console.log(`  Content length: ${content.length}`);
    console.log(`  Preview: ${content.substring(0, 80)}...`);
  }

  return sections;
}

const sections = extractSectionsByHeaders(simulatedText, sectionHeaders);

console.log("\n\n=== FINAL SECTIONS ===");
for (const [name, content] of Object.entries(sections)) {
  console.log(`\n[${name.toUpperCase()}]`);
  console.log(content);
}
