// Test case-sensitive matching

function cleanAndNormalizeText(text) {
  if (!text) return "";

  let cleaned = text
    .replace(/[ \t]+/g, " ")
    .replace(/[-–—]/g, "-")
    .replace(/\n\s*\n+/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();

  return cleaned;
}

const rawText = `Shanmuga Priya Kannan
872-330-3203 | shanmugapriyakannan019@gmail.com | https://www.linkedin.com/in/shanmuga-priya-k-95400a194
Computer Science graduate student with 3+ years of experience as a ServiceNow Developer specializing in ITSM,
integrations, and workflow automation. Skilled in Java, Python, cloud platforms, and data analytics with hands-on
project experience in machine learning and market analysis.
EDUCATION
DePaul University
Master's in Computer Science
Sep. 2023 - June 2025
Chicago, USA
Velammal Engineering College
Bachelor of Technology in Information Technology
June. 2016 - April 2020
Chennai, India
EXPERIENCE
Senior Service-now Developer (Autodesk, Fortive)
Cognizant Technology Solutions (Associate)
June 2020 - Aug 2023
Chennai, India
• Senior ServiceNow Developer with 3+ years of ITSM experience, specializing in CMDB and Event
Management for clients like Autodesk and Fortive
• Developed REST APIs and created 30+ custom workflows and catalog items to automate incident,
request, and change processes in ServiceNow
• Integrated third-party tools such as SAP, QlikView, and Azure, improving platform interoperability and
automating cross-system data flows
• Resolved over 600 incidents and service requests by collaborating with clients to understand
requirements and deliver tailored solutions
• Managed development tasks using Jira and contributed to agile delivery cycles through hands-on
design, debugging, testing, and deployment of 60+ client-facing features
PROJECTS
Shopping System | Java, Eclipse
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
• Outcome: Achieved RMSE of ~10.2; automated visualization and reporting via Matplotlib and S3.
TECHNICAL SKILLS
Programming Languages: C/C++, Java, Python, R, and SQL
Web Development: HTML/CSS, JavaScript, Node.js
Tools & Platforms: Git, Docker, AWS (EMR, S3, Athena, SageMaker), GCP, VS Code, Eclipse, JIRA, Step Functions, SNS
Data & Analytics: Pandas, NumPy, Matplotlib, Seaborn, Excel, Tableau, Power BI, RStudio, Regression, Exploratory
Data Analysis (EDA), Time Series Analysis
ML & Big Data: Machine Learning, Spark (PySpark, MLlib), Hadoop, Distributed, Model Evaluation, Algorithms
ServiceNow: ITSM, CMDB, Service Catalog, REST APIs, JSON, XML, Flow Design, Integration`;

const cleaned = cleanAndNormalizeText(rawText);

function identifySections(text) {
  const sections = {};

  const sectionKeywords = {
    education: [
      "EDUCATION",
      "ACADEMIC",
      "QUALIFICATIONS",
      "DEGREES",
      "ACADEMIC BACKGROUND",
      "EDUCATIONAL BACKGROUND",
    ],
    experience: [
      "PROFESSIONAL EXPERIENCE",
      "WORK EXPERIENCE",
      "EMPLOYMENT",
      "CAREER",
      "EXPERIENCE",
      "WORK HISTORY",
      "PROFESSIONAL HISTORY",
    ],
    projects: [
      "PROJECTS",
      "PORTFOLIO",
      "KEY PROJECTS",
      "NOTABLE PROJECTS",
      "PERSONAL PROJECTS",
    ],
    skills: [
      "TECHNICAL SKILLS",
      "SKILLS",
      "COMPETENCIES",
      "CORE COMPETENCIES",
      "TECHNICAL COMPETENCIES",
      "KEY SKILLS",
    ],
    summary: [
      "PROFESSIONAL SUMMARY",
      "SUMMARY",
      "OBJECTIVE",
      "PROFILE",
      "OVERVIEW",
      "ABOUT",
    ],
    certifications: [
      "CERTIFICATIONS",
      "LICENSES",
      "CERTIFICATES",
      "PROFESSIONAL CERTIFICATIONS",
    ],
    languages: ["LANGUAGES", "LANGUAGE"],
  };

  const headerMatches = [];

  // CASE-SENSITIVE matching (no 'i' flag)
  for (const [sectionName, keywords] of Object.entries(sectionKeywords)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      let match;

      while ((match = regex.exec(text)) !== null) {
        headerMatches.push({
          sectionName: sectionName,
          keyword: keyword,
          index: match.index,
        });
      }
    }
  }

  headerMatches.sort((a, b) => a.index - b.index);

  console.log("===== HEADER MATCHES (CASE-SENSITIVE) =====");
  headerMatches.forEach((h, i) => {
    console.log(
      `${i}: ${h.sectionName} ("${h.keyword}") at position ${h.index}`
    );
  });

  for (let i = 0; i < headerMatches.length; i++) {
    const currentHeader = headerMatches[i];
    const nextHeader = headerMatches[i + 1];

    let startIndex = currentHeader.index + currentHeader.keyword.length;
    let endIndex = nextHeader ? nextHeader.index : text.length;

    let content = text.substring(startIndex, endIndex).trim();

    if (!sections[currentHeader.sectionName] && content.length > 0) {
      sections[currentHeader.sectionName] = content;
      console.log(
        `\nExtracted ${currentHeader.sectionName}: ${content.substring(
          0,
          80
        )}...`
      );
    }
  }

  return sections;
}

const sections = identifySections(cleaned);

console.log("\n===== FINAL SECTIONS =====");
for (const [name, content] of Object.entries(sections)) {
  console.log(`\n[${name.toUpperCase()}]`);
  console.log(content.substring(0, 200));
  console.log("...");
}
