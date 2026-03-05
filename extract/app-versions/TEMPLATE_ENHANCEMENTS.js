// This file contains the enhanced template definitions for the remaining 7 templates
// These will replace the existing minimal, colorful, ats, academic, corporate, classic templates

// Minimal (Zen) - Lines 2070-2243
const MINIMAL_ZEN = `  minimal: {
    name: "Minimal (Zen)",
    render: (data) => {
      const formatDate = (start, end) => {
        if (!end)
          return start
            ? new Date(start).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "";
        return \`\${new Date(start).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })} - \${new Date(end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })}\`;
      };

      const html = \`
        <div class="resume-content zen-minimal">
          <header class="zen-header">
            <h1>\${data.basics?.name || "Your Name"}</h1>
            <p class="zen-title">\${data.basics?.label || "Professional"}</p>
            \${data.basics?.summary ? \`<p class="zen-intro">\${data.basics.summary}</p>\` : ""}
          </header>

          <div class="zen-contact">
            \${data.basics?.email ? \`<span>\${data.basics.email}</span>\` : ""}
            \${data.basics?.phone ? \`<span>\${data.basics.phone}</span>\` : ""}
            \${data.basics?.location ? \`<span>\${data.basics.location}</span>\` : ""}
          </div>

          \${
            data.work && data.work.length
              ? \`
            <section class="zen-section">
              <h2>Experience</h2>
              \${data.work
                .map(
                  (job, idx) => \`
                <div class="zen-entry">
                  <div class="zen-entry-header">
                    <h3>\${job.position || "Position"}</h3>
                    <span>\${formatDate(job.startDate, job.endDate)}</span>
                  </div>
                  <p class="zen-company">\${job.name || "Company"}</p>
                  \${job.summary ? \`<p class="zen-text">\${job.summary}</p>\` : ""}
                </div>
              \`
                )
                .join("")}
            </section>
          \`
              : ""
          }

          \${
            data.education && data.education.length
              ? \`
            <section class="zen-section">
              <h2>Education</h2>
              \${data.education
                .map(
                  (edu) => \`
                <div class="zen-entry">
                  <div class="zen-entry-header">
                    <h3>\${edu.studyType || "Degree"} in \${edu.area || "Field"}</h3>
                    <span>\${formatDate(edu.startDate, edu.endDate)}</span>
                  </div>
                  <p class="zen-company">\${edu.institution || "Institution"}</p>
                </div>
              \`
                )
                .join("")}
            </section>
          \`
              : ""
          }

          \${
            data.skills && data.skills.length
              ? \`
            <section class="zen-section">
              <h2>Skills</h2>
              <div class="zen-skills">
                \${data.skills
                  .map(
                    (skill) => \`
                  <div class="skill-item">
                    <strong>\${skill.name}</strong>
                    <p>\${
                      Array.isArray(skill.keywords)
                        ? skill.keywords.join(", ")
                        : skill.keywords || ""
                    }</p>
                  </div>
                \`
                  )
                  .join("")}
              </div>
            </section>
          \`
              : ""
          }

          \${
            data.projects && data.projects.length
              ? \`
            <section class="zen-section">
              <h2>Projects</h2>
              \${data.projects
                .map(
                  (proj) => \`
                <div class="zen-entry">
                  <h3>\${proj.name}</h3>
                  \${proj.description ? \`<p class="zen-text">\${proj.description}</p>\` : ""}
                </div>
              \`
                )
                .join("")}
            </section>
          \`
              : ""
          }
        </div>
      \`;

      const css = \`
        .resume-content.zen-minimal {
          font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
          color: #2c3e50;
          background: #fafafa;
          max-width: 850px;
          margin: 0 auto;
          padding: 0;
        }
        .zen-header {
          padding: 60px 40px 40px;
          background: white;
          border-bottom: 1px solid #ecf0f1;
        }
        .zen-header h1 {
          font-size: 32px;
          margin: 0 0 8px 0;
          font-weight: 300;
          letter-spacing: 2px;
        }
        .zen-title {
          font-size: 13px;
          color: #95a5a6;
          margin: 0 0 16px 0;
          font-weight: 400;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .zen-intro {
          font-size: 13px;
          line-height: 1.7;
          color: #555;
          margin: 0;
          max-width: 600px;
          font-weight: 300;
        }
        .zen-contact {
          background: white;
          padding: 20px 40px;
          display: flex;
          gap: 20px;
          font-size: 11px;
          color: #7f8c8d;
          border-bottom: 1px solid #ecf0f1;
          flex-wrap: wrap;
        }
        .zen-section {
          background: white;
          padding: 40px;
          margin-bottom: 0;
          border-bottom: 1px solid #ecf0f1;
        }
        .zen-section h2 {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0 0 28px 0;
          color: #2c3e50;
          padding-bottom: 12px;
          border-bottom: 2px solid #ecf0f1;
        }
        .zen-entry {
          margin-bottom: 24px;
        }
        .zen-entry:last-child {
          margin-bottom: 0;
        }
        .zen-entry-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 20px;
          margin-bottom: 6px;
        }
        .zen-entry h3 {
          font-size: 13px;
          margin: 0;
          font-weight: 600;
          color: #2c3e50;
          flex: 1;
        }
        .zen-entry-header span {
          font-size: 11px;
          color: #95a5a6;
          white-space: nowrap;
          font-weight: 400;
        }
        .zen-company {
          font-size: 11px;
          color: #7f8c8d;
          margin: 0 0 8px 0;
          font-weight: 500;
        }
        .zen-text {
          font-size: 12px;
          line-height: 1.6;
          color: #555;
          margin: 10px 0 0 0;
          font-weight: 300;
        }
        .zen-skills {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }
        .skill-item {
          padding-bottom: 16px;
          border-bottom: 1px solid #ecf0f1;
        }
        .skill-item strong {
          display: block;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #2c3e50;
        }
        .skill-item p {
          font-size: 11px;
          color: #7f8c8d;
          margin: 0;
          line-height: 1.5;
          font-weight: 300;
        }
      \`;

      return { html, css };
    },
  },`;

console.log("Template enhancements file created for reference");
console.log(
  "Use the templates above to replace minimal, colorful, ats, academic, corporate, classic in templates.js"
);
