/**
 * TemplateRenderer
 *
 * Advanced template rendering system with:
 * - Multiple layout engines
 * - Responsive design support
 * - CSS-in-JS styling
 * - Print-optimized output
 */

class TemplateRenderer {
  static templates = {};

  static register(name, renderer) {
    this.templates[name] = renderer;
  }

  static render(templateName, data, options = {}) {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }
    return template(data, options);
  }

  static list() {
    return Object.keys(this.templates);
  }
}

/**
 * Elegant template with rich styling and typography
 */
TemplateRenderer.register("elegant", (data, options = {}) => {
  const { accentColor = "#2c3e50", fontFamily = "Georgia, serif" } = options;

  const html = `
    <div class="template-elegant">
      <div class="elegant-sidebar">
        <div class="elegant-profile">
          ${
            data.basics?.image
              ? `<img src="${data.basics.image}" alt="${data.basics.name}" class="profile-image">`
              : ""
          }
          <h1 class="profile-name">${data.basics?.name || "Your Name"}</h1>
          <p class="profile-title">${data.basics?.label || "Professional"}</p>
          ${
            data.basics?.summary
              ? `<p class="profile-bio">${data.basics.summary}</p>`
              : ""
          }
        </div>

        ${
          data.basics?.email ||
          data.basics?.phone ||
          data.basics?.location?.city
            ? `
          <div class="elegant-contact">
            <h3>Contact</h3>
            ${
              data.basics?.email
                ? `<div class="contact-item"><strong>Email:</strong> ${data.basics.email}</div>`
                : ""
            }
            ${
              data.basics?.phone
                ? `<div class="contact-item"><strong>Phone:</strong> ${data.basics.phone}</div>`
                : ""
            }
            ${
              data.basics?.url
                ? `<div class="contact-item"><strong>Website:</strong> <a href="${data.basics.url}">${data.basics.url}</a></div>`
                : ""
            }
            ${
              data.basics?.location?.city
                ? `<div class="contact-item"><strong>Location:</strong> ${
                    data.basics.location.city
                  }${
                    data.basics.location.region
                      ? ", " + data.basics.location.region
                      : ""
                  }</div>`
                : ""
            }
          </div>
        `
            : ""
        }

        ${
          data.skills && data.skills.length
            ? `
          <div class="elegant-skills">
            <h3>Skills</h3>
            ${data.skills
              .map(
                (skill) => `
              <div class="skill-category">
                <h4>${skill.name}</h4>
                <p class="skill-list">${
                  Array.isArray(skill.keywords)
                    ? skill.keywords.join(", ")
                    : skill.keywords || ""
                }</p>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        ${
          data.languages && data.languages.length
            ? `
          <div class="elegant-languages">
            <h3>Languages</h3>
            ${data.languages
              .map(
                (lang) => `
              <div class="language-item">
                <strong>${lang.language}</strong>
                <span class="fluency">${lang.fluency}</span>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>

      <div class="elegant-main">
        ${
          data.basics?.summary && !data.work?.length
            ? `
          <section class="elegant-section">
            <h2>Professional Summary</h2>
            <p>${data.basics.summary}</p>
          </section>
        `
            : ""
        }

        ${
          data.work && data.work.length
            ? `
          <section class="elegant-section">
            <h2>Professional Experience</h2>
            ${data.work
              .map(
                (job) => `
              <div class="elegant-entry">
                <div class="entry-header">
                  <h3>${job.position || "Position"}</h3>
                  <span class="entry-date">${TemplateRenderer.formatDate(
                    job.startDate
                  )} - ${TemplateRenderer.formatDate(job.endDate)}</span>
                </div>
                <p class="entry-company">${job.name || "Company"}</p>
                ${
                  job.summary
                    ? `<p class="entry-description">${job.summary}</p>`
                    : ""
                }
                ${
                  job.highlights && job.highlights.length
                    ? `
                  <ul class="entry-highlights">
                    ${job.highlights
                      .slice(0, 3)
                      .map((h) => `<li>${h}</li>`)
                      .join("")}
                  </ul>
                `
                    : ""
                }
              </div>
            `
              )
              .join("")}
          </section>
        `
            : ""
        }

        ${
          data.education && data.education.length
            ? `
          <section class="elegant-section">
            <h2>Education</h2>
            ${data.education
              .map(
                (edu) => `
              <div class="elegant-entry">
                <div class="entry-header">
                  <h3>${edu.studyType} in ${edu.area}</h3>
                  <span class="entry-date">${TemplateRenderer.formatDate(
                    edu.startDate
                  )}</span>
                </div>
                <p class="entry-institution">${edu.institution}</p>
              </div>
            `
              )
              .join("")}
          </section>
        `
            : ""
        }

        ${
          data.certifications && data.certifications.length
            ? `
          <section class="elegant-section">
            <h2>Certifications</h2>
            <ul class="cert-list">
              ${data.certifications
                .map((cert) => `<li>${cert.name}</li>`)
                .join("")}
            </ul>
          </section>
        `
            : ""
        }
      </div>
    </div>
  `;

  const css = `
    .template-elegant {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 40px;
      font-family: ${fontFamily};
      color: #333;
      line-height: 1.6;
    }

    .elegant-sidebar {
      background: #f8f8f8;
      padding: 30px;
      border-radius: 8px;
    }

    .profile-image {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      margin: 0 auto 20px;
      display: block;
      border: 4px solid ${accentColor};
    }

    .profile-name {
      font-size: 24px;
      margin: 0 0 10px 0;
      font-weight: 700;
      color: ${accentColor};
    }

    .profile-title {
      font-size: 14px;
      color: #666;
      margin: 0 0 15px 0;
      font-style: italic;
    }

    .profile-bio {
      font-size: 13px;
      line-height: 1.5;
      margin: 15px 0;
    }

    .elegant-contact,
    .elegant-skills,
    .elegant-languages {
      margin-top: 25px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
    }

    .elegant-contact h3,
    .elegant-skills h3,
    .elegant-languages h3 {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 15px 0;
      color: ${accentColor};
      font-weight: 700;
    }

    .contact-item {
      font-size: 12px;
      margin-bottom: 8px;
    }

    .contact-item strong {
      display: block;
      font-weight: 700;
    }

    .contact-item a {
      color: ${accentColor};
      text-decoration: none;
    }

    .skill-category {
      margin-bottom: 12px;
    }

    .skill-category h4 {
      font-size: 12px;
      margin: 0 0 5px 0;
      font-weight: 700;
    }

    .skill-list {
      font-size: 11px;
      margin: 0;
      color: #666;
    }

    .language-item {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 8px;
    }

    .fluency {
      font-size: 11px;
      color: #999;
    }

    .elegant-main {
      padding: 20px 0;
    }

    .elegant-section {
      margin-bottom: 30px;
    }

    .elegant-section h2 {
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 20px 0;
      padding-bottom: 10px;
      border-bottom: 3px solid ${accentColor};
      color: ${accentColor};
    }

    .elegant-entry {
      margin-bottom: 20px;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 15px;
      margin-bottom: 5px;
    }

    .elegant-entry h3 {
      font-size: 14px;
      margin: 0;
      font-weight: 700;
    }

    .entry-date {
      font-size: 12px;
      color: #999;
      flex-shrink: 0;
    }

    .entry-company,
    .entry-institution {
      font-size: 13px;
      color: ${accentColor};
      margin: 0 0 8px 0;
      font-weight: 600;
    }

    .entry-description {
      font-size: 12px;
      margin: 8px 0;
      line-height: 1.5;
    }

    .entry-highlights {
      list-style: none;
      padding: 0;
      margin: 8px 0 0 0;
      font-size: 12px;
    }

    .entry-highlights li {
      padding-left: 15px;
      margin-bottom: 4px;
      position: relative;
    }

    .entry-highlights li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${accentColor};
      font-weight: bold;
    }

    .cert-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .cert-list li {
      font-size: 12px;
      padding: 6px 0;
      padding-left: 15px;
      position: relative;
    }

    .cert-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: ${accentColor};
      font-weight: bold;
    }

    @media print {
      .template-elegant {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 30px;
        font-size: 11px;
      }
    }
  `;

  return { html, css };
});

/**
 * Modern template with clean design
 */
TemplateRenderer.register("modern-pro", (data, options = {}) => {
  const { primaryColor = "#00bcd4", secondaryColor = "#f5f5f5" } = options;

  const html = `
    <div class="template-modern-pro">
      <div class="modern-header" style="background-color: ${primaryColor}">
        <h1>${data.basics?.name || "Your Name"}</h1>
        <p class="header-subtitle">${data.basics?.label || "Professional"}</p>
        <div class="header-contact">
          ${data.basics?.email ? `<span>${data.basics.email}</span>` : ""}
          ${
            data.basics?.phone
              ? `<span>•</span><span>${data.basics.phone}</span>`
              : ""
          }
          ${
            data.basics?.location?.city
              ? `<span>•</span><span>${data.basics.location.city}</span>`
              : ""
          }
        </div>
      </div>

      <div class="modern-body">
        ${
          data.work && data.work.length
            ? `
          <section>
            <h2>Experience</h2>
            ${data.work
              .map(
                (job) => `
              <div class="modern-card">
                <div class="card-header">
                  <h3>${job.position}</h3>
                  <span class="card-date">${TemplateRenderer.formatDate(
                    job.startDate
                  )} - ${TemplateRenderer.formatDate(job.endDate)}</span>
                </div>
                <p class="card-subtitle">${job.name}</p>
                ${job.summary ? `<p>${job.summary}</p>` : ""}
              </div>
            `
              )
              .join("")}
          </section>
        `
            : ""
        }

        ${
          data.education && data.education.length
            ? `
          <section>
            <h2>Education</h2>
            ${data.education
              .map(
                (edu) => `
              <div class="modern-card">
                <h3>${edu.studyType} in ${edu.area}</h3>
                <p class="card-subtitle">${edu.institution}</p>
              </div>
            `
              )
              .join("")}
          </section>
        `
            : ""
        }

        ${
          data.skills && data.skills.length
            ? `
          <section>
            <h2>Skills</h2>
            <div class="skills-grid">
              ${data.skills
                .map(
                  (skill) => `
                <div class="skill-chip">
                  <strong>${skill.name}</strong>
                  ${
                    Array.isArray(skill.keywords)
                      ? `<p>${skill.keywords.slice(0, 3).join(", ")}</p>`
                      : ""
                  }
                </div>
              `
                )
                .join("")}
            </div>
          </section>
        `
            : ""
        }
      </div>
    </div>
  `;

  const css = `
    .template-modern-pro {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .modern-header {
      color: white;
      padding: 40px;
      text-align: center;
    }

    .modern-header h1 {
      font-size: 32px;
      margin: 0 0 10px 0;
      font-weight: 700;
    }

    .header-subtitle {
      font-size: 18px;
      margin: 0 0 15px 0;
      opacity: 0.95;
    }

    .header-contact {
      font-size: 13px;
      opacity: 0.9;
    }

    .modern-body {
      padding: 40px;
    }

    .modern-body section {
      margin-bottom: 35px;
    }

    .modern-body h2 {
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 20px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .modern-card {
      margin-bottom: 20px;
      padding: 15px;
      background: ${secondaryColor};
      border-radius: 6px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .modern-card h3 {
      font-size: 14px;
      margin: 0;
      font-weight: 700;
    }

    .card-date {
      font-size: 12px;
      color: #999;
    }

    .card-subtitle {
      font-size: 12px;
      color: #666;
      margin: 0 0 8px 0;
    }

    .modern-card p {
      font-size: 12px;
      line-height: 1.5;
      margin: 5px 0 0 0;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .skill-chip {
      background: ${secondaryColor};
      padding: 12px;
      border-radius: 6px;
    }

    .skill-chip strong {
      display: block;
      font-size: 12px;
      margin-bottom: 4px;
    }

    .skill-chip p {
      font-size: 11px;
      color: #666;
      margin: 0;
    }
  `;

  return { html, css };
});

/**
 * Helper method to format dates
 */
TemplateRenderer.formatDate = (dateStr) => {
  if (!dateStr) return "";
  if (dateStr.toLowerCase() === "present") return "Present";

  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
};

// Export
window.TemplateRenderer = TemplateRenderer;
