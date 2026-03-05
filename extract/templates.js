const TEMPLATES = {
  classic: {
    name: "Classic",
    render: (data) => {
      const formatDate = (start, end) => {
        if (!end)
          return start
            ? new Date(start).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "";
        return `${new Date(start).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })} - ${new Date(end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })}`;
      };

      const html = `
        <div class="resume-content">
          <header class="resume-header">
            <h1>${data.basics?.name || "Your Name"}</h1>
            <p class="job-title">${data.basics?.label || "Professional"}</p>
            <div class="contact-info">
              ${data.basics?.email ? `<span>${data.basics.email}</span>` : ""}
              ${data.basics?.phone ? `<span>${data.basics.phone}</span>` : ""}
              ${
                data.basics?.location
                  ? `<span>${data.basics.location}</span>`
                  : ""
              }
            </div>
            ${
              data.basics?.summary
                ? `<p class="summary">${data.basics.summary}</p>`
                : ""
            }
          </header>

          ${
            data.work && data.work.length
              ? `
            <section class="resume-section">
              <h2>Experience</h2>
              ${data.work
                .map(
                  (job) => `
                <div class="entry">
                  <div class="entry-header">
                    <h3>${job.position || "Position"}</h3>
                    <span class="date">${formatDate(
                      job.startDate,
                      job.endDate
                    )}</span>
                  </div>
                  <p class="company">${job.name || "Company"}</p>
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
            <section class="resume-section">
              <h2>Education</h2>
              ${data.education
                .map(
                  (edu) => `
                <div class="entry">
                  <div class="entry-header">
                    <h3>${edu.studyType || "Degree"} in ${
                    edu.area || "Field"
                  }</h3>
                    <span class="date">${formatDate(
                      edu.startDate,
                      edu.endDate
                    )}</span>
                  </div>
                  <p class="institution">${edu.institution || "Institution"}</p>
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
            <section class="resume-section">
              <h2>Skills</h2>
              <div class="skills-grid">
                ${data.skills
                  .map(
                    (skill) => `
                  <div class="skill-item">
                    <strong>${skill.name || "Skill"}</strong>
                    <p>${
                      Array.isArray(skill.keywords)
                        ? skill.keywords.join(", ")
                        : skill.keywords || ""
                    }</p>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </section>
          `
              : ""
          }

          ${
            data.projects && data.projects.length
              ? `
            <section class="resume-section">
              <h2>Projects</h2>
              ${data.projects
                .map(
                  (proj) => `
                <div class="entry">
                  <h3>${proj.name || "Project"}</h3>
                  ${proj.summary ? `<p>${proj.summary}</p>` : ""}
                  ${
                    proj.keywords && proj.keywords.length
                      ? `<p class="project-tech"><strong>Tech:</strong> ${proj.keywords.join(
                          ", "
                        )}</p>`
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
        </div>
      `;

      const css = `
        .resume-content {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #000;
          background: linear-gradient(135deg, #C9B49A 0%, #D4C4B0 100%);
          padding: 40px;
          border-radius: 8px;
        }
        .resume-header {
          border-bottom: 3px solid #5D4E37;
          padding-bottom: 20px;
          margin-bottom: 30px;
          background: rgba(255, 255, 255, 0.7);
          padding: 20px;
          border-radius: 8px;
        }
        .resume-header h1 {
          font-size: 28px;
          margin: 0 0 5px 0;
          font-weight: 700;
          color: #000;
        }
        .job-title {
          font-size: 14px;
          color: #1a1a1a;
          margin: 0 0 10px 0;
        }
        .contact-info {
          display: flex;
          gap: 15px;
          font-size: 12px;
          color: #1a1a1a;
          flex-wrap: wrap;
        }
        .contact-info span {
          border-right: 1px solid #5D4E37;
          padding-right: 15px;
        }
        .contact-info span:last-child {
          border-right: none;
        }
        .summary {
          font-size: 13px;
          margin-top: 10px;
          line-height: 1.5;
          color: #000;
        }
        .resume-section {
          margin-bottom: 25px;
          background: rgba(255, 255, 255, 0.8);
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #5D4E37;
        }
        .resume-section h2 {
          font-size: 16px;
          font-weight: 700;
          border-bottom: 2px solid #5D4E37;
          padding-bottom: 8px;
          margin-bottom: 15px;
          color: #000;
          margin-top: 0;
        }
        .entry {
          margin-bottom: 15px;
        }
        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
        }
        .entry h3 {
          font-size: 14px;
          margin: 0;
          font-weight: 700;
          color: #000;
        }
        .date {
          font-size: 12px;
          color: #1a1a1a;
          flex-shrink: 0;
        }
        .company, .institution {
          font-size: 13px;
          color: #1a1a1a;
          margin: 3px 0 8px 0;
          font-style: italic;
        }
        .entry p {
          font-size: 12px;
          margin: 5px 0;
          color: #000;
        }
        .skills-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .skill-item {
          padding: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          border: 1px solid #5D4E37;
        }
        .skill-item strong {
          font-size: 12px;
          display: block;
          color: #000;
        }
        .skill-item p {
          font-size: 11px;
          margin: 3px 0 0 0;
          color: #1a1a1a;
        }
        .project-tech {
          font-size: 11px;
          color: #1a1a1a;
          margin: 5px 0 0 0;
          font-style: italic;
        }
      `;

      return { html, css };
    },
  },

  modern: {
    name: "Modern",
    render: (data) => {
      const formatDate = (start, end) => {
        if (!end)
          return start
            ? new Date(start).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "";
        return `${new Date(start).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })} - ${new Date(end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })}`;
      };

      const html = `
        <div class="resume-content modern-enhanced">
          <aside class="modern-sidebar">
            <div class="modern-header">
              <h1>${data.basics?.name || "Your Name"}</h1>
              <p class="modern-title">${
                data.basics?.label || "Professional"
              }</p>
            </div>

            ${
              data.basics?.summary
                ? `<p class="modern-bio">${data.basics.summary}</p>`
                : ""
            }

            ${
              data.basics?.email || data.basics?.phone || data.basics?.location
                ? `
              <div class="modern-section">
                <h3>Contact</h3>
                <div class="modern-contact">
                  ${
                    data.basics?.email
                      ? `<div class="contact-item"><span class="icon">✉</span>${data.basics.email}</div>`
                      : ""
                  }
                  ${
                    data.basics?.phone
                      ? `<div class="contact-item"><span class="icon">☎</span>${data.basics.phone}</div>`
                      : ""
                  }
                  ${
                    data.basics?.location
                      ? `<div class="contact-item"><span class="icon">📍</span>${data.basics.location}</div>`
                      : ""
                  }
                </div>
              </div>
            `
                : ""
            }

            ${
              data.skills && data.skills.length
                ? `
              <div class="modern-section">
                <h3>Skills</h3>
                <div class="modern-skills">
                  ${data.skills
                    .map(
                      (skill) => `
                    <div class="skill-category">
                      <h4>${skill.name || "Skill"}</h4>
                      <div class="skill-badges">
                        ${
                          Array.isArray(skill.keywords)
                            ? skill.keywords
                                .map((kw) => `<span class="badge">${kw}</span>`)
                                .join("")
                            : ""
                        }
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
          </aside>

          <main class="modern-main">
            ${
              data.work && data.work.length
                ? `
              <section class="modern-block">
                <h2>Work Experience</h2>
                ${data.work
                  .map(
                    (job) => `
                  <div class="modern-card">
                    <div class="card-header">
                      <div>
                        <h3>${job.position || "Position"}</h3>
                        <p class="card-subtitle">${job.name || "Company"}</p>
                      </div>
                      <span class="card-date">${formatDate(
                        job.startDate,
                        job.endDate
                      )}</span>
                    </div>
                    ${
                      job.summary
                        ? `<p class="card-description">${job.summary}</p>`
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
              <section class="modern-block">
                <h2>Education</h2>
                ${data.education
                  .map(
                    (edu) => `
                  <div class="modern-card">
                    <div class="card-header">
                      <div>
                        <h3>${edu.studyType || "Degree"} in ${
                      edu.area || "Field"
                    }</h3>
                        <p class="card-subtitle">${
                          edu.institution || "Institution"
                        }</p>
                      </div>
                      <span class="card-date">${formatDate(
                        edu.startDate,
                        edu.endDate
                      )}</span>
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </section>
            `
                : ""
            }

            ${
              data.projects && data.projects.length
                ? `
              <section class="modern-block">
                <h2>Projects</h2>
                <div class="projects-grid">
                  ${data.projects
                    .map(
                      (proj) => `
                    <div class="project-card">
                      <h3>${proj.name || "Project"}</h3>
                      ${proj.summary ? `<p>${proj.summary}</p>` : ""}
                      ${
                        proj.keywords && proj.keywords.length
                          ? `<p class="project-tech"><strong>Tech:</strong> ${proj.keywords.join(
                              ", "
                            )}</p>`
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
          </main>
        </div>
      `;

      const css = `
        .resume-content.modern-enhanced {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 30px;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          max-width: 1000px;
          margin: 0 auto;
        }
        .modern-sidebar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 35px 25px;
          border-radius: 12px;
          height: fit-content;
        }
        .modern-header h1 {
          font-size: 26px;
          margin: 0 0 8px 0;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .modern-title {
          font-size: 14px;
          opacity: 0.95;
          margin: 0 0 20px 0;
          font-weight: 500;
        }
        .modern-bio {
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 25px;
          opacity: 0.9;
        }
        .modern-section {
          margin-bottom: 25px;
        }
        .modern-section h3 {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin: 0 0 12px 0;
          font-weight: 700;
          opacity: 0.95;
        }
        .modern-contact {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .contact-item {
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .contact-item .icon {
          font-size: 14px;
          opacity: 0.9;
        }
        .skill-category {
          margin-bottom: 15px;
        }
        .skill-category h4 {
          font-size: 12px;
          margin: 0 0 8px 0;
          font-weight: 600;
          opacity: 0.95;
        }
        .skill-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .badge {
          background: rgba(255, 255, 255, 0.25);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .modern-main {
          padding: 10px 15px;
        }
        .modern-block {
          margin-bottom: 40px;
        }
        .modern-block h2 {
          font-size: 18px;
          font-weight: 800;
          margin: 0 0 25px 0;
          color: white;
          position: relative;
          padding-bottom: 12px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        .modern-block h2:after {
          content: '';
          display: none;
        }
        .modern-card {
          margin-bottom: 20px;
          padding: 18px;
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        .modern-card:hover {
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
          transform: translateX(4px);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 10px;
        }
        .card-header h3 {
          font-size: 14px;
          margin: 0;
          font-weight: 700;
          color: #1a1a1a;
        }
        .card-subtitle {
          font-size: 12px;
          color: #666;
          margin: 5px 0 0 0;
          font-weight: 500;
        }
        .card-date {
          font-size: 11px;
          color: #999;
          white-space: nowrap;
          margin-top: 2px;
        }
        .card-description {
          font-size: 12px;
          line-height: 1.6;
          color: #555;
          margin: 10px 0 0 0;
        }
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 18px;
        }
        .project-card {
          padding: 18px;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        .project-card:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }
        .project-card h3 {
          font-size: 14px;
          margin: 0 0 8px 0;
          font-weight: 700;
          color: #1a1a1a;
        }
        .project-card p {
          font-size: 12px;
          color: #666;
          line-height: 1.5;
          margin: 0;
        }
        .project-tech {
          font-size: 11px;
          color: #667eea;
          margin: 8px 0 0 0;
          font-style: italic;
        }
        @media print {
          .modern-sidebar { background: white; color: #1a1a1a; }
          .badge { background: #f0f0f0; color: #1a1a1a; border: 1px solid #ddd; }
          .modern-card { border-left-color: #1a1a1a; background: white; }
        }
      `;

      return { html, css };
    },
  },

  creative: {
    name: "Creative",
    render: (data) => {
      const formatDate = (start, end) => {
        if (!end)
          return start
            ? new Date(start).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "";
        return `${new Date(start).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })} - ${new Date(end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })}`;
      };

      const html = `
        <div class="resume-content creative-portfolio">
          <div class="creative-hero">
            <div class="hero-content">
              <h1 class="hero-name">${data.basics?.name || "Your Name"}</h1>
              <p class="hero-title">${
                data.basics?.label || "Creative Professional"
              }</p>
              ${
                data.basics?.summary
                  ? `<p class="hero-bio">${data.basics.summary}</p>`
                  : ""
              }
            </div>
          </div>

          ${
            data.skills && data.skills.length
              ? `
            <div class="stats-container">
              ${data.skills
                .slice(0, 3)
                .map(
                  (skill, idx) => `
                <div class="stat-card">
                  <div class="stat-number">${
                    skill.keywords ? skill.keywords.length : 0
                  }</div>
                  <div class="stat-label">${skill.name}</div>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }

          ${
            data.work && data.work.length
              ? `
            <section class="creative-section">
              <h2>Work Experience</h2>
              <div class="cards-grid">
                ${data.work
                  .map(
                    (job) => `
                  <div class="experience-card">
                    <div class="card-accent"></div>
                    <h3>${job.position || "Position"}</h3>
                    <p class="card-company">${job.name || "Company"}</p>
                    <p class="card-date">${formatDate(
                      job.startDate,
                      job.endDate
                    )}</p>
                    ${
                      job.summary
                        ? `<p class="card-text">${job.summary}</p>`
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

          ${
            data.education && data.education.length
              ? `
            <section class="creative-section">
              <h2>Education</h2>
              <div class="cards-grid">
                ${data.education
                  .map(
                    (edu) => `
                  <div class="education-card">
                    <div class="card-accent-alt"></div>
                    <h3>${edu.studyType || "Degree"}</h3>
                    <p class="card-major">${edu.area || "Field"}</p>
                    <p class="card-school">${
                      edu.institution || "Institution"
                    }</p>
                    <p class="card-date">${formatDate(
                      edu.startDate,
                      edu.endDate
                    )}</p>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </section>
          `
              : ""
          }

          ${
            data.projects && data.projects.length
              ? `
            <section class="creative-section">
              <h2>Featured Projects</h2>
              <div class="projects-masonry">
                ${data.projects
                  .map(
                    (proj, idx) => `
                  <div class="project-card ${
                    idx % 2 === 0 ? "project-wide" : ""
                  }">
                    <div class="project-header">
                      <h3>${proj.name || "Project"}</h3>
                    </div>
                    ${
                      proj.summary
                        ? `<p class="project-desc">${proj.summary}</p>`
                        : ""
                    }
                    ${
                      proj.keywords && proj.keywords.length
                        ? `<p class="project-tech"><strong>Tech:</strong> ${proj.keywords.join(
                            ", "
                          )}</p>`
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

          ${
            data.skills && data.skills.length
              ? `
            <section class="creative-section">
              <h2>Skills & Expertise</h2>
              <div class="skills-cloud">
                ${data.skills
                  .flatMap((skill) =>
                    Array.isArray(skill.keywords) ? skill.keywords : []
                  )
                  .map(
                    (keyword) => `<span class="skill-pill">${keyword}</span>`
                  )
                  .join("")}
              </div>
            </section>
          `
              : ""
          }

          <div class="creative-footer">
            ${
              data.basics?.email
                ? `<div class="footer-item">📧 ${data.basics.email}</div>`
                : ""
            }
            ${
              data.basics?.phone
                ? `<div class="footer-item">📱 ${data.basics.phone}</div>`
                : ""
            }
            ${
              data.basics?.location
                ? `<div class="footer-item">📍 ${data.basics.location}</div>`
                : ""
            }
          </div>
        </div>
      `;

      const css = `
        .resume-content.creative-portfolio {
          font-family: 'Poppins', 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 40px;
        }
        .creative-hero {
          text-align: center;
          margin-bottom: 50px;
          background: white;
          padding: 50px 40px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }
        .hero-name {
          font-size: 48px;
          font-weight: 800;
          margin: 0 0 10px 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-title {
          font-size: 20px;
          color: #666;
          margin: 0 0 15px 0;
          font-weight: 500;
          letter-spacing: 0.5px;
        }
        .hero-bio {
          font-size: 14px;
          color: #555;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 20px;
          margin-bottom: 50px;
        }
        .stat-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
        }
        .stat-number {
          font-size: 32px;
          font-weight: 800;
          color: #667eea;
        }
        .stat-label {
          font-size: 12px;
          color: #999;
          margin-top: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .creative-section {
          margin-bottom: 50px;
        }
        .creative-section h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 30px 0;
          color: #1a1a1a;
          position: relative;
          padding-bottom: 12px;
        }
        .creative-section h2:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .experience-card, .education-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .experience-card:hover, .education-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 30px rgba(102, 126, 234, 0.15);
        }
        .card-accent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        .card-accent-alt {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f59e0b 0%, #ec4899 100%);
        }
        .experience-card h3, .education-card h3 {
          font-size: 15px;
          font-weight: 700;
          margin: 15px 0 8px 0;
          color: #1a1a1a;
        }
        .card-company, .card-major, .card-school {
          font-size: 12px;
          color: #666;
          margin: 4px 0;
          font-weight: 500;
        }
        .card-date {
          font-size: 11px;
          color: #999;
          margin-top: 10px;
        }
        .card-text {
          font-size: 12px;
          line-height: 1.5;
          color: #555;
          margin-top: 12px;
        }
        .projects-masonry {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          grid-auto-flow: dense;
        }
        .project-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }
        .project-wide {
          grid-column: span 2;
        }
        .project-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.15);
        }
        .project-header {
          margin-bottom: 12px;
        }
        .project-card h3 {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          color: #1a1a1a;
        }
        .project-desc {
          font-size: 12px;
          line-height: 1.5;
          color: #666;
          margin: 0;
        }
        .project-tech {
          font-size: 11px;
          color: #667eea;
          margin: 8px 0 0 0;
          font-style: italic;
        }
        .skills-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        .skill-pill {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .skill-pill:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        .creative-footer {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-top: 50px;
          padding-top: 30px;
          border-top: 2px solid rgba(0, 0, 0, 0.1);
          flex-wrap: wrap;
        }
        .footer-item {
          font-size: 13px;
          color: #666;
          font-weight: 500;
        }
        @media print {
          .resume-content.creative-portfolio {
            background: white;
            padding: 20px;
          }
          .creative-hero {
            box-shadow: none;
            border: 1px solid #eee;
          }
        }
      `;

      return { html, css };
    },
  },

  tech: {
    name: "Tech",
    render: (data) => {
      const formatDate = (start, end) => {
        if (!end)
          return start
            ? new Date(start).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "";
        return `${new Date(start).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })} - ${new Date(end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })}`;
      };

      // Calculate experience level based on work history
      const totalYears = data.work ? Math.round(data.work.length * 2.5) : 0;

      const html = `
        <div class="resume-content tech-terminal">
          <!-- ASCII Art Header -->
          <div class="ascii-header">
            <pre>
╔══════════════════════════════════════════════════════════╗
${(data.basics?.name || "DEVELOPER").padStart(30).padEnd(60)}
${(
  data.basics?.label?.split("|")?.[0]?.trim() ||
  data.basics?.phone ||
  "Contact Info"
)
  .padStart(30)
  .padEnd(60)}
╚══════════════════════════════════════════════════════════╝
            </pre>
          </div>

          <div class="terminal-emulator">
            <div class="terminal-header">
              <div class="terminal-buttons">
                <span class="btn-close"></span>
                <span class="btn-minimize"></span>
                <span class="btn-maximize"></span>
              </div>
              <div class="terminal-title">bash-5.0$ developer-profile</div>
            </div>

            <div class="terminal-content">
              <!-- PROFILE COMMAND -->
              <div class="terminal-line">
                <span class="prompt">$</span>
                <span class="command">whoami && echo "---"</span>
              </div>
              <div class="terminal-output">
                <div class="output-line"><span class="output-text">${
                  data.basics?.name || "Professional"
                }</span></div>
                <div class="output-line" style="color: #00ff88; font-size: 11px;">
                  ${
                    data.basics?.label
                      ? data.basics.label.split("|")[0].trim()
                      : "Full Stack Developer"
                  }
                </div>
              </div>

              <!-- CONTACT INFO COMMAND -->
              <div class="terminal-line">
                <span class="prompt">$</span>
                <span class="command">cat /etc/profile.d/contact.sh</span>
              </div>
              <div class="terminal-output">
                ${
                  data.basics?.email
                    ? `<div class="output-line"><span class="label">📧 Email:</span> <span class="link">${data.basics.email}</span></div>`
                    : ""
                }
                ${
                  data.basics?.phone
                    ? `<div class="output-line"><span class="label">📱 Phone:</span> <span class="link">${data.basics.phone}</span></div>`
                    : ""
                }
                ${
                  data.basics?.url
                    ? `<div class="output-line"><span class="label">🔗 Web:</span> <span class="link">${data.basics.url}</span></div>`
                    : ""
                }
                ${
                  data.basics?.location
                    ? `<div class="output-line"><span class="label">📍 Location:</span> <span class="value">${data.basics.location}</span></div>`
                    : ""
                }
              </div>

              <!-- SUMMARY COMMAND -->
              ${
                data.basics?.summary
                  ? `
                <div class="terminal-line">
                  <span class="prompt">$</span>
                  <span class="command">cat README.md</span>
                </div>
                <div class="terminal-output">
                  <div class="output-line summary-text">"${data.basics.summary.substring(
                    0,
                    200
                  )}"</div>
                </div>
              `
                  : ""
              }

              <!-- WORK EXPERIENCE COMMAND -->
              ${
                data.work && data.work.length
                  ? `
                <div class="terminal-line">
                  <span class="prompt">$</span>
                  <span class="command">git log --all --oneline --graph</span>
                </div>
                <div class="terminal-output">
                  ${data.work
                    .map(
                      (job, idx) => `
                    <div class="output-block">
                      <div class="output-line timeline-node">
                        <span class="timeline-marker">●</span>
                        <span class="highlight">${
                          job.position || "Position"
                        }</span>
                      </div>
                      <div class="output-line">
                        <span class="label">Company:</span>
                        <span class="value">${job.company || "Company"}</span>
                      </div>
                      <div class="output-line">
                        <span class="label">Period:</span>
                        <span class="value">${formatDate(
                          job.startDate,
                          job.endDate
                        )}</span>
                      </div>
                      ${
                        job.summary
                          ? `<div class="output-line description">
                        <span class="label">✓</span> ${job.summary
                          .substring(0, 180)
                          .replace(/\n/g, " ")}
                      </div>`
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

              <!-- EDUCATION COMMAND -->
              ${
                data.education && data.education.length
                  ? `
                <div class="terminal-line">
                  <span class="prompt">$</span>
                  <span class="command">ls -lah /usr/local/education/</span>
                </div>
                <div class="terminal-output">
                  <div class="output-line">drwxr-xr-x  ${
                    data.education.length
                  }  root  root  ${
                      data.education.length * 4
                    }K  Nov 20 10:45</div>
                  ${data.education
                    .map(
                      (edu, idx) => `
                    <div class="output-line edu-item">
                      <span class="file-icon">📚</span>
                      <span class="label">${edu.studyType || "Degree"}</span>
                      <span class="value">${edu.area || "Field"}</span>
                      <span class="muted">(${
                        edu.institution || "Institution"
                      })</span>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              `
                  : ""
              }

              <!-- SKILLS COMMAND -->
              ${
                data.skills && data.skills.length
                  ? `
                <div class="terminal-line">
                  <span class="prompt">$</span>
                  <span class="command">source ~/.bashrc && echo \$SKILLS</span>
                </div>
                <div class="terminal-output">
                  ${data.skills
                    .map(
                      (skill, idx) => `
                    <div class="skill-category">
                      <div class="output-line skill-header">
                        <span class="skill-name">[${skill.name}]</span>
                      </div>
                      <div class="output-line skill-items">
                        ${
                          Array.isArray(skill.keywords)
                            ? skill.keywords
                                .map(
                                  (kw) =>
                                    `<span class="skill-badge">${kw}</span>`
                                )
                                .join("")
                            : skill.keywords || ""
                        }
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              `
                  : ""
              }

              <!-- PROJECTS COMMAND -->
              ${
                data.projects && data.projects.length
                  ? `
                <div class="terminal-line">
                  <span class="prompt">$</span>
                  <span class="command">find ~/projects -type f -name "*.md" | head -${
                    data.projects.length
                  }</span>
                </div>
                <div class="terminal-output">
                  ${data.projects
                    .map(
                      (proj, idx) => `
                    <div class="project-item">
                      <div class="output-line project-name">
                        <span class="project-icon">🚀</span>
                        <span class="highlight">${proj.name || "Project"}</span>
                      </div>
                      ${
                        proj.summary
                          ? `<div class="output-line project-desc">
                        ${proj.summary.substring(0, 200).replace(/\n/g, " ")}
                      </div>`
                          : ""
                      }
                      ${
                        proj.keywords
                          ? `<div class="output-line project-tech">
                        <span class="tech-label">Stack:</span>
                        ${
                          Array.isArray(proj.keywords)
                            ? proj.keywords
                                .map(
                                  (tech) =>
                                    `<span class="tech-tag">${tech}</span>`
                                )
                                .join("")
                            : proj.keywords
                        }
                      </div>`
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

              <!-- FOOTER -->
              <div class="terminal-line">
                <span class="prompt">$</span>
                <span class="blink">_</span>
              </div>
            </div>
          </div>
        </div>
      `;

      const css = `
        .resume-content.tech-terminal {
          background: #0a0e27;
          color: #0fff50;
          font-family: 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          padding: 30px 20px;
          min-height: 100vh;
          line-height: 1.5;
        }

        .ascii-header {
          text-align: center;
          margin: 50px auto 50px auto;
          color: #00ff88;
          opacity: 0.8;
          font-size: 11px;
          font-weight: bold;
        }

        .ascii-header pre {
          margin: 0 auto;
          letter-spacing: 1px;
          width: fit-content;
          padding: 0 20px;
        }

        .terminal-emulator {
          background: linear-gradient(135deg, #0a0e27 0%, #161428 100%);
          border: 2px solid #0fff50;
          border-radius: 12px;
          box-shadow: 
            0 0 30px rgba(15, 255, 80, 0.25),
            inset 0 0 30px rgba(15, 255, 80, 0.05),
            0 0 60px rgba(0, 255, 136, 0.1);
          overflow: hidden;
          animation: glowPulse 3s ease-in-out infinite;
        }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(15, 255, 80, 0.25), inset 0 0 30px rgba(15, 255, 80, 0.05), 0 0 60px rgba(0, 255, 136, 0.1); }
          50% { box-shadow: 0 0 50px rgba(15, 255, 80, 0.35), inset 0 0 30px rgba(15, 255, 80, 0.1), 0 0 80px rgba(0, 255, 136, 0.2); }
        }

        .terminal-header {
          background: linear-gradient(90deg, #161428 0%, #1a1632 100%);
          border-bottom: 1px solid #0fff50;
          padding: 10px 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
        }

        .terminal-buttons {
          display: flex;
          gap: 8px;
        }

        .terminal-buttons span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .btn-close {
          background: #ff5555;
          box-shadow: 0 0 10px rgba(255, 85, 85, 0.5);
        }

        .btn-minimize {
          background: #ffaa00;
          box-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
        }

        .btn-maximize {
          background: #00ff88;
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }

        .terminal-title {
          font-size: 11px;
          margin-left: 12px;
          color: #00ff88;
          flex: 1;
          text-align: center;
          letter-spacing: 1px;
          font-weight: bold;
        }

        .terminal-content {
          padding: 20px 25px;
          font-size: 12px;
          line-height: 1.7;
          max-height: 85vh;
          overflow-y: auto;
          background: #0a0e27;
        }

        .terminal-content::-webkit-scrollbar {
          width: 10px;
        }

        .terminal-content::-webkit-scrollbar-track {
          background: rgba(15, 255, 80, 0.1);
        }

        .terminal-content::-webkit-scrollbar-thumb {
          background: #0fff50;
          border-radius: 5px;
        }

        .terminal-line {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
          align-items: flex-start;
        }

        .prompt {
          color: #0fff50;
          font-weight: bold;
          min-width: 18px;
          flex-shrink: 0;
        }

        .command {
          color: #0fff50;
          text-decoration: none;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        .blink {
          animation: blink 1s infinite;
          color: #0fff50;
          font-weight: bold;
        }

        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        .terminal-output {
          margin-left: 0;
          margin-bottom: 18px;
          padding-left: 18px;
          border-left: 2px solid rgba(15, 255, 80, 0.4);
        }

        .output-line {
          color: #0fff50;
          margin-bottom: 7px;
          word-break: break-word;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .output-line.highlight {
          color: #00ffff;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }

        .output-line.timeline-node {
          color: #00ff88;
          font-weight: bold;
        }

        .timeline-marker {
          color: #00ff88;
          font-size: 14px;
        }

        .output-line.description {
          color: #90ee90;
          font-size: 11px;
          margin-left: 10px;
        }

        .output-line.summary-text {
          color: #00ff88;
          font-style: italic;
          margin: 8px 0;
        }

        .output-line.edu-item {
          color: #00ff88;
          padding: 5px 0;
        }

        .output-block {
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(15, 255, 80, 0.2);
        }

        .output-text {
          color: #00ffff;
          font-weight: bold;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
        }

        .label {
          color: #0fff50;
          font-weight: bold;
          min-width: fit-content;
        }

        .value {
          color: #00ff88;
        }

        .link {
          color: #00ffff;
          text-decoration: underline;
          cursor: pointer;
        }

        .muted {
          color: #666688;
          font-size: 11px;
        }

        .file-icon {
          margin-right: 4px;
        }

        .skill-category {
          margin-bottom: 10px;
          padding: 8px;
          background: rgba(15, 255, 80, 0.05);
          border-left: 2px solid #00ff88;
        }

        .skill-header {
          color: #00ffff;
          font-weight: bold;
          text-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
        }

        .skill-items {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 6px;
        }

        .skill-badge {
          display: inline-block;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid #00ff88;
          color: #00ff88;
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 500;
        }

        .skill-name {
          color: #0fff50;
          font-weight: bold;
        }

        .project-item {
          background: rgba(0, 255, 255, 0.05);
          border-left: 3px solid #00ffff;
          padding: 10px;
          margin-bottom: 12px;
        }

        .project-name {
          color: #00ffff;
          font-weight: bold;
          font-size: 13px;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.4);
        }

        .project-icon {
          margin-right: 6px;
        }

        .project-desc {
          color: #90ee90;
          font-size: 11px;
          margin-left: 26px;
          margin-top: 4px;
        }

        .project-tech {
          color: #00ff88;
          font-size: 11px;
          margin-left: 26px;
          margin-top: 6px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tech-label {
          color: #0fff50;
          font-weight: bold;
        }

        .tech-tag {
          display: inline-block;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid #00ff88;
          color: #00ff88;
          padding: 2px 6px;
          border-radius: 2px;
          font-size: 10px;
        }

        @media print {
          .resume-content.tech-terminal {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Hide terminal decorative chrome */
          .ascii-header {
            display: none !important;
          }

          .terminal-emulator {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            border-radius: 0 !important;
          }

          .terminal-header {
            display: none !important;
          }

          .terminal-content {
            background: white !important;
            padding: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }

          .prompt,
          .command,
          .blink {
            display: none !important;
          }

          .terminal-output {
            margin: 0 !important;
            padding-left: 0 !important;
            border-left: none !important;
          }

          .output-line {
            margin-bottom: 4pt !important;
          }

          .terminal-line {
            margin-bottom: 6pt !important;
          }
        }
      `;

      return { html, css };
    },
  },

  executive: {
    name: "Executive",
    render: (data) => {
      const formatDate = (start, end) => {
        if (!end)
          return start
            ? new Date(start).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "";
        return `${new Date(start).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })} - ${new Date(end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })}`;
      };

      const html = `
        <div class="resume-content executive-formal">
          <div class="formal-header">
            <div class="header-divider">═══════════════════════════════════════════════════════════════</div>
            <h1>${data.basics?.name || "YOUR NAME"}</h1>
            <p class="formal-title">${(
              data.basics?.label || "EXECUTIVE"
            ).toUpperCase()}</p>
            <div class="header-divider">═══════════════════════════════════════════════════════════════</div>
          </div>

          <div class="formal-contact">
            ${data.basics?.email ? `<span>${data.basics.email}</span>` : ""}
            ${
              data.basics?.phone
                ? `<span>•</span><span>${data.basics.phone}</span>`
                : ""
            }
            ${
              data.basics?.location
                ? `<span>•</span><span>${data.basics.location}</span>`
                : ""
            }
          </div>

          ${
            data.basics?.summary
              ? `
            <section class="formal-section">
              <h2>EXECUTIVE PROFILE</h2>
              <div class="section-divider">───────────────────────────────────────────────────────────────</div>
              <p class="formal-text">${data.basics.summary}</p>
            </section>
          `
              : ""
          }

          ${
            data.work && data.work.length
              ? `
            <section class="formal-section">
              <h2>PROFESSIONAL HISTORY</h2>
              <div class="section-divider">───────────────────────────────────────────────────────────────</div>
              ${data.work
                .map(
                  (job) => `
                <div class="formal-entry">
                  <div class="entry-header">
                    <h3>${job.position || "Position"} | ${
                    job.name || "Company"
                  }</h3>
                    <span class="entry-date">${formatDate(
                      job.startDate,
                      job.endDate
                    )}</span>
                  </div>
                  ${
                    job.summary
                      ? `<p class="formal-text">${job.summary}</p>`
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
            <section class="formal-section">
              <h2>ACADEMIC CREDENTIALS</h2>
              <div class="section-divider">───────────────────────────────────────────────────────────────</div>
              ${data.education
                .map(
                  (edu) => `
                <div class="formal-entry compact">
                  <div class="entry-header">
                    <h3>${edu.studyType || "Degree"} in ${
                    edu.area || "Field"
                  }</h3>
                    <span class="entry-date">${formatDate(
                      edu.startDate,
                      edu.endDate
                    )}</span>
                  </div>
                  <p class="institution">${edu.institution || "Institution"}</p>
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
            <section class="formal-section">
              <h2>CORE COMPETENCIES</h2>
              <div class="section-divider">───────────────────────────────────────────────────────────────</div>
              <div class="competencies-grid">
                ${data.skills
                  .map(
                    (skill) => `
                  <div class="competency-block">
                    <strong>${skill.name || "Skill"}:</strong>
                    <span>${
                      Array.isArray(skill.keywords)
                        ? skill.keywords.join(", ")
                        : skill.keywords || ""
                    }</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </section>
          `
              : ""
          }

          ${
            data.projects && data.projects.length
              ? `
            <section class="formal-section">
              <h2>KEY INITIATIVES</h2>
              <div class="section-divider">───────────────────────────────────────────────────────────────</div>
              ${data.projects
                .map(
                  (proj) => `
                <div class="formal-entry compact">
                  <h3>▸ ${proj.name || "Project"}</h3>
                  ${
                    proj.summary
                      ? `<p class="formal-text">${proj.summary}</p>`
                      : ""
                  }
                  ${
                    proj.keywords && proj.keywords.length
                      ? `<p class="project-tech"><strong>Tech:</strong> ${proj.keywords.join(
                          ", "
                        )}</p>`
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

          <div class="formal-footer">
            ═══════════════════════════════════════════════════════════════
          </div>
        </div>
      `;

      const css = `
        .resume-content.executive-formal {
          font-family: 'Georgia', 'Times New Roman', serif;
          color: #1a1a1a;
          max-width: 850px;
          margin: 0 auto;
          background: #ffffff;
          padding: 40px;
          border-radius: 8px;
        }
        .formal-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
        }
        .header-divider {
          font-size: 12px;
          color: #1a1a1a;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }
        .formal-header h1 {
          font-size: 28px;
          margin: 8px 0;
          font-weight: 700;
          letter-spacing: 3px;
        }
        .formal-title {
          font-size: 13px;
          letter-spacing: 2px;
          margin: 0;
          font-weight: 600;
          color: #333;
        }
        .formal-contact {
          text-align: center;
          font-size: 11px;
          margin-bottom: 20px;
          letter-spacing: 0.5px;
        }
        .formal-contact span {
          margin: 0 4px;
        }
        .formal-section {
          margin-bottom: 22px;
        }
        .formal-section h2 {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          margin: 0 0 8px 0;
          text-transform: uppercase;
        }
        .section-divider {
          font-size: 11px;
          color: #666;
          letter-spacing: 1px;
          margin-bottom: 12px;
          display: block;
        }
        .formal-entry {
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e0e0e0;
        }
        .formal-entry.compact {
          margin-bottom: 10px;
          padding-bottom: 8px;
        }
        .formal-entry:last-child {
          border-bottom: none;
        }
        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 15px;
          margin-bottom: 6px;
        }
        .formal-entry h3 {
          font-size: 11px;
          margin: 0;
          font-weight: 700;
          flex: 1;
        }
        .entry-date {
          font-size: 10px;
          color: #666;
          white-space: nowrap;
          font-weight: 500;
        }
        .institution {
          font-size: 11px;
          color: #666;
          margin: 4px 0 0 0;
          font-style: italic;
        }
        .formal-text {
          font-size: 11px;
          line-height: 1.6;
          color: #555;
          margin: 6px 0 0 0;
        }
        .project-tech {
          font-size: 10px;
          color: #666;
          margin: 4px 0 0 0;
          font-style: italic;
        }
        .competencies-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 20px;
        }
        .competency-block {
          font-size: 10px;
          line-height: 1.5;
        }
        .competency-block strong {
          display: block;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .competency-block span {
          color: #666;
        }
        .formal-footer {
          text-align: center;
          font-size: 12px;
          color: #1a1a1a;
          letter-spacing: 2px;
          margin-top: 20px;
          padding-top: 15px;
        }
        @media print {
          .resume-content.executive-formal {
            background: white;
          }
        }
      `;

      return { html, css };
    },
  },

  compact: {
    name: "Compact",
    render: (data) => {
      const formatDate = (start, end) => {
        if (!end)
          return start
            ? new Date(start).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "";
        return `${new Date(start).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })} - ${new Date(end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })}`;
      };

      const html = `
        <div class="resume-content swiss-grid">
          <div class="swiss-header">
            <h1>${data.basics?.name || "Your Name"}</h1>
            <p class="swiss-title">${data.basics?.label || "Professional"}</p>
          </div>

          <div class="swiss-grid-layout">
            <aside class="swiss-sidebar">
              ${
                data.basics?.email ||
                data.basics?.phone ||
                data.basics?.location
                  ? `
                <section class="swiss-box">
                  <h3>Contact</h3>
                  ${data.basics?.email ? `<p>📧 ${data.basics.email}</p>` : ""}
                  ${data.basics?.phone ? `<p>📱 ${data.basics.phone}</p>` : ""}
                  ${
                    data.basics?.location
                      ? `<p>📍 ${data.basics.location}</p>`
                      : ""
                  }
                </section>
              `
                  : ""
              }

              ${
                data.skills && data.skills.length
                  ? `
                <section class="swiss-box">
                  <h3>Skills</h3>
                  ${data.skills
                    .map(
                      (skill) => `
                    <div class="skill-group">
                      <h4>${skill.name}</h4>
                      <div class="tags">
                        ${
                          Array.isArray(skill.keywords)
                            ? skill.keywords
                                .map((k) => `<span>${k}</span>`)
                                .join("")
                            : ""
                        }
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </section>
              `
                  : ""
              }
            </aside>

            <main class="swiss-main">
              ${
                data.basics?.summary
                  ? `
                <section class="swiss-block">
                  <p class="swiss-summary">${data.basics.summary}</p>
                </section>
              `
                  : ""
              }

              ${
                data.work && data.work.length
                  ? `
                <section class="swiss-block">
                  <h2>Experience</h2>
                  <div class="timeline-grid">
                    ${data.work
                      .map(
                        (job) => `
                      <div class="timeline-entry">
                        <div class="entry-date">${formatDate(
                          job.startDate,
                          job.endDate
                        )}</div>
                        <div class="entry-content">
                          <h3>${job.position || "Position"}</h3>
                          <p class="company">${job.name || "Company"}</p>
                          ${
                            job.summary
                              ? `<p class="description">${job.summary}</p>`
                              : ""
                          }
                        </div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </section>
              `
                  : ""
              }

              ${
                data.education && data.education.length
                  ? `
                <section class="swiss-block">
                  <h2>Education</h2>
                  <div class="timeline-grid">
                    ${data.education
                      .map(
                        (edu) => `
                      <div class="timeline-entry">
                        <div class="entry-date">${formatDate(
                          edu.startDate,
                          edu.endDate
                        )}</div>
                        <div class="entry-content">
                          <h3>${edu.studyType || "Degree"} in ${
                          edu.area || "Field"
                        }</h3>
                          <p class="institution">${
                            edu.institution || "Institution"
                          }</p>
                        </div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </section>
              `
                  : ""
              }

              ${
                data.projects && data.projects.length
                  ? `
                <section class="swiss-block">
                  <h2>Projects</h2>
                  ${data.projects
                    .map(
                      (proj) => `
                    <div class="project-item">
                      <h3>${proj.name}</h3>
                      ${proj.summary ? `<p>${proj.summary}</p>` : ""}
                      ${
                        proj.keywords && proj.keywords.length
                          ? `<p class="project-tech"><strong>Tech:</strong> ${proj.keywords.join(
                              ", "
                            )}</p>`
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
            </main>
          </div>
        </div>
      `;

      const css = `
        .resume-content.swiss-grid {
          font-family: 'Helvetica', 'Arial', sans-serif;
          color: #222;
          max-width: 900px;
          margin: 0 auto;
          background: #ffffff;
          padding: 40px;
          border-radius: 8px;
        }
        .swiss-header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #000;
        }
        .swiss-header h1 {
          font-size: 28px;
          margin: 0;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .swiss-title {
          font-size: 12px;
          margin: 6px 0 0 0;
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .swiss-grid-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 30px;
        }
        .swiss-sidebar {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
        .swiss-box {
          padding: 15px;
          background: #f5f5f5;
          border: 1px solid #ddd;
        }
        .swiss-box h3 {
          font-size: 11px;
          font-weight: 700;
          margin: 0 0 12px 0;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .swiss-box p {
          font-size: 10px;
          margin: 6px 0;
          line-height: 1.4;
        }
        .skill-group {
          margin-bottom: 12px;
        }
        .skill-group h4 {
          font-size: 10px;
          margin: 0 0 6px 0;
          font-weight: 600;
        }
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .tags span {
          font-size: 9px;
          background: #e0e0e0;
          padding: 2px 6px;
          border: 1px solid #999;
        }
        .swiss-main {
          padding-left: 0;
        }
        .swiss-block {
          margin-bottom: 25px;
        }
        .swiss-summary {
          font-size: 11px;
          line-height: 1.6;
          margin: 0;
        }
        .swiss-block h2 {
          font-size: 11px;
          font-weight: 700;
          margin: 0 0 12px 0;
          letter-spacing: 1px;
          text-transform: uppercase;
          padding-bottom: 6px;
          border-bottom: 1px solid #000;
        }
        .timeline-grid {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .timeline-entry {
          display: grid;
          grid-template-columns: 80px 1fr;
          gap: 15px;
        }
        .entry-date {
          font-size: 10px;
          font-weight: 600;
          color: #666;
        }
        .entry-content h3 {
          font-size: 11px;
          margin: 0 0 3px 0;
          font-weight: 700;
        }
        .company, .institution {
          font-size: 10px;
          color: #666;
          margin: 0;
          font-weight: 500;
        }
        .description {
          font-size: 10px;
          line-height: 1.4;
          margin: 5px 0 0 0;
          color: #555;
        }
        .project-item {
          margin-bottom: 12px;
          padding: 10px;
          background: #f9f9f9;
          border-left: 2px solid #000;
        }
        .project-item h3 {
          font-size: 10px;
          margin: 0 0 4px 0;
          font-weight: 700;
        }
        .project-item p {
          font-size: 9px;
          margin: 0;
          color: #666;
        }
        .project-tech {
          font-size: 9px;
          color: #666;
          margin: 4px 0 0 0;
          font-style: italic;
        }
      `;

      return { html, css };
    },
  },

  minimal: {
    name: "Minimal",
    render: (data) => {
      const formatDate = (start, end) => {
        if (!end)
          return start
            ? new Date(start).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "";
        return `${new Date(start).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })} - ${new Date(end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })}`;
      };

      const html = `
        <div class="resume-content zen-minimal">
          <header class="zen-header">
            <h1>${data.basics?.name || "Your Name"}</h1>
            <p class="zen-title">${data.basics?.label || "Professional"}</p>
            ${
              data.basics?.summary
                ? `<p class="zen-intro">${data.basics.summary}</p>`
                : ""
            }
          </header>

          <div class="zen-contact">
            ${data.basics?.email ? `<span>${data.basics.email}</span>` : ""}
            ${data.basics?.phone ? `<span>${data.basics.phone}</span>` : ""}
            ${
              data.basics?.location
                ? `<span>${data.basics.location}</span>`
                : ""
            }
          </div>

          ${
            data.work && data.work.length
              ? `
            <section class="zen-section">
              <h2>Experience</h2>
              ${data.work
                .map(
                  (job) => `
                <div class="zen-entry">
                  <div class="zen-entry-header">
                    <h3>${job.position || "Position"}</h3>
                    <span>${formatDate(job.startDate, job.endDate)}</span>
                  </div>
                  <p class="zen-company">${job.name || "Company"}</p>
                  ${job.summary ? `<p class="zen-text">${job.summary}</p>` : ""}
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
            <section class="zen-section">
              <h2>Education</h2>
              ${data.education
                .map(
                  (edu) => `
                <div class="zen-entry">
                  <div class="zen-entry-header">
                    <h3>${edu.studyType || "Degree"} in ${
                    edu.area || "Field"
                  }</h3>
                    <span>${formatDate(edu.startDate, edu.endDate)}</span>
                  </div>
                  <p class="zen-company">${edu.institution || "Institution"}</p>
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
            <section class="zen-section">
              <h2>Skills</h2>
              <div class="zen-skills">
                ${data.skills
                  .map(
                    (skill) => `
                  <div class="skill-item">
                    <strong>${skill.name}</strong>
                    <p>${
                      Array.isArray(skill.keywords)
                        ? skill.keywords.join(", ")
                        : skill.keywords || ""
                    }</p>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </section>
          `
              : ""
          }

          ${
            data.projects && data.projects.length
              ? `
            <section class="zen-section">
              <h2>Projects</h2>
              ${data.projects
                .map(
                  (proj) => `
                <div class="zen-entry">
                  <h3>${proj.name}</h3>
                  ${
                    proj.summary
                      ? `<p class="zen-text">${proj.summary}</p>`
                      : ""
                  }
                  ${
                    proj.keywords && proj.keywords.length
                      ? `<p class="zen-text"><strong>Tech:</strong> ${proj.keywords.join(
                          ", "
                        )}</p>`
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
        </div>
      `;

      const css = `
        .resume-content.zen-minimal {
          font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
          color: #2c3e50;
          background: #fafafa;
          max-width: 850px;
          margin: 0 auto;
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
        .project-tech {
          font-size: 11px;
          color: #7f8c8d;
          margin: 8px 0 0 0;
          font-style: italic;
          font-weight: 300;
        }
      `;

      return { html, css };
    },
  },

  colorful: {
    name: "Colorful",
    render: (data) => {
      const formatDate = (start, end) => {
        if (!end)
          return start
            ? new Date(start).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "";
        return `${new Date(start).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })} - ${new Date(end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })}`;
      };
      const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

      const html = `
        <div class="resume-content colorful">
          <div class="header-colorful">
            <h1>${data.basics?.name || "Your Name"}</h1>
            <p>${data.basics?.label || "Professional"}</p>
          </div>

          ${
            data.basics?.summary
              ? `<div class="summary-box">${data.basics.summary}</div>`
              : ""
          }

          <div class="colorful-grid">
            ${
              data.work && data.work.length
                ? `
              <section class="colorful-section" style="border-top: 4px solid ${
                colors[0]
              }">
                <h2>Experience</h2>
                ${data.work
                  .map(
                    (job, idx) => `
                  <div class="colorful-item" style="border-left: 3px solid ${
                    colors[idx % colors.length]
                  }">
                    <h3>${job.position || "Position"}</h3>
                    <p class="company">${job.name || "Company"}</p>
                    <p class="date">${formatDate(
                      job.startDate,
                      job.endDate
                    )}</p>
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
              <section class="colorful-section" style="border-top: 4px solid ${
                colors[1]
              }">
                <h2>Education</h2>
                ${data.education
                  .map(
                    (edu, idx) => `
                  <div class="colorful-item" style="border-left: 3px solid ${
                    colors[(idx + 2) % colors.length]
                  }">
                    <h3>${edu.studyType || "Degree"} in ${
                      edu.area || "Field"
                    }</h3>
                    <p class="company">${edu.institution || "Institution"}</p>
                    <p class="date">${formatDate(
                      edu.startDate,
                      edu.endDate
                    )}</p>
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
              <section class="colorful-section" style="border-top: 4px solid ${
                colors[2]
              }">
                <h2>Skills</h2>
                <div class="skill-badges">
                  ${data.skills
                    .map(
                      (skill, idx) => `
                    <span class="badge" style="background: ${
                      colors[idx % colors.length]
                    }">${skill.name}</span>
                  `
                    )
                    .join("")}
                </div>
              </section>
            `
                : ""
            }

            ${
              data.projects && data.projects.length
                ? `
              <section class="colorful-section" style="border-top: 4px solid ${
                colors[3]
              }">
                <h2>Projects</h2>
                ${data.projects
                  .map(
                    (proj, idx) => `
                  <div class="colorful-item" style="border-left: 3px solid ${
                    colors[(idx + 1) % colors.length]
                  }">
                    <h3>${proj.name || "Project"}</h3>
                    ${proj.summary ? `<p>${proj.summary}</p>` : ""}
                    ${
                      proj.keywords && proj.keywords.length
                        ? `<p class="project-tech"><strong>Tech:</strong> ${proj.keywords.join(
                            ", "
                          )}</p>`
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
          </div>
        </div>
      `;

      const css = `
        .resume-content.colorful {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .header-colorful {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .header-colorful h1 {
          font-size: 26px;
          margin: 0 0 5px 0;
          font-weight: 700;
        }
        .header-colorful p {
          margin: 0;
          font-size: 13px;
          opacity: 0.95;
        }
        .summary-box {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
          font-size: 12px;
          line-height: 1.5;
        }
        .colorful-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .colorful-section h2 {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 15px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .colorful-item {
          padding: 12px;
          padding-left: 15px;
          background: #fafafa;
          margin-bottom: 12px;
          border-radius: 4px;
        }
        .colorful-item h3 {
          font-size: 13px;
          margin: 0 0 3px 0;
          font-weight: 700;
        }
        .company {
          font-size: 11px;
          color: #666;
          margin: 0 0 3px 0;
        }
        .date {
          font-size: 10px;
          color: #999;
          margin: 0 0 8px 0;
        }
        .colorful-item p:not(.company):not(.date) {
          font-size: 11px;
          margin: 5px 0 0 0;
          line-height: 1.4;
        }
        .skill-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .badge {
          display: inline-block;
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        .project-tech {
          font-size: 11px;
          color: #666;
          margin: 8px 0 0 0;
          font-style: italic;
        }
      `;

      return { html, css };
    },
  },

  dark: {
    name: "Dark",
    render: (data) => {
      const formatDate = (start, end) => {
        if (!end)
          return start
            ? new Date(start).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "";
        return `${new Date(start).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })} - ${new Date(end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })}`;
      };

      const html = `
        <div class="resume-content cyberpunk-dark">
          <div class="cyberpunk-container">
            <div class="cyberpunk-header">
              <div class="header-border-top">╔═══════════════════════════════════════╗</div>
              <div class="header-content">
                <h1 class="name-glitch">${data.basics?.name || "Your Name"}</h1>
                <div class="title-line">█ ${(
                  data.basics?.label || "Professional"
                )
                  .split("|")[0]
                  .trim()}</div>
              </div>
              <div class="header-border-bottom">╚═══════════════════════════════════════╝</div>
            </div>

            <div class="data-sections">
              <div class="contact-block">
                <div class="block-header">▸ SYSTEM.PROFILE.ACTIVE</div>
                <div class="block-content">
                  ${
                    data.basics?.email
                      ? `<div class="data-line">Email ► <span class="neon-cyan">${data.basics.email}</span></div>`
                      : ""
                  }
                  ${
                    data.basics?.phone
                      ? `<div class="data-line">Phone ► <span class="neon-cyan">${data.basics.phone}</span></div>`
                      : ""
                  }
                </div>
              </div>

              ${
                data.work && data.work.length
                  ? `
                <div class="experience-block">
                  <div class="block-header">▸ EXPERIENCE_LOGS [${
                    data.work.length
                  }/${data.work.length}]</div>
                  <div class="block-content">
                    ${data.work
                      .map(
                        (job, idx) => `
                      <div class="entry-box">
                        <div class="entry-border">┌─ ${formatDate(
                          job.startDate,
                          job.endDate
                        )} ─┐</div>
                        <div class="entry-title"><span class="neon-magenta">[${
                          idx + 1
                        }]</span> ${job.position || "Position"}</div>
                        <div class="entry-subtitle">${
                          job.name || "Company"
                        }</div>
                        <div class="entry-desc indent">${(
                          job.summary || ""
                        ).substring(0, 120)}...</div>
                        <div class="entry-border">└────────────────────────┘</div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }

              ${
                data.education && data.education.length
                  ? `
                <div class="education-block">
                  <div class="block-header">▸ KNOWLEDGE_BASE [${
                    data.education.length
                  }/${data.education.length}]</div>
                  <div class="block-content">
                    ${data.education
                      .map(
                        (edu) => `
                      <div class="data-line">
                        <span class="neon-green">📚</span> ${
                          edu.studyType
                        } - <span class="neon-cyan">${edu.area}</span>
                      </div>
                      <div class="data-line indent">${
                        edu.institution
                      } (${formatDate(edu.startDate, edu.endDate)})</div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }

              ${
                data.skills && data.skills.length
                  ? `
                <div class="skills-block">
                  <div class="block-header">▸ CAPABILITIES [${
                    data.skills.length
                  }/7]</div>
                  <div class="block-content">
                    ${data.skills
                      .map(
                        (skill) => `
                      <div class="skill-line">
                        <span class="neon-magenta">[${skill.name}]</span>
                        <span class="skill-bar">████████████████</span>
                        <span class="neon-green">${
                          Array.isArray(skill.keywords)
                            ? skill.keywords.slice(0, 3).join(", ")
                            : ""
                        }</span>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }

              ${
                data.projects && data.projects.length
                  ? `
                <div class="projects-block">
                  <div class="block-header">▸ PROJECTS_INDEXED [${
                    data.projects.length
                  }/5]</div>
                  <div class="block-content">
                    ${data.projects
                      .map(
                        (proj, idx) => `
                      <div class="project-box">
                        <div class="project-title"><span class="neon-cyan">❱</span> ${
                          proj.name
                        }</div>
                        <div class="project-tech">tech: <span class="neon-magenta">${
                          Array.isArray(proj.keywords)
                            ? proj.keywords.join(", ")
                            : ""
                        }</span></div>
                        <div class="project-desc">${(
                          proj.summary || ""
                        ).substring(0, 100)}...</div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : ""
              }
            </div>

            <div class="footer-border">═══════════════════════════════════════════════════</div>
          </div>
        </div>
      `;

      const css = `
        .resume-content.cyberpunk-dark {
          background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 100%);
          color: #00ff00;
          font-family: 'Courier New', monospace;
          padding: 30px;
          min-height: 100vh;
        }

        .cyberpunk-container {
          background: #0d1117;
          border: 2px solid #00ff00;
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 20px rgba(0, 255, 0, 0.05);
          padding: 20px;
        }

        .cyberpunk-header {
          margin-bottom: 25px;
          text-align: center;
        }

        .header-border-top,
        .header-border-bottom {
          color: #00ffff;
          font-size: 12px;
          margin-bottom: 10px;
        }

        .header-border-bottom {
          margin-bottom: 0;
          margin-top: 10px;
        }

        .header-content {
          padding: 10px 0;
        }

        .name-glitch {
          font-size: 24px;
          font-weight: bold;
          color: #00ffff;
          margin: 0;
          text-shadow: 
            -2px 0 #ff00ff,
            2px 0 #00ff00,
            0 0 10px rgba(0, 255, 255, 0.5);
        }

        .title-line {
          color: #ff00ff;
          font-size: 13px;
          margin-top: 8px;
        }

        .data-sections {
          margin-bottom: 20px;
        }

        .contact-block,
        .experience-block,
        .education-block,
        .skills-block,
        .projects-block {
          margin-bottom: 20px;
          border: 1px solid #00ffff;
          background: rgba(0, 255, 255, 0.02);
        }

        .block-header {
          background: #1a1a2e;
          border-bottom: 1px solid #00ffff;
          padding: 8px 12px;
          color: #00ffff;
          font-size: 12px;
          font-weight: bold;
        }

        .block-content {
          padding: 12px;
          font-size: 12px;
        }

        .data-line {
          margin-bottom: 8px;
          color: #00ff00;
        }

        .data-line.indent {
          margin-left: 20px;
          color: #90ee90;
          font-size: 11px;
        }

        .entry-box {
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
        }

        .entry-box:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }

        .entry-border {
          color: #00ffff;
          font-size: 11px;
          margin-bottom: 4px;
        }

        .entry-title {
          color: #00ff00;
          font-weight: bold;
          margin-bottom: 3px;
        }

        .entry-subtitle {
          color: #ff00ff;
          font-size: 11px;
          margin-bottom: 4px;
        }

        .entry-desc {
          color: #90ee90;
          font-size: 11px;
        }

        .project-box {
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 255, 0, 0.2);
        }

        .project-title {
          color: #00ffff;
          font-weight: bold;
          margin-bottom: 3px;
        }

        .project-tech {
          color: #00ff00;
          font-size: 11px;
          margin-bottom: 3px;
        }

        .project-desc {
          color: #90ee90;
          font-size: 11px;
        }

        .skill-line {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 11px;
        }

        .skill-bar {
          color: #ff00ff;
        }

        .neon-green {
          color: #00ff00;
        }

        .neon-cyan {
          color: #00ffff;
        }

        .neon-magenta {
          color: #ff00ff;
        }

        .indent {
          margin-left: 20px;
        }

        .footer-border {
          text-align: center;
          color: #00ffff;
          font-size: 11px;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #00ffff;
        }

        @media print {
          .resume-content.cyberpunk-dark {
            background: white;
            color: #000;
            padding: 20px;
          }

          .cyberpunk-container {
            background: white;
            border: 1px solid #000;
            box-shadow: none;
          }

          .header-border-top,
          .header-border-bottom,
          .block-header,
          .entry-border,
          .footer-border,
          .name-glitch,
          .title-line,
          .data-line,
          .entry-title,
          .entry-subtitle,
          .project-title,
          .project-tech,
          .neon-green,
          .neon-cyan,
          .neon-magenta {
            color: #000;
          }

          .contact-block,
          .experience-block,
          .education-block,
          .skills-block,
          .projects-block {
            border-color: #000;
            background: white;
          }

          .block-header {
            border-bottom-color: #000;
          }
        }
      `;

      return { html, css };
    },
  },

  ats: {
    name: "ATS-Friendly",
    render: (data) => {
      const formatDate = (start, end) => {
        if (!end)
          return start
            ? new Date(start).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "";
        return `${new Date(start).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })} - ${new Date(end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })}`;
      };

      const html = `
        <div class="resume-content ats">
          <h1>${data.basics?.name || "Your Name"}</h1>
          <p class="title">${data.basics?.label || "Professional"}</p>
          <p class="contact">${[
            data.basics?.email,
            data.basics?.phone,
            data.basics?.location,
          ]
            .filter(Boolean)
            .join(" | ")}</p>

          ${
            data.basics?.summary
              ? `
            <h2>PROFESSIONAL SUMMARY</h2>
            <p>${data.basics.summary}</p>
          `
              : ""
          }

          ${
            data.work && data.work.length
              ? `
            <h2>PROFESSIONAL EXPERIENCE</h2>
            ${data.work
              .map(
                (job) => `
              <h3>${job.position || "Position"}</h3>
              <p>${job.name || "Company"} | ${formatDate(
                  job.startDate,
                  job.endDate
                )}</p>
              ${job.summary ? `<p>${job.summary}</p>` : ""}
            `
              )
              .join("")}
          `
              : ""
          }

          ${
            data.education && data.education.length
              ? `
            <h2>EDUCATION</h2>
            ${data.education
              .map(
                (edu) => `
              <h3>${edu.studyType || "Degree"} in ${edu.area || "Field"}</h3>
              <p>${edu.institution || "Institution"} | ${formatDate(
                  edu.startDate,
                  edu.endDate
                )}</p>
            `
              )
              .join("")}
          `
              : ""
          }

          ${
            data.skills && data.skills.length
              ? `
            <h2>SKILLS</h2>
            <p>${data.skills
              .map(
                (s) =>
                  `${s.name}${
                    Array.isArray(s.keywords) && s.keywords.length
                      ? `: ${s.keywords.join(", ")}`
                      : ""
                  }`
              )
              .join(" | ")}</p>
          `
              : ""
          }

          ${
            data.projects && data.projects.length
              ? `
            <h2>PROJECTS</h2>
            ${data.projects
              .map(
                (proj) => `
              <h3>${proj.name || "Project"}</h3>
              ${proj.summary ? `<p>${proj.summary}</p>` : ""}
              ${
                proj.keywords && proj.keywords.length
                  ? `<p><strong>Technologies:</strong> ${proj.keywords.join(
                      ", "
                    )}</p>`
                  : ""
              }
            `
              )
              .join("")}
          `
              : ""
          }
        </div>
      `;

      const css = `
        .resume-content.ats {
          font-family: 'Times New Roman', serif;
          color: #000;
          line-height: 1.5;
          font-size: 12px;
          background: #ffffff;
          padding: 40px;
          border-radius: 8px;
        }
        .resume-content.ats h1 {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 5px 0;
        }
        .resume-content.ats h2 {
          font-size: 12px;
          font-weight: 700;
          margin: 12px 0 6px 0;
          text-transform: uppercase;
        }
        .resume-content.ats h3 {
          font-size: 11px;
          font-weight: 700;
          margin: 8px 0 2px 0;
        }
        .resume-content.ats p {
          margin: 2px 0;
          font-size: 11px;
        }
        .title {
          font-size: 11px;
          margin: 0;
        }
        .contact {
          font-size: 10px;
          margin-bottom: 10px;
          word-break: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
      `;

      return { html, css };
    },
  },

  academic: {
    name: "Academic",
    render: (data) => {
      const formatDate = (start, end) => {
        if (!end)
          return start
            ? new Date(start).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "";
        return `${new Date(start).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })} - ${new Date(end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })}`;
      };

      const html = `
        <div class="resume-content academic">
          <h1 class="name">${data.basics?.name || "Your Name"}</h1>
          <p class="academic-title">${data.basics?.label || "Scholar"}</p>

          ${
            data.basics?.summary
              ? `<div class="academic-section"><p>${data.basics.summary}</p></div>`
              : ""
          }

          ${
            data.education && data.education.length
              ? `
            <div class="academic-section">
              <h2>Education</h2>
              ${data.education
                .map(
                  (edu) => `
                <div class="academic-entry">
                  <p class="entry-title"><strong>${
                    edu.studyType || "Degree"
                  }</strong> in ${edu.area || "Field"}</p>
                  <p class="entry-institution">${
                    edu.institution || "Institution"
                  }</p>
                  <p class="entry-date">${formatDate(
                    edu.startDate,
                    edu.endDate
                  )}</p>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }

          ${
            data.work && data.work.length
              ? `
            <div class="academic-section">
              <h2>Academic & Professional Experience</h2>
              ${data.work
                .map(
                  (job) => `
                <div class="academic-entry">
                  <p class="entry-title"><strong>${
                    job.position || "Position"
                  }</strong></p>
                  <p class="entry-institution">${job.name || "Organization"}</p>
                  <p class="entry-date">${formatDate(
                    job.startDate,
                    job.endDate
                  )}</p>
                  ${
                    job.summary
                      ? `<p class="entry-desc">${job.summary}</p>`
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
            data.skills && data.skills.length
              ? `
            <div class="academic-section">
              <h2>Research Areas & Competencies</h2>
              <ul class="academic-list">
                ${data.skills
                  .map(
                    (skill) => `
                  <li>${skill.name}${
                      Array.isArray(skill.keywords) && skill.keywords.length
                        ? `: ${skill.keywords.slice(0, 3).join(", ")}`
                        : ""
                    }</li>
                `
                  )
                  .join("")}
              </ul>
            </div>
          `
              : ""
          }

          ${
            data.projects && data.projects.length
              ? `
            <div class="academic-section">
              <h2>Projects & Research</h2>
              ${data.projects
                .map(
                  (proj) => `
                <div class="academic-entry">
                  <p class="entry-title"><strong>${
                    proj.name || "Project"
                  }</strong></p>
                  ${
                    proj.summary
                      ? `<p class="entry-desc">${proj.summary}</p>`
                      : ""
                  }
                  ${
                    proj.keywords && proj.keywords.length
                      ? `<p class="entry-desc"><strong>Technologies:</strong> ${proj.keywords.join(
                          ", "
                        )}</p>`
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
            data.basics?.email || data.basics?.phone
              ? `
            <div class="academic-footer">
              <p>${[
                data.basics?.email,
                data.basics?.phone,
                data.basics?.location,
              ]
                .filter(Boolean)
                .join(" • ")}</p>
            </div>
          `
              : ""
          }
        </div>
      `;

      const css = `
        .resume-content.academic {
          font-family: 'Georgia', serif;
          color: #2c3e50;
          line-height: 1.6;
          background: #ffffff;
          padding: 40px;
          border-radius: 8px;
        }
        .name {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 5px 0;
          text-align: center;
        }
        .academic-title {
          text-align: center;
          font-size: 13px;
          color: #7f8c8d;
          margin: 0 0 15px 0;
          font-style: italic;
        }
        .academic-section {
          margin-bottom: 20px;
        }
        .academic-section h2 {
          font-size: 13px;
          font-weight: 700;
          margin: 15px 0 10px 0;
          border-bottom: 2px solid #2c3e50;
          padding-bottom: 5px;
        }
        .academic-entry {
          margin-bottom: 12px;
          padding-left: 10px;
        }
        .entry-title {
          font-size: 12px;
          margin: 0 0 3px 0;
          font-weight: 700;
        }
        .entry-institution {
          font-size: 11px;
          color: #555;
          margin: 0 0 2px 0;
          font-style: italic;
        }
        .entry-date {
          font-size: 10px;
          color: #999;
          margin: 0 0 5px 0;
        }
        .entry-desc {
          font-size: 11px;
          margin: 5px 0 0 0;
          line-height: 1.4;
        }
        .academic-list {
          margin: 0;
          padding-left: 20px;
          font-size: 11px;
        }
        .academic-list li {
          margin-bottom: 5px;
        }
        .academic-footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #bdc3c7;
          text-align: center;
          font-size: 10px;
          color: #7f8c8d;
        }
      `;

      return { html, css };
    },
  },

  corporate: {
    name: "Corporate",
    render: (data) => {
      const formatDate = (start, end) => {
        if (!end)
          return start
            ? new Date(start).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
              })
            : "";
        return `${new Date(start).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })} - ${new Date(end).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })}`;
      };

      const html = `
        <div class="resume-content corporate">
          <div class="corp-sidebar">
            <div class="corp-header">
              <h1>${data.basics?.name || "Your Name"}</h1>
              <p>${data.basics?.label || "Professional"}</p>
            </div>

            ${
              [
                data.basics?.email,
                data.basics?.phone,
                data.basics?.location,
              ].filter(Boolean).length
                ? `
              <div class="corp-contact">
                <h3>Contact</h3>
                ${data.basics?.email ? `<p>${data.basics.email}</p>` : ""}
                ${data.basics?.phone ? `<p>${data.basics.phone}</p>` : ""}
                ${data.basics?.location ? `<p>${data.basics.location}</p>` : ""}
              </div>
            `
                : ""
            }

            ${
              data.skills && data.skills.length
                ? `
              <div class="corp-skills">
                <h3>Core Competencies</h3>
                ${data.skills
                  .slice(0, 6)
                  .map(
                    (skill) => `
                  <div class="corp-skill">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-bar"></div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            `
                : ""
            }
          </div>

          <div class="corp-main">
            ${
              data.basics?.summary
                ? `
              <section class="corp-section">
                <h2>Executive Profile</h2>
                <p>${data.basics.summary}</p>
              </section>
            `
                : ""
            }

            ${
              data.work && data.work.length
                ? `
              <section class="corp-section">
                <h2>Professional Experience</h2>
                ${data.work
                  .map(
                    (job) => `
                  <div class="corp-job">
                    <div class="job-header">
                      <h3>${job.position || "Position"}</h3>
                      <span>${formatDate(job.startDate, job.endDate)}</span>
                    </div>
                    <p class="job-company">${job.name || "Company"}</p>
                    ${
                      job.summary
                        ? `<p class="job-desc">${job.summary}</p>`
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
              <section class="corp-section">
                <h2>Education & Certifications</h2>
                ${data.education
                  .map(
                    (edu) => `
                  <div class="corp-edu">
                    <p><strong>${edu.studyType || "Degree"}</strong> in ${
                      edu.area || "Field"
                    }</p>
                    <p>${edu.institution || "Institution"} • ${formatDate(
                      edu.startDate,
                      edu.endDate
                    )}</p>
                  </div>
                `
                  )
                  .join("")}
              </section>
            `
                : ""
            }

            ${
              data.projects && data.projects.length
                ? `
              <section class="corp-section">
                <h2>Projects</h2>
                ${data.projects
                  .map(
                    (proj) => `
                  <div class="corp-job">
                    <h3>${proj.name || "Project"}</h3>
                    ${
                      proj.summary
                        ? `<p class="job-desc">${proj.summary}</p>`
                        : ""
                    }
                    ${
                      proj.keywords && proj.keywords.length
                        ? `<p class="job-desc"><strong>Technologies:</strong> ${proj.keywords.join(
                            ", "
                          )}</p>`
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
          </div>
        </div>
      `;

      const css = `
        .resume-content.corporate {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #ffffff;
          padding: 20px;
          border-radius: 8px;
        }
        .corp-sidebar {
          background: #f8f9fa;
          padding: 20px;
          border-right: 3px solid #003366;
          overflow-x: hidden;
        }
        .corp-header {
          margin-bottom: 20px;
          border-bottom: 2px solid #003366;
          padding-bottom: 15px;
        }
        .corp-header h1 {
          font-size: 20px;
          margin: 0 0 5px 0;
          color: #003366;
          font-weight: 700;
        }
        .corp-header p {
          font-size: 12px;
          color: #666;
          margin: 0;
        }
        .corp-contact {
          margin-bottom: 20px;
        }
        .corp-contact h3, .corp-skills h3 {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #003366;
          margin: 0 0 8px 0;
        }
        .corp-contact p {
          font-size: 10px;
          margin: 3px 0;
          color: #555;
          word-break: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
        .corp-skills {
          margin-bottom: 20px;
        }
        .corp-skill {
          margin-bottom: 8px;
        }
        .skill-name {
          font-size: 10px;
          font-weight: 600;
          margin-bottom: 3px;
        }
        .skill-bar {
          height: 6px;
          background: linear-gradient(90deg, #003366 60%, #ddd 60%);
          border-radius: 3px;
        }
        .corp-main {
          padding: 10px;
        }
        .corp-section {
          margin-bottom: 20px;
        }
        .corp-section h2 {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #003366;
          margin: 0 0 10px 0;
          border-bottom: 2px solid #003366;
          padding-bottom: 5px;
        }
        .corp-section > p {
          font-size: 11px;
          line-height: 1.5;
          margin: 0;
        }
        .corp-job {
          margin-bottom: 12px;
        }
        .job-header {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .corp-job h3 {
          font-size: 12px;
          margin: 0;
          font-weight: 700;
        }
        .job-header span {
          font-size: 10px;
          color: #999;
          flex-shrink: 0;
        }
        .job-company {
          font-size: 11px;
          color: #666;
          margin: 2px 0 5px 0;
          font-weight: 600;
        }
        .job-desc {
          font-size: 10px;
          line-height: 1.4;
          margin: 5px 0 0 0;
        }
        .corp-edu {
          margin-bottom: 8px;
        }
        .corp-edu p {
          font-size: 10px;
          margin: 2px 0;
        }
        .corp-edu p strong {
          font-weight: 700;
        }
      `;

      return { html, css };
    },
  },
};

function renderTemplate(templateName, resumeData) {
  const template = TEMPLATES[templateName];
  if (!template) {
    console.error(`Template "${templateName}" not found`);
    return { html: "<p>Template not found</p>", css: "" };
  }
  return template.render(resumeData);
}
