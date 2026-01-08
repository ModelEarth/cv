// Full parsing test using functions from app.js

const fs = require("fs");
const appCode = fs.readFileSync("./app.js", "utf-8");

// Extract and eval just the parsing functions
const functionsMatch = appCode.match(
  /(function cleanAndNormalizeText[\s\S]*?)(?=function \w|$)/
);

// Sample resume
const sampleResume = `Shanmuga Priya Kannan
872 - 330 - 3203 | shanmugapriyakannan019@gmail.com | https://www.linkedin.com/in/shanmuga-priya-k-95400a194

B.Tech Computer Science
Chicago, US

EDUCATION
DePaul University
Chicago, Illinois
Bachelor of Science in Computer Science
May 2016

Velammal Engineering College
Chennai, India
Bachelor of Technology in Information Technology
June 2013

PROFESSIONAL EXPERIENCE
Senior ServiceNow Developer
ServiceNow Consulting Services, Inc.
May 2022 - Present
• Designed and implemented advanced incident management and change management workflows
• Developed custom CMDB applications for enterprise resource planning
• Led discovery tool configuration for infrastructure inventory management

ServiceNow Developer
TechCorp Solutions
June 2018 - Apr 2022
• Built and configured IT service management solutions
• Customized workflows using JavaScript and Workflow Editor

PROJECTS
Shopping System | Java, MySQL, Spring Framework
E-commerce platform with product catalog and inventory management system

Real Estate Application | React.js, Node.js, MongoDB
Full-stack application for property management and listing services

TECHNICAL SKILLS
Programming Languages: C/C++, Java, Python, R, and SQL
Web Development: HTML/CSS, JavaScript, Node.js
Tools & Platforms: Git, Docker, AWS (EMR, S3, Athena, SageMaker), GCP, VS Code, Eclipse, JIRA, Step Functions, SNS
Data & Analytics: Pandas, NumPy, Matplotlib, Seaborn, Excel, Tableau, Power BI, RStudio, Regression, Exploratory
ML & Big Data: Machine Learning, Spark (PySpark, MLlib), Hadoop, Distributed, Model Evaluation, Algorithms
ServiceNow: ITSM, CMDB, Service Catalog, REST APIs, JSON, XML, Flow Design, Integration
`;

// Extract functions section
const initIndex = appCode.indexOf("// ==================== INITIALIZATION");
const functionCode = appCode.substring(0, initIndex);

// Load actual functions from app.js
eval(functionCode);

// Test parsing
console.log("=== FULL PARSING TEST ===\n");

const cleanedText = cleanAndNormalizeText(sampleResume);
const sections = identifySections(cleanedText);

console.log("Sections found:", Object.keys(sections));
console.log();

const work = parseWorkExperience(sections.experience || "");
console.log("Work Experience:");
console.log(JSON.stringify(work, null, 2));
console.log();

const education = parseEducation(sections.education || "");
console.log("Education:");
console.log(JSON.stringify(education, null, 2));
console.log();

const skills = parseSkills(sections.skills || "");
console.log("Skills:");
console.log(JSON.stringify(skills, null, 2));
console.log();

const projects = parseProjects(sections.projects || "");
console.log("Projects:");
console.log(JSON.stringify(projects, null, 2));
