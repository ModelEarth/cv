(function () {
  function getParam(name, fallback) {
    return new URLSearchParams(location.search).get(name) ?? fallback;
  }

  const jsonFile = getParam("resume", "detailed.json");

  async function loadResume() {
    try {
      const res = await fetch(jsonFile, { cache: "no-store" });
      if (!res.ok) throw new Error("JSON not found");
      return await res.json();
    } catch (err) {
      console.error(err);
      document.getElementById("resumeContainer").innerHTML =
        "<p style='color:red;'>Failed to load resume JSON.</p>";
    }
  }

  function esc(v) {
    return (v || "").toString();
  }

  function renderResume(data) {
    const b          = data.basics       || {};
    const work       = data.work         || [];
    const edu        = data.education    || [];
    const skills     = data.skills       || [];
    const projects   = data.projects     || [];
    const certs      = data.certifications || [];
    const langs      = data.languages    || [];
    const profiles   = data.profiles     || [];

    const c = document.getElementById("resumeContainer");

    const contactLines = [];
    if (b.email) contactLines.push(b.email);
    if (b.url)   contactLines.push(b.url);
    profiles.forEach(p => {
      if (p.url) contactLines.push(p.network + ": " + p.url);
    });

    c.innerHTML = `
      <div class="header">
        <div>
          <h1 class="name">${esc(b.name)}</h1>
          ${b.label ? `<div class="label">${esc(b.label)}</div>` : ""}
        </div>
        <div class="contact">
          ${contactLines.map(esc).join("<br>")}
        </div>
      </div>

      <div class="layout">
        <div class="col-main">
          <section class="section">
            <h2 class="section-title">Summary</h2>
            <div class="summary-text">${esc(b.summary)}</div>
          </section>

          <section class="section">
            <h2 class="section-title">Experience</h2>
            ${work.map(w => `
              <div class="item">
                <div class="item-title">${esc(w.position)}</div>
                <div class="item-sub">${esc(w.company)}</div>
                <div class="item-summary">${esc(w.summary)}</div>
              </div>
            `).join("")}
          </section>

          <section class="section">
            <h2 class="section-title">Projects</h2>
            ${projects.map(p => `
              <div class="item pill-section">
                <div class="item-title">${esc(p.name)}</div>
                <div class="item-summary">${esc(p.summary)}</div>
                ${p.keywords && p.keywords.length ? `
                  <div class="chips">
                    ${p.keywords.map(k => `<span class="chip">${esc(k)}</span>`).join("")}
                  </div>` : ""}
              </div>
            `).join("")}
          </section>
        </div>

        <div class="col-side">
          <section class="section">
            <h2 class="section-title">Skills</h2>
            ${skills.map(s => `
              <div class="item">
                <div class="item-title">${esc(s.name)}</div>
                <div class="chips">
                  ${(s.keywords || []).map(k => `<span class="chip">${esc(k)}</span>`).join("")}
                </div>
              </div>
            `).join("")}
          </section>

          <section class="section">
            <h2 class="section-title">Education</h2>
            ${edu.map(e => `
              <div class="item">
                <div class="item-title">${esc(e.studyType)} — ${esc(e.area)}</div>
                <div class="item-sub">${esc(e.institution)}${e.location ? " · " + esc(e.location) : ""}</div>
              </div>
            `).join("")}
          </section>

          ${certs.length ? `
            <section class="section">
              <h2 class="section-title">Certifications</h2>
              ${certs.map(cer => `
                <div class="item-sub">• ${esc(cer.name)}</div>
              `).join("")}
            </section>` : ""}

          ${langs.length ? `
            <section class="section">
              <h2 class="section-title">Languages</h2>
              ${langs.map(l => `
                <div class="item-sub">• ${esc(l.language)}${l.fluency ? " — " + esc(l.fluency) : ""}</div>
              `).join("")}
            </section>` : ""}
        </div>
      </div>
    `;
  }

  (async function init() {
    const data = await loadResume();
    if (data) renderResume(data);
  })();
})();
