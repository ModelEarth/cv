# Template Enhancement Implementation Guide

## Overview

This guide details the structural changes needed for each template to make them visually distinctive while keeping the JSON data consumption identical.

**Constraint:** Each template receives the same JSON structure and must render it. Only the HTML layout and CSS styling change.

---

## Template-by-Template Enhancement Plan

### 1. TECH Template (Line 834)

**Current State:** Basic layout with tech colors  
**Real-World Inspiration:** GitHub/Developer Platform (CLI aesthetic)

#### Structural Changes

```
NEW LAYOUT:
┌─────────────────────────────────┐
│ $ ./resume --version            │
│ $ Shanmuga Priya Kannan v1.0    │
├─────────────────────────────────┤
│ > whoami                        │
│ Senior ServiceNow Developer     │
│                                 │
│ > ./experience.log              │
│ [2020-2023] Cognizant Tech.     │
│ [REST APIs] [ITSM] [CMDB]       │
│                                 │
│ > ls -la /skills                │
│ -rw-r--r-- languages/           │
│ -rw-r--r-- tools/               │
│ -rw-r--r-- platforms/           │
│                                 │
│ > ./portfolio/projects          │
│ [1] Shopping System [Java]      │
│ [2] Market Analysis [Python]    │
└─────────────────────────────────┘
```

#### CSS Elements to Add

- Monospace font: `font-family: 'Courier New', monospace`
- Dark background: `#0d1117`
- Neon green text: `#39ff14` or `#00ff00`
- Terminal border: `border: 2px solid #39ff14`
- Terminal prompt: `> ` prefix on sections
- Code block styling: `<pre>` style sections
- Line numbers for code blocks
- Blinking cursor effect (subtle)

#### HTML Structure

- Wrap in `.terminal-emulator` div
- Use `<pre>` for code sections
- Add `$` and `>` prompts before section headers
- Structure skills as command output
- Projects as indexed list `[1]`, `[2]`, etc.

---

### 2. DARK Template (Line 1832)

**Current State:** Dark background with minimal contrast  
**Real-World Inspiration:** Cyberpunk/Hacker aesthetic

#### Structural Changes

```
NEW LAYOUT:
╔═════════════════════════════════╗
║ █ SHANMUGA PRIYA KANNAN         ║ ← neon border
║ ╔────────────────────────────╗  ║
║ ║ SYSTEM.PROFILE.ACTIVE      ║  ║
║ ╠────────────────────────────╣  ║
║ ║ EXPERIENCE LOGS            ║  ║
║ ║ ┌─ 2020→2023 COGNIZANT ─┐  ║  ║
║ ║ │ [ITSM] [REST API]  ✦   │  ║  ║
║ ║ └────────────────────────┘  ║  ║
║ ║                              ║  ║
║ ║ KNOWLEDGE_BASE [7/7]        ║  ║
║ ║ ░░░░░░░░░░░░░░░░░░░░░░░░░░  ║  ║
║ ║ PROJECTS INDEXED [5/5]      ║  ║
║ ║ ▸ Shopping System            ║  ║
║ ║ ▸ Market Analysis [ACTIVE]   ║  ║
║ ╚════════════════════════════╝  ║
╚═════════════════════════════════╝
```

#### CSS Elements to Add

- Nested borders: Multiple `border` layers
- Neon accents: Cyan `#00ffff`, Magenta `#ff00ff`, Green `#00ff00`
- Progress bars: ASCII-style `▓▒░` or CSS `linear-gradient`
- Glitch effect: Text shadow duplicates offset slightly
- Grid background: Subtle repeating pattern
- Box symbols: ╔ ╗ ║ ═ etc. using Unicode (or CSS borders)
- Header with centered logo/text
- Nested sections with bracket decorations
- Status indicators: `[ACTIVE]`, `[INDEXED]`

#### HTML Structure

- `.cyberpunk-container` wrapper
- `.data-section` for each major area
- `.connection-status` elements
- `.skill-graph` for progress bars
- `.access-level` badges
- Status indicators as span elements

---

### 3. MODERN Template (Line 250)

**Current State:** Two-column layout exists but needs enhancement  
**Real-World Inspiration:** Design Studio Portfolio (sidebar focus)

#### Structural Changes

```
NEW LAYOUT:
┌──────────────────────────────────────────┐
│ ┌──────────────┬─────────────────────┐   │
│ │ SIDE         │  MAIN CONTENT       │   │
│ │ ─────────    │  ─────────────────  │   │
│ │              │                     │   │
│ │ SHANMUGA     │  Senior SN Dev      │   │
│ │ PRIYA        │  [3+ years]         │   │
│ │              │                     │   │
│ │ ✓ Skills     │  EXPERIENCE         │   │
│ │ Languages    │  ┌─────────────────┐│   │
│ │ • C/C++      │  │ 2020-2023       ││   │
│ │ • Java       │  │ Cognizant       ││   │
│ │ • Python     │  │ [30+ workflows] ││   │
│ │              │  └─────────────────┘│   │
│ │ Web Dev      │                     │   │
│ │ • HTML/CSS   │  EDUCATION          │   │
│ │ • JavaScript │  ┌─────────────────┐│   │
│ │              │  │ Master's (2025) ││   │
│ │ Tools        │  │ DePaul Chicago  ││   │
│ │ • Git        │  │ CS              ││   │
│ │ • Docker     │  │                 ││   │
│ │ • AWS        │  │ Bachelor's      ││   │
│ │              │  │ (2020) Velammal ││   │
│ │ Education    │  │ Chennai         ││   │
│ │              │  └─────────────────┘│   │
│ │ PROJECTS     │                     │   │
│ │ [5 projects] │  PROJECTS [5/5]    │   │
│ │              │  ┌─────────────────┐│   │
│ └──────────────┴──┤ 1. Shopping Sys ││   │
│                   │ Java, Eclipse   ││   │
│                   │ Auth + Catalog  ││   │
│                   └─────────────────┘│   │
└──────────────────────────────────────────┘
```

#### CSS Elements to Add

- True 2-column layout: `.sidebar` + `.main-content`
- Sidebar width: 28-30%
- Colored sidebar background: accent color (accent: #3498db or similar)
- Sidebar styling: All skills + education sidebar (currently missing)
- Main content: Work, Projects, Summary
- Skill badges with small icons/circles
- Entry cards with subtle shadows/borders
- Accent color bar on left of entries
- Different text hierarchy for sidebar vs main
- Sticky header for sidebar (optional)

#### HTML Structure

- Restructure into true 2-column grid
- Move education to sidebar
- Reorganize skills on sidebar with categories
- Use card-based layout for work entries
- Add visual separators
- Icon-like elements for skill categories

---

### 4. CREATIVE Template (Line 551)

**Current State:** Basic layout with creative colors  
**Real-World Inspiration:** Behance Portfolio (card-based, hero sections)

#### Structural Changes

```
NEW LAYOUT:
┌─────────────────────────────────────────┐
│ ╔═════════════════════════════════════╗ │
│ ║ SHANMUGA PRIYA KANNAN              ║ │
│ ║ Senior ServiceNow Developer        ║ │ ← Hero card
│ ║ ──────────────────────────────────  ║ │
│ ║ [Contact] [LinkedIn]               ║ │
│ ╚═════════════════════════════════════╝ │
│                                         │
│ ╔════════════╗ ╔════════════╗          │
│ ║ 3+ YEARS   ║ ║ 5 PROJECTS ║          │ ← Stats cards
│ ║ EXPERIENCE ║ ║ COMPLETED  ║          │
│ ╚════════════╝ ╚════════════╝          │
│                                         │
│ ╔═════════════════════════════════════╗ │
│ ║ EXPERIENCE                          ║ │
│ ║ ──────────────────────────────────  ║ │
│ ║ 2020 → 2023                         ║ │
│ ║ Senior ServiceNow Developer         ║ │
│ ║ Cognizant Technology Solutions      ║ │
│ ║ ──────────────────────────────────  ║ │
│ ║ • 30+ custom workflows              ║ │
│ ║ • REST API development              ║ │
│ ║ • 600+ incidents resolved           ║ │
│ ╚═════════════════════════════════════╝ │
│                                         │
│ ╔═════════════╗ ╔═════════════╗        │
│ ║ Shopping    ║ ║ Market      ║ ← Project cards
│ ║ System      ║ ║ Analysis    ║
│ ║ Java        ║ ║ Excel, R    ║
│ ║ ─────────   ║ ║ ─────────   ║
│ ║ Auth + Cat  ║ ║ App Trends  ║
│ ╚═════════════╝ ╚═════════════╝        │
│                                         │
│ ╔═════════════════════════════════════╗ │
│ ║ SKILLS GRID                         ║ │
│ ║ ──────────────────────────────────  ║ │
│ ║ [Programming] [Web Dev] [Tools]     ║ │
│ ║ [Data & Analytics] [ML] [ServiceNow]║ │
│ ╚═════════════════════════════════════╝ │
└─────────────────────────────────────────┘
```

#### CSS Elements to Add

- Card-based layout with `.card` class
- Hero section at top: Large, centered, prominent
- Statistics cards: 2-3 key metrics
- Work entry cards: Full-width card per job
- Project cards: 2-3 per row grid
- Skill cards: Flex grid, badge-style
- Card shadows: `box-shadow: 0 10px 30px rgba(0,0,0,0.1)`
- Accent color bars: Top border on cards
- Hero card: Gradient background or different styling
- Rounded corners: `border-radius: 8px` consistently
- Spacing: Generous padding/margins between sections

#### HTML Structure

- `.creative-hero` section at top
- `.stats-row` with key metrics
- `.card` wrapper for each entry
- `.project-grid` with 2-3 columns
- `.skills-grid` with flexible layout
- Each card has icon/accent area
- Distinct visual hierarchy with card emphasis

---

### 5. EXECUTIVE Template (Line 1029)

**Current State:** Formal layout  
**Real-World Inspiration:** Corporate Annual Report (formal, prestigious)

#### Structural Changes

```
NEW LAYOUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        EXECUTIVE PROFILE — 2024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SHANMUGA PRIYA KANNAN
Senior ServiceNow Developer
Cognizant Technology Solutions

───────────────────────────────────────────

EXECUTIVE SUMMARY

Professional with 3+ years of specialized experience in
enterprise IT service management and business process
automation. Proven track record in:
• Leading technical initiatives across multiple platforms
• Delivering complex enterprise solutions
• Managing cross-functional teams and stakeholder relationships

───────────────────────────────────────────

PROFESSIONAL EXPERIENCE

[2020–2023]
SENIOR SERVICENOW DEVELOPER
Cognizant Technology Solutions | Remote

Key Achievements:
• Developed 30+ custom workflows for ITSM optimization
• Managed 600+ incidents with 95% resolution rate
• Integrated third-party systems (SAP, QlikView, Azure)
• Led technical design for 60+ client-facing features

Core Competencies: ITSM, CMDB, REST APIs, Flow Design

───────────────────────────────────────────

ACADEMIC CREDENTIALS

Master of Science in Computer Science
DePaul University, Chicago, USA (2023–2025)

Bachelor of Technology in Information Technology
Velammal Engineering College, Chennai, India (2016–2020)

───────────────────────────────────────────

PROFESSIONAL EXPERTISE

Technical Specializations:
Programming Languages: C/C++, Java, Python, R, SQL
Cloud & Infrastructure: AWS, GCP, Docker
Enterprise Platforms: ServiceNow, SAP, Jira

Data Science & Analytics:
Machine Learning | Big Data (Spark, Hadoop)
Data Analysis | Time Series Forecasting

───────────────────────────────────────────

NOTABLE PROJECTS [5 Completed]

1. NYC TAXI FARE PREDICTION PIPELINE
   Distributed ML pipeline processing 12M+ records
   Technologies: PySpark, AWS EMR, Athena

2. LUNG CANCER RISK PREDICTION
   Classification models on 220K+ dataset
   Achievement: 25% improvement in high-risk detection

[3-5 additional projects...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### CSS Elements to Add

- Formal typography: Serif fonts (Georgia, Times)
- Decorative lines: `border-top/bottom` with `━` or solid lines
- Section separators: Horizontal rules between sections
- Formal spacing: Generous line-height (1.8-2.0)
- Professional color: Dark navy/charcoal text on white/off-white
- Column layout: Possibly 2-column for sections
- Blockquotes or indented text for key achievements
- Roman numerals for numbering (optional)
- Letterhead-style header
- Page break friendly: Good for PDF export
- Conservative font sizes and weights

#### HTML Structure

- `.executive-header` with formal title
- `.executive-summary` section prominent
- `.section-separator` lines between sections
- `.achievement-list` for bullet accomplishments
- `.competencies` displayed as inline text
- `.credentials` section distinct from experience
- Professional organization of information
- Clear visual hierarchy with spacing

---

### 6. CLASSIC Template (Line 2)

**Current State:** Simple, clean layout  
**Real-World Inspiration:** LinkedIn Professional style

#### Enhancements

- **Current:** Already fairly professional
- **Enhance:** Add more visual hierarchy
- **Changes:**
  - Stronger header styling
  - Better skill category display (use badges/boxes)
  - Improved entry spacing
  - LinkedIn-like blue accent color
  - Date formatting more prominent
  - Better visual separation of sections

---

### 7. MINIMAL Template (Line 1452)

**Current State:** Basic minimal layout  
**Real-World Inspiration:** Japanese Zen aesthetic

#### Structural Changes

```
NEW LAYOUT:

SHANMUGA PRIYA KANNAN

Senior ServiceNow Developer


EXPERIENCE

2020  →  2023
        Senior ServiceNow Developer
        Cognizant Technology Solutions

        ITSM  REST API  CMDB


EDUCATION

2023  →  2025
        Master's in Computer Science
        DePaul University, Chicago

2016  →  2020
        Bachelor's in IT
        Velammal Engineering College, Chennai


CAPABILITIES

Programming Languages
C/C++ • Java • Python • R • SQL

Web Development
HTML/CSS • JavaScript • Node.js

Enterprise Tools
ServiceNow • AWS • Docker • Git


PROJECTS

Shopping System
Java, Eclipse
Developed authentication and product catalog

Market Analysis
Excel, Tableau, R
Analyzed app store data for trends

[3 more projects...]
```

#### CSS Elements

- Extreme whitespace: Large margins and padding
- Minimalist typography: Sans-serif, generous line-height
- No color: Pure grayscale (white, grays, black)
- No borders: Only spacing for separation
- Centered or slightly offset text
- Consistent left margins for structure
- Minimal font weights (mostly normal, some bold)
- Large breathing room between sections
- Zen-like balance and symmetry

---

### 8. COLORFUL Template (Line 1625)

**Current State:** Color-based design  
**Real-World Inspiration:** Vibrant Creative Carnival

#### Structural Changes

- **Multi-color scheme:** Different colors for each section
- **Background blocks:** Each section has background color
- **Skill bubbles:** Circular badges with different colors
- **Gradient accents:** Subtle gradients on section headers
- **Icon-like elements:** Small colored shapes
- **Rainbow progress bars:** For skill levels
- **Vibrant text:** Contrasting colors on colored backgrounds

---

### 9. COMPACT Template (Line 1261)

**Current State:** Dense layout  
**Real-World Inspiration:** Swiss Grid Design

#### Structural Changes

- **Rigid grid:** Strict alignment and spacing
- **Bullet points:** Extensive use for brevity
- **Columns:** 2-3 column layout
- **Consistent sizing:** Same font sizes across sections
- **Borders:** Thin lines for structure
- **Swiss typography:** Clean, geometric
- **Numbered sections:** Formal indexing
- **Minimal whitespace:** Professional density

---

### 10. ATS-FRIENDLY Template (Line 2049)

**Current State:** Meant to be searchable  
**Real-World Inspiration:** Government Form style

#### Structural Changes

```
NEW LAYOUT:

CANDIDATE INFORMATION

Name: Shanmuga Priya Kannan
Email: shanmugapriyakannan019@gmail.com
Phone: 872-330-3203
LinkedIn: https://www.linkedin.com/in/shanmuga-priya-k-95400a194

PROFESSIONAL SUMMARY

[Professional summary would go here - currently empty]

PROFESSIONAL EXPERIENCE

Position: Senior ServiceNow Developer
Organization: Cognizant Technology Solutions
Location: [Location]
Employment Period: June 2020 - August 2023
Employment Type: Full-time
Description:
[Full summary with all details]
Key Skills Used: ITSM, CMDB, REST APIs, ServiceNow, Flow Design, Integration

EDUCATION

Degree: Master's
Field of Study: Computer Science
Institution: DePaul University
Location: Chicago, USA
Graduation Date: June 2025

Degree: Bachelor's
Field of Study: Information Technology
Institution: Velammal Engineering College
Location: Chennai, India
Graduation Date: April 2020

TECHNICAL SKILLS

Category: Programming Languages
Skills: C/C++, Java, Python, R, SQL

Category: Web Development
Skills: HTML/CSS, JavaScript, Node.js

[More skill categories...]

PROJECTS

Project 1: Shopping System
Technologies Used: Java, Eclipse
Description: Developed user authentication and product catalog features
Date: [When completed]

[More projects...]
```

#### CSS Elements

- Pure semantic HTML: No special styling
- Black text on white background
- Consistent font: Monospace or Arial (ATS-friendly)
- Clear field labels: Bold or separated
- Simple line breaks: No fancy separators
- Table-like structure
- Good contrast ratio
- No images or graphics
- Keyword-rich plain text
- ATS scannable format

---

### 11. ACADEMIC Template (Line 2190)

**Current State:** CV-like layout  
**Real-World Inspiration:** University CV format

#### Structural Changes

```
NEW LAYOUT:

CURRICULUM VITAE

SHANMUGA PRIYA KANNAN
Email: shanmugapriyakannan019@gmail.com
Phone: 872-330-3203
LinkedIn: https://www.linkedin.com/in/shanmuga-priya-k

EDUCATIONAL BACKGROUND

Master of Science in Computer Science
DePaul University, Chicago, IL, USA
Graduation: June 2025
GPA: [Not provided]

Bachelor of Technology in Information Technology
Velammal Engineering College, Chennai, India
Graduation: April 2020
GPA: [Not provided]

PROFESSIONAL EXPERIENCE

Senior ServiceNow Developer
Cognizant Technology Solutions, [Location]
June 2020 – August 2023

• Developed REST APIs and 30+ custom workflows
• Integrated third-party tools (SAP, QlikView, Azure)
• Resolved 600+ incidents and service requests
• Managed development using Jira and agile cycles
• Deployed 60+ client-facing features

RESEARCH & PROJECT EXPERIENCE

1. Lung Cancer Risk Prediction Using ML
   Python, Jupyter Notebook, Excel
   • Built Naive Bayes, Random Forest, KNN classifiers
   • Dataset: 220K+ records
   • Achievement: 25% improvement in high-risk detection

2. NYC Taxi Fare Prediction Pipeline
   PySpark, AWS EMR, Athena
   • Processed 12M+ trip records
   • Predicted fares using Spark MLlib
   • RMSE: ~10.2

[Additional projects...]

SKILLS & COMPETENCIES

Technical Skills:
- Programming: C/C++, Java, Python, R, SQL
- Web: HTML/CSS, JavaScript, Node.js
- Tools: Git, Docker, VS Code, Eclipse
- Cloud: AWS (EMR, S3, Athena), GCP

Domain Expertise:
- ServiceNow (ITSM, CMDB, REST APIs)
- Machine Learning & Big Data
- Data Analysis & Visualization
- Business Process Automation

PUBLICATIONS & CERTIFICATIONS

[None provided]

REFERENCES

Available upon request
```

#### CSS Elements

- Academic layout: Traditional CV format
- Serif or monospace fonts
- Clean structure with clear sections
- Numbered projects
- Bullet points for achievements
- Academic color scheme: Navy and white
- Publication section (even if empty)
- References notation
- Formal language throughout

---

### 12. CORPORATE Template (Line 2397)

**Current State:** Corporate layout  
**Real-World Inspiration:** Fortune 500 Company Profile

#### Structural Changes

```
NEW LAYOUT:

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ CORPORATE PROFILE                      ┃
┃                                        ┃
┃ SHANMUGA PRIYA KANNAN                  ┃
┃ Senior ServiceNow Developer            ┃
┃ Cognizant Technology Solutions         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

CONTACT INFORMATION
├─ Email: shanmugapriyakannan019@gmail.com
├─ Phone: 872-330-3203
└─ LinkedIn: https://www.linkedin.com/in/shanmuga-priya-k

ORGANIZATIONAL PROFILE

Position: Senior ServiceNow Developer
Organization: Cognizant Technology Solutions
Department: Enterprise IT Services
Tenure: 2020 – 2023 (3+ years)
Reporting: Senior Management

ROLE OVERVIEW

Specialized in enterprise IT service management and business
process automation across Fortune 500 clients including
Autodesk and Fortive.

KEY DELIVERABLES
├─ 30+ Custom Workflows Developed
├─ 600+ Incidents Managed
├─ 60+ Client-Facing Features Deployed
├─ 3+ Enterprise Integrations
└─ 95% Resolution Rate Achieved

CORE COMPETENCIES

Enterprise Platforms: ServiceNow, SAP, QlikView, Azure
Development: REST APIs, Flow Design, Integration
Management: ITSM, CMDB, Service Catalog, Change Management

ACADEMIC CREDENTIALS

Primary: Master of Science, Computer Science
         DePaul University (2023-2025)

Secondary: Bachelor of Technology, Information Technology
           Velammal Engineering College (2016-2020)

TECHNICAL EXPERTISE

Systems:
├─ ServiceNow (ITSM, CMDB, REST APIs)
├─ Cloud (AWS, GCP)
└─ Data (Hadoop, Spark, Python)

Portfolio:
├─ 5 Completed Projects
├─ ML & Big Data Systems
└─ Enterprise Integrations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### CSS Elements

- Corporate grid design: Rigid structure
- Box borders: Professional `border` styling
- Tree structure: ASCII-like organizational layout
- Corporate colors: Blues, grays, whites
- Professional spacing: Conservative
- Department/Organization emphasis
- Hierarchical display
- Key metrics highlighted
- Credentials emphasized
- Portfolio summary

---

## Implementation Priority

### Phase 1: Maximum Impact (Start Here)

These templates need most differentiation:

1. **Tech** - Terminal/CLI style (most different)
2. **Dark** - Cyberpunk/nested (most different)
3. **Modern** - Proper sidebar layout (most impactful)
4. **Creative** - Card-based (visually distinctive)
5. **Executive** - Formal structure (significantly different)

### Phase 2: Medium Enhancement

6. **Classic** - Enhanced LinkedIn style
7. **Academic** - Traditional CV format
8. **Corporate** - Organizational layout
9. **Compact** - Swiss grid design

### Phase 3: Color/Style Variations

10. **Minimal** - Zen whitespace
11. **Colorful** - Vibrant carnival
12. **ATS-Friendly** - Plain text form

---

## Code Structure Pattern

Each template in `templates.js` follows this pattern:

```javascript
templateName: {
  name: "Display Name",
  render: (data) => {
    // Date formatting helper (reusable)
    const formatDate = (start, end) => { /* ... */ };

    // HTML generation from data
    const html = `
      <div class="resume-content">
        <!-- Template-specific HTML -->
      </div>
    `;

    // CSS styling (scoped to .resume-content and children)
    const css = `
      .resume-content { /* ... */ }
      /* All styles here */
    `;

    return { html, css };
  }
}
```

**Important:**

- Each template independently consumes the same `data` object
- HTML structure can vary completely
- CSS is scoped within the template's `css` string
- No modifications to parsing code needed

---

## Data Fields Reference

Each template receives this structure:

```javascript
{
  basics: {
    name,        // "Shanmuga Priya Kannan"
    label,       // Full contact info + job title
    email,       // "shanmugapriyakannan019@gmail.com"
    phone,       // "" (empty in current data)
    url,         // "https://www.linkedin.com/in/..."
    location,    // "" (empty in current data)
    summary      // "" (empty in current data)
  },
  work: [
    {
      position,   // "Senior ServiceNow Developer"
      company,    // "" (empty, use job name field)
      startDate,  // "June 2020"
      endDate,    // "Aug 2023"
      summary     // Full 400+ character description
    }
  ],
  education: [
    {
      institution,  // "DePaul University"
      studyType,    // "Master's"
      area,         // "Computer Science"
      startDate,    // "Sep. 2023"
      endDate,      // "June 2025"
      location      // "Chicago, USA"
    },
    // ... second education entry
  ],
  skills: [
    {
      name,        // "Programming Languages"
      keywords: [] // ["C/C++", "Java", "Python", ...]
    },
    // ... 7 skill categories total
  ],
  projects: [
    {
      name,        // "Shopping System"
      keywords: [], // ["Java", "Eclipse"]
      summary      // "Developed user authentication..."
    },
    // ... 5 projects total
  ]
}
```

**Note:** Use `job.position || "Position"` as fallback for company since `company` field is empty

---

## CSS Scoping Strategy

Each template's CSS is injected into a style tag and should be:

- Scoped to `.resume-content` class
- Use specific selectors to avoid conflicts
- Include responsive media queries
- Support print media
- Use relative units (em, rem) where possible

Example:

```css
.resume-content {
  font-family: ...;
}
.resume-content .resume-header {
  ...;
}
.resume-content .resume-section {
  ...;
}
/* Never use !important unless absolutely necessary */
```

---

## Testing Checklist

For each enhanced template, verify:

**Data Rendering**

- [ ] Name displays: "Shanmuga Priya Kannan"
- [ ] Job title visible: "Senior ServiceNow Developer"
- [ ] All 5 projects show: Shopping System, Market Analysis, Real Estate, Lung Cancer, NYC Taxi
- [ ] Project summaries display (not just names)
- [ ] Both education entries: DePaul + Velammal
- [ ] Degree types show: "Master's in", "Bachelor's in"
- [ ] All 7 skill categories visible
- [ ] Work experience: 2020-2023 dates correct

**Visual Quality**

- [ ] No text overflow or wrapping issues
- [ ] Consistent spacing and alignment
- [ ] Template-specific styling applied
- [ ] Visually distinct from other templates
- [ ] Professional appearance

**Functionality**

- [ ] Print preview looks good
- [ ] PDF export works
- [ ] Mobile responsive (if applicable)
- [ ] No console errors
- [ ] File sizes reasonable

---

## Next Actions

1. **Commit this guide to git**
2. **Start Phase 1 templates** (Tech, Dark, Modern)
3. **Test with Shanmuga's JSON**
4. **Continue with remaining templates**
5. **Merge enhancements to main**
