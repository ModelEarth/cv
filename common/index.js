(function () {
  function getParam(name, fallback) {
    return new URLSearchParams(location.search).get(name) ?? fallback;
  }

  function esc(v) {
    return (v || "").toString();
  }

  function toHref(url) {
    if (!url) return url;
    const s = url.trim();
    // Already has a scheme
    if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(s)) return s;
    // Relative path, root-relative, or local IP — leave alone
    if (s.startsWith('/') || s.startsWith('.') || /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(s)) return s;
    // Looks like a domain (contains a dot before any slash)
    const slashIdx = s.indexOf('/');
    const dotIdx = s.indexOf('.');
    if (dotIdx !== -1 && (slashIdx === -1 || dotIdx < slashIdx)) return 'https://' + s;
    return s;
  }

  function renderSection(title, content) {
    if (!content || !content.trim()) return "";
    return `
      <div class="section">
        <div class="section-title">${title}</div>
        ${content}
      </div>
    `;
  }

  function renderResume(data) {
    const b = data.basics || {};
    const work = data.work || [];
    const edu = data.education || [];
    const skills = data.skills || [];
    const projects = data.projects || [];
    const certs = data.certifications || data.certificates || [];
    const langs = data.languages || [];
    const profiles = b.profiles || data.profiles || [];

    const c = document.getElementById("resumeContainer");

    // Normalise location to a plain string (handles both string and JSON Resume object)
    const locationStr = typeof b.location === 'object' && b.location
      ? [b.location.city, b.location.region, b.location.countryCode || b.location.country].filter(Boolean).join(', ')
      : (b.location || '');
    const locationShort = locationStr && locationStr.length < 50;

    // Build contact items as real elements (not text nodes)
    const contactItems = [];
    if (b.email) contactItems.push(`<a href="mailto:${esc(b.email)}">${esc(b.email)}</a>`);
    if (b.url) contactItems.push(`<a href="${esc(toHref(b.url))}" target="_blank" rel="noopener">${esc(b.url)}</a>`);
    profiles.forEach(p => {
      if (p.url) {
        contactItems.push(`<a href="${esc(toHref(p.url))}" target="_blank" rel="noopener">${esc(p.network || p.url)}</a>`);
      } else if (p.display) {
        contactItems.push(`<span class="contact-extra">${esc(p.display)}</span>`);
      }
    });
    if (b.phone) contactItems.push(`<span class="contact-phone">${esc(b.phone)}</span>`);
    if (locationShort) contactItems.push(`<span class="contact-location">${esc(locationStr)}</span>`);

    c.innerHTML = `
      <div class="containingDiv">
        <div class="top-row">
          <div class="top-main">
            <h1 class="name">${esc(b.name)}</h1>
            ${b.label ? `<div class="label">${esc(b.label)}</div>` : ""}
            ${!locationShort && locationStr ? `<div class="location-long">${esc(locationStr)}</div>` : ""}
          </div>
          <div class="top-side">
            ${contactItems.map(item => `<div class="contact-item${item.includes('contact-phone') || item.includes('contact-location') ? ' contact-item-meta' : ''}">${item}</div>`).join("")}
          </div>
        </div>

        <div class="layout">
          <div class="col-main">
            ${renderSection("Summary", b.summary ? `<div class="summary-text">${esc(b.summary)}</div>` : "")}

            ${renderSection("Experience", work.map(w => {
      const org = esc(w.organization || w.company);
      const dates = w.startDate ? ` · ${esc(w.startDate)} – ${esc(w.endDate || "Present")}` : "";
      const highlights = (w.highlights || []).length
        ? `<ul style="margin:4px 0 0 16px;padding:0;font-size:13px;color:var(--text-main);">${w.highlights.map(h => `<li>${esc(h)}</li>`).join("")}</ul>`
        : "";
      return `
                <div class="item">
                  <div class="item-title">${esc(w.position)}</div>
                  <div class="item-sub">${org}${dates}</div>
                  <div class="item-summary">${esc(w.summary)}</div>
                  ${highlights}
                </div>`;
    }).join(""))}

            ${renderSection("Projects", projects.map(p => `
                <div class="item pill-section">
                  <div class="item-title">${esc(p.name)}</div>
                  <div class="item-summary">${esc(p.summary)}</div>
                  ${p.keywords && p.keywords.length ? `
                    <div class="chips">
                      ${p.keywords.map(k => `<span class="chip">${esc(k)}</span>`).join("")}
                    </div>` : ""}
                </div>`).join(""))}
          </div>

          <div class="col-side">
            ${renderSection("Skills", skills.map(s => `
                <div class="item">
                  <div class="item-title">${esc(s.name)}</div>
                  <div class="chips">
                    ${(s.keywords || []).map(k => `<span class="chip">${esc(k)}</span>`).join("")}
                  </div>
                </div>`).join(""))}

            ${renderSection("Education", edu.map(e => `
                <div class="item">
                  <div class="item-title">${esc(e.studyType)} — ${esc(e.area)}</div>
                  <div class="item-sub">${esc(e.institution)}${e.location ? " · " + esc(e.location) : ""}</div>
                </div>`).join(""))}

            ${renderSection("Certifications", certs.map(cer => `
                <div class="item-sub">• ${esc(cer.name)}</div>`).join(""))}

            ${renderSection("Languages", langs.map(l => `
                <div class="item-sub">• ${esc(l.language)}${l.fluency ? " — " + esc(l.fluency) : ""}</div>`).join(""))}
          </div>
        </div>
      </div>
    `;
  }

  async function loadAndRender(jsonFile, callback) {
    const c = document.getElementById("resumeContainer");
    if (c) c.innerHTML = "Loading theme\u2026";
    try {
      let data;
      if (jsonFile.startsWith("data:")) {
        const base64Match = jsonFile.match(/data:application\/json[^,]*,(.+)/);
        if (base64Match) {
          data = JSON.parse(decodeURIComponent(base64Match[1]));
        }
      } else {
        const res = await fetch(jsonFile, { cache: "no-store" });
        if (!res.ok) throw new Error("JSON not found");
        data = await res.json();
      }
      if (data) renderResume(data);
      if (typeof callback === "function") callback();
    } catch (err) {
      console.error(err);
      if (c) c.innerHTML = "<p style='color:red;'>Failed to load resume JSON.</p>";
    }
  }

  // Public API — called by filters.js via loadScript()
  window.CVRenderer = {
    render: function (jsonFile, callback) {
      const file = jsonFile || window.cvResumeFile || getParam("resume", "detailed.json");
      loadAndRender(file, callback);
    }
  };

})();
