// Test project extraction from resume

const projectText = `Shopping System | Java, Spring Boot, MySQL • E-commerce platform with payment gateway integration • User authentication and authorization • Real-time inventory management

Payment Gateway | Node.js, Express, MongoDB • Secure payment processing system • API endpoint development • Database optimization

Inventory Management | Python, Flask, PostgreSQL • Track inventory across warehouses • Real-time stock updates • Admin dashboard for analytics`;

// Copy the parseProjects function from app.js
function parseProjects(text) {
  if (!text) return [];

  const projects = [];

  // Split by project titles - typically "Project Name | Technology keywords"
  // Looking for: Capital words | tech, tech, tech
  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  let currentProject = null;
  let currentDescription = [];

  for (const line of lines) {
    // Check if this line has a project title (contains pipe and starts with capital)
    if (line.includes("|") && /^[A-Z]/.test(line.trim())) {
      // This is a project header line

      // Save previous project if exists
      if (currentProject) {
        currentProject.summary = currentDescription
          .join(" ")
          .replace(/•/g, "→") // Replace bullets with arrow for readability
          .replace(/\s+/g, " ") // Collapse spaces
          .trim();
        projects.push(currentProject);
      }

      // Parse new project
      const [titlePart, techPart] = line.split("|");
      const titleMatch = titlePart
        .trim()
        .match(/^([A-Za-z0-9\s\-&()]+?)(?:\s*$)/);
      const title = titleMatch ? titleMatch[1].trim() : titlePart.trim();

      const keywords = techPart
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s !== "•");

      currentProject = {
        name: title,
        keywords: keywords,
        summary: "",
      };
      currentDescription = [];
    } else if (currentProject && line.trim().length > 0) {
      // This is description line
      const cleanLine = line
        .trim()
        .replace(/^•\s*/, "") // Remove leading bullet
        .replace(/\s+/g, " "); // Collapse spaces

      if (cleanLine.length > 0) {
        currentDescription.push(cleanLine);
      }
    }
  }

  // Save last project
  if (currentProject) {
    currentProject.summary = currentDescription
      .join(" ")
      .replace(/•/g, "→")
      .replace(/\s+/g, " ")
      .trim();
    projects.push(currentProject);
  }

  return projects;
}

const result = parseProjects(projectText);
console.log("Projects extracted:");
console.log(JSON.stringify(result, null, 2));
