/**
 * ENHANCED APP WITH PRECISE PDF EXTRACTION
 *
 * Uses the improved EnhancedPdfProcessor with:
 * - JSON Resume schema compliance
 * - Precise field extraction (basics, work, education, skills, projects, etc.)
 * - Better context-aware parsing
 * - Profile extraction (LinkedIn, GitHub, etc.)
 * - Skill level inference
 * - Technology detection
 * - Reference extraction
 */

// ==================== STATE MANAGEMENT ====================
let STATE = {
  pdfFile: null,
  pdfArrayBuffer: null,
  rawText: "",
  resumeData: null,
  currentTemplate: null,
  processor: null,
};

// Demo sample data matching JSON Resume schema
const SAMPLE_DATA = {
  basics: {
    name: "Shanmuga Priya Kannan",
    label: "Senior ServiceNow Developer",
    image: "",
    email: "shanmugapriyakannan019@gmail.com",
    phone: "",
    url: "https://linkedin.com/in/shanmuga",
    summary:
      "ServiceNow Developer specializing in ITSM, integrations, and workflow automation. Skilled in Java, Python, cloud platforms, and data analytics with hands-on project experience in machine learning and market analysis.",
    location: {
      address: "",
      postalCode: "",
      city: "Chicago",
      countryCode: "",
      region: "USA",
    },
    profiles: [
      {
        network: "LinkedIn",
        username: "shanmuga",
        url: "https://linkedin.com/in/shanmuga",
      },
      {
        network: "GitHub",
        username: "shan-789",
        url: "https://github.com/shan-789",
      },
    ],
  },
  work: [
    {
      name: "Cognizant Technology Solutions",
      position: "Senior ServiceNow Developer",
      startDate: "2020-06",
      endDate: "2023-08",
      summary:
        "Worked on ITSM, CMDB, and Event Management for clients like Autodesk and Fortive.",
      highlights: [
        "Developed REST APIs and 30+ custom workflows",
        "Automated incidents, requests, and changes",
        "Integrated third-party tools including SAP, QlikView, and Azure",
      ],
      url: "",
      isWork: true,
    },
  ],
  education: [
    {
      institution: "DePaul University",
      studyType: "Master's",
      area: "Computer Science",
      startDate: "2023-09",
      endDate: "2025-06",
      score: "",
      courses: [],
    },
    {
      institution: "Velammal Engineering College",
      studyType: "Bachelor of Technology",
      area: "Information Technology",
      startDate: "2016-06",
      endDate: "2020-04",
      score: "",
      courses: [],
    },
  ],
  skills: [
    {
      name: "ServiceNow",
      level: "Expert",
      keywords: ["ITSM", "CMDB", "REST APIs"],
    },
    { name: "Java", level: "Advanced", keywords: ["Backend", "OOP"] },
    {
      name: "Python",
      level: "Advanced",
      keywords: ["Data Analysis", "Scripting"],
    },
    {
      name: "Cloud Platforms",
      level: "Advanced",
      keywords: ["AWS", "GCP", "Azure"],
    },
  ],
  projects: [
    {
      name: "NYC Taxi Fare Prediction Pipeline",
      description:
        "Built a distributed ML pipeline for 12M+ trip records using Spark MLlib",
      highlights: ["PySpark", "AWS EMR", "Athena"],
      keywords: ["PySpark", "AWS EMR", "Athena"],
      startDate: "",
      endDate: "",
      url: "",
      roles: ["Data Engineer"],
      entity: "",
      type: "application",
    },
  ],
  languages: [
    { language: "English", fluency: "Professional" },
    { language: "Tamil", fluency: "Native" },
  ],
  certifications: [
    { name: "ServiceNow CSA", issuer: "ServiceNow", date: "", url: "" },
    { name: "ServiceNow CAD", issuer: "ServiceNow", date: "", url: "" },
  ],
  references: [],
};

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", async function () {
  // Initialize the processor
  await initializeProcessor();
  initializeEventListeners();
  renderSamplePreview();
});

async function initializeProcessor() {
  try {
    if (window.EnhancedPdfProcessor) {
      STATE.processor = new EnhancedPdfProcessor();
      await STATE.processor.initialize();
      console.log("✅ EnhancedPdfProcessor initialized successfully");
    } else {
      console.warn(
        "⚠️ EnhancedPdfProcessor not available - using fallback extraction"
      );
    }
  } catch (error) {
    console.error("❌ Failed to initialize processor:", error);
  }
}

function initializeEventListeners() {
  // File upload
  const pdfInput = document.getElementById("pdfInput");
  const uploadBox = document.getElementById("uploadBox");
  const parseBtn = document.getElementById("parseBtn");
  const removeFile = document.getElementById("removeFile");

  if (pdfInput) pdfInput.addEventListener("change", handleFileSelect);
  if (parseBtn) parseBtn.addEventListener("click", handleParsePDF);
  if (removeFile) removeFile.addEventListener("click", handleRemoveFile);

  // Drag and drop
  if (uploadBox) {
    uploadBox.addEventListener("dragover", handleDragOver);
    uploadBox.addEventListener("dragleave", handleDragLeave);
    uploadBox.addEventListener("drop", handleDrop);
  }

  // Tabs
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", handleTabSwitch);
  });

  // Template cards
  const templateCards = document.querySelectorAll(".template-card");
  templateCards.forEach((card) => {
    card.addEventListener("click", handleTemplateSelect);
  });

  // Export buttons
  if (document.getElementById("exportBtn")) {
    document
      .getElementById("exportBtn")
      .addEventListener("click", handleExport);
  }
  if (document.getElementById("downloadJsonBtn")) {
    document
      .getElementById("downloadJsonBtn")
      .addEventListener("click", handleDownloadJSON);
  }
  if (document.getElementById("printBtn")) {
    document.getElementById("printBtn").addEventListener("click", handlePrint);
  }
}

// Show a sample preview on page load
function renderSamplePreview() {
  const defaultTemplate = "classic";
  STATE.currentTemplate = defaultTemplate;

  const defaultCard = document.querySelector(
    `.template-card[data-template="${defaultTemplate}"]`
  );
  if (defaultCard) defaultCard.classList.add("active");

  renderCurrentTemplate();
}

// ==================== FILE HANDLING ====================
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.includes("pdf")) {
    alert("Please upload a PDF file.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    alert("File size exceeds 10MB. Please upload a smaller file.");
    return;
  }

  STATE.pdfFile = file;

  const reader = new FileReader();
  reader.onload = function (event) {
    STATE.pdfArrayBuffer = event.target.result;
    showFileInfo(file.name);
    document.getElementById("parseBtn").disabled = false;
  };
  reader.readAsArrayBuffer(file);
}

function handleRemoveFile() {
  STATE = {
    pdfFile: null,
    pdfArrayBuffer: null,
    rawText: "",
    resumeData: null,
    currentTemplate: null,
    processor: STATE.processor,
  };

  document.getElementById("pdfInput").value = "";
  const fileInfo = document.getElementById("fileInfo");
  if (fileInfo) fileInfo.classList.add("is-hidden");
  document.getElementById("parseBtn").disabled = true;
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add("drag-over");
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const input = document.getElementById("pdfInput");
    input.files = files;
    const event = new Event("change", { bubbles: true });
    input.dispatchEvent(event);
  }
}

function showFileInfo(fileName) {
  const fileInfo = document.getElementById("fileInfo");
  if (fileInfo) {
    fileInfo.classList.remove("is-hidden");
    const fileNameSpan = fileInfo.querySelector(".file-name");
    if (fileNameSpan) fileNameSpan.textContent = fileName;
  }
}

// ==================== PDF PARSING - ENHANCED ====================
async function handleParsePDF() {
  if (!STATE.pdfArrayBuffer) {
    alert("Please select a PDF file first.");
    return;
  }

  showLoading(true);
  console.log("📄 Starting PDF extraction with EnhancedPdfProcessor...");

  try {
    if (STATE.processor) {
      // Use the enhanced processor with JSON Resume schema
      STATE.resumeData = await STATE.processor.parseResume(
        STATE.pdfArrayBuffer
      );
      console.log("✅ Extraction complete:", STATE.resumeData);
    } else {
      // Fallback to basic extraction
      console.warn("⚠️ Using fallback extraction method");
      const text = await extractPdfTextFallback(STATE.pdfArrayBuffer);
      STATE.rawText = text;
      STATE.resumeData = parseResumeTextFallback(text);
    }

    updateDataSection();
    enableTemplates();
    showLoading(false);

    // Auto-select first template
    const classicCard = document.querySelector(
      '.template-card[data-template="classic"]'
    );
    if (classicCard) classicCard.click();
  } catch (error) {
    console.error("❌ Error parsing PDF:", error);
    alert("Failed to parse PDF. Please try another file.");
    showLoading(false);
  }
}

// Fallback text extraction (uses basic pdf.js)
async function extractPdfTextFallback(arrayBuffer) {
  try {
    if (!window.pdfjsLib) {
      throw new Error("PDF.js not available");
    }

    const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      text += pageText + "\n";
    }

    return text;
  } catch (error) {
    console.error("Fallback extraction failed:", error);
    throw error;
  }
}

function showLoading(show) {
  const loading = document.getElementById("loadingIndicator");
  const parseBtn = document.getElementById("parseBtn");

  if (show) {
    if (loading) loading.classList.remove("is-hidden");
    if (parseBtn) parseBtn.disabled = true;
  } else {
    if (loading) loading.classList.add("is-hidden");
    if (parseBtn) parseBtn.disabled = false;
  }
}

// ==================== FALLBACK TEXT PARSING ====================
function parseResumeTextFallback(text) {
  // This is a basic fallback - the enhanced processor is much better
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const name = lines[0] || "Resume";
  const email = extractEmailFallback(text);
  const phone = extractPhoneFallback(text);

  return {
    basics: {
      name: name,
      label: lines[1] || "Professional",
      email: email,
      phone: phone,
      url: "",
      summary: "",
      location: { city: "", region: "" },
      profiles: [],
    },
    work: [],
    education: [],
    skills: [],
    projects: [],
    languages: [],
    certifications: [],
    references: [],
  };
}

function extractEmailFallback(text) {
  const match = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9_-]+)/);
  return match ? match[1] : "";
}

function extractPhoneFallback(text) {
  const match = text.match(
    /(\+?1?\s*[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/
  );
  return match ? match[1] : "";
}

// ==================== UI UPDATES ====================
function updateDataSection() {
  const dataDisplay = document.getElementById("dataDisplay");
  if (!dataDisplay) return;

  if (STATE.resumeData) {
    dataDisplay.innerHTML = `<pre>${JSON.stringify(
      STATE.resumeData,
      null,
      2
    )}</pre>`;
  }
}

function enableTemplates() {
  const templateCards = document.querySelectorAll(".template-card");
  templateCards.forEach((card) => {
    card.classList.remove("disabled");
  });
}

function renderCurrentTemplate() {
  const iframePreview = document.getElementById("themePreview");
  if (!iframePreview) return;

  const data = STATE.resumeData || SAMPLE_DATA;
  const template = STATE.currentTemplate || "classic";

  // Build the resume HTML
  const html = generateResumeHTML(data, template);

  // Display in iframe
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  iframePreview.src = url;
}

function generateResumeHTML(data, template) {
  // Basic HTML template - in production, use proper theme templates
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.basics.name} - Resume</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 8.5in; margin: 0 auto; padding: 20px; }
        h1 { margin: 0; font-size: 28px; }
        h2 { margin-top: 20px; font-size: 16px; border-bottom: 2px solid #333; padding-bottom: 5px; }
        .contact { color: #666; font-size: 12px; margin-bottom: 10px; }
        .section { margin-bottom: 15px; }
        .entry { margin-bottom: 10px; }
        .entry-title { font-weight: bold; }
        .entry-meta { color: #666; font-size: 12px; }
        ul { margin: 5px 0; padding-left: 20px; }
      </style>
    </head>
    <body>
      <h1>${data.basics.name}</h1>
      <div class="contact">
        ${data.basics.label ? `<strong>${data.basics.label}</strong> | ` : ""}
        ${data.basics.email ? `${data.basics.email} | ` : ""}
        ${data.basics.phone ? `${data.basics.phone}` : ""}
      </div>

      ${
        data.basics.summary
          ? `
        <div class="section">
          <h2>Professional Summary</h2>
          <p>${data.basics.summary}</p>
        </div>
      `
          : ""
      }

      ${
        data.work && data.work.length > 0
          ? `
        <div class="section">
          <h2>Experience</h2>
          ${data.work
            .map(
              (job) => `
            <div class="entry">
              <div class="entry-title">${job.position}</div>
              <div class="entry-meta">${job.name} | ${job.startDate} - ${
                job.endDate
              }</div>
              <p>${job.summary || ""}</p>
              ${
                job.highlights && job.highlights.length > 0
                  ? `
                <ul>
                  ${job.highlights.map((h) => `<li>${h}</li>`).join("")}
                </ul>
              `
                  : ""
              }
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }

      ${
        data.education && data.education.length > 0
          ? `
        <div class="section">
          <h2>Education</h2>
          ${data.education
            .map(
              (edu) => `
            <div class="entry">
              <div class="entry-title">${edu.studyType} in ${edu.area}</div>
              <div class="entry-meta">${edu.institution} (${edu.startDate} - ${edu.endDate})</div>
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }

      ${
        data.skills && data.skills.length > 0
          ? `
        <div class="section">
          <h2>Skills</h2>
          <ul>
            ${data.skills
              .map(
                (skill) =>
                  `<li><strong>${skill.name}</strong> (${
                    skill.level || "Intermediate"
                  })</li>`
              )
              .join("")}
          </ul>
        </div>
      `
          : ""
      }

      ${
        data.languages && data.languages.length > 0
          ? `
        <div class="section">
          <h2>Languages</h2>
          <ul>
            ${data.languages
              .map((lang) => `<li>${lang.language} - ${lang.fluency}</li>`)
              .join("")}
          </ul>
        </div>
      `
          : ""
      }

      ${
        data.certifications && data.certifications.length > 0
          ? `
        <div class="section">
          <h2>Certifications</h2>
          <ul>
            ${data.certifications
              .map((cert) => `<li>${cert.name} - ${cert.issuer}</li>`)
              .join("")}
          </ul>
        </div>
      `
          : ""
      }
    </body>
    </html>
  `;
}

// ==================== TEMPLATE HANDLING ====================
function handleTemplateSelect(e) {
  const card = e.currentTarget;
  const template = card.getAttribute("data-template");

  document.querySelectorAll(".template-card").forEach((c) => {
    c.classList.remove("active");
  });
  card.classList.add("active");

  STATE.currentTemplate = template;
  renderCurrentTemplate();
}

// ==================== TAB SWITCHING ====================
function handleTabSwitch(e) {
  const btn = e.currentTarget;
  const tabId = btn.getAttribute("data-tab");

  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.remove("active");
  });
  btn.classList.add("active");

  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.add("is-hidden");
  });

  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.remove("is-hidden");
}

// ==================== EXPORT FUNCTIONS ====================
function handleExport() {
  if (!STATE.resumeData) {
    alert("Please parse a PDF first.");
    return;
  }

  const html = generateResumeHTML(STATE.resumeData, STATE.currentTemplate);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resume-${STATE.resumeData.basics.name}.html`;
  a.click();
}

function handleDownloadJSON() {
  if (!STATE.resumeData) {
    alert("Please parse a PDF first.");
    return;
  }

  const json = JSON.stringify(STATE.resumeData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resume-${STATE.resumeData.basics.name}.json`;
  a.click();
}

function handlePrint() {
  const iframePreview = document.getElementById("themePreview");
  if (iframePreview) {
    iframePreview.contentWindow.print();
  }
}

console.log(
  "✅ Enhanced extraction app loaded. Waiting for EnhancedPdfProcessor..."
);
