# Resume Template Generator

**Transform your resume into 12 beautiful, professionally-designed formats with a single click.**

A powerful, locally-run web application that extracts data from PDF resumes and renders them through multiple distinct template designs. No data leaves your device—all processing happens in your browser.

<!-- Rename SatvikPraveen to "extract" -->

## 🎓 Resources / Theme Source

- [JSON Resume Standard](https://jsonresume.org/) - [docs.jsonresume.org/](https://docs.jsonresume.org/)
- [Resume Best Practices](https://www.indeed.com/career-advice/resumes)

### We've added PDF parsing

- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [GitHub Pages Guide](https://pages.github.com/)
- [CSS Grid Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)

---

## 📋 Features

✅ **PDF Resume Parsing** - Extract text, work experience, education, skills, and projects from PDF files  
✅ **12 Unique Templates** - Tech, Dark, Modern, Creative, Executive, Compact, Minimal, Colorful, ATS-Friendly, Academic, Corporate, Classic  
✅ **Real-time Preview** - See your resume rendered instantly in any template  
✅ **Export Options** - Save as HTML, JSON, or print-ready PDF  
✅ **Print-Friendly** - Clean, borderless output optimized for professional documents  
✅ **Offline-First** - All processing happens locally in your browser  
✅ **No Dependencies** - Uses only PDF.js for extraction, zero backend required

---

## 🎨 Template Showcase

**All 12 templates are fully functional and optimized with:**

- ✅ Project section support (displays project name, summary, and technologies)
- ✅ Professional styling and layouts
- ✅ Print-ready formatting
- ✅ Responsive design considerations

### 1. **Tech** - Terminal/CLI Aesthetic

Neon green terminal emulator with bash-style commands. Perfect for developers and engineers.

### 2. **Dark** - Cyberpunk Style

Neon accents with Unicode box drawing and glitch effects. Modern and eye-catching.

### 3. **Modern** - Sidebar Portfolio

2-column layout with gradient sidebar and skill badges. Clean and professional.

### 4. **Creative** - Card-Based Portfolio

Hero section with stats cards and masonry project grid. Design-focused.

### 5. **Executive** - Formal Corporate

Serif typography with decorative lines. Enterprise-ready prestige.

### 6. **Compact** - Swiss Grid Design

Minimalist 2-column layout with crisp typography. Maximum clarity.

### 7. **Minimal** - Zen Aesthetic

Generous whitespace and calm color palette. Distraction-free.

### 8. **Colorful** - Vibrant Carnival

Rainbow accents and dynamic badges. Bold and memorable.

### 9. **ATS-Friendly** - Semantic HTML

Plain, machine-readable format optimized for resume parsing systems.

### 10. **Academic** - University CV Format

Research publication style with centered layout. Scholarly presentations.

### 11. **Corporate** - Fortune 500 Biography

Enterprise biography style. C-suite ready.

### 12. **Classic** - LinkedIn Standard

Professional standard layout. Always reliable.

---

**Upload your resume**

- Click "Upload PDF Resume"
- Select your PDF file
- Click "Parse Resume"

5. **Explore templates**

- Click any template card to preview
- See your data instantly rendered
- Export as HTML, JSON, or PDF

---

## 📦 Hosting on GitHub Pages

### Step 1: Prepare Repository

```bash
# Create or navigate to your repository
git clone https://github.com/SatvikPraveen/resume-template-generator.git
cd resume-template-generator

# Ensure you're on main branch
git checkout main
```

### Step 2: Configure GitHub Pages

1. Go to **Repository Settings** → **Pages**
2. Under "Build and deployment":
   - Source: Select `Deploy from a branch`
   - Branch: Select `main` and `/root`
3. Click **Save**

### Step 3: Verify Deployment

After a few minutes, your site will be available at:

```
https://SatvikPraveen.github.io/resume-template-generator
```

### Step 4: Update Configuration (Optional)

Add to `index.html` `<head>`:

```html
<base href="/resume-template-generator/" />
```

This ensures assets load correctly from the subdirectory.

### Step 5: Custom Domain (Optional)

To use a custom domain:

1. Settings → Pages → Custom domain
2. Enter your domain (e.g., `resume.yoursite.com`)
3. Update DNS CNAME record to point to `yourusername.github.io`

---

## 🔧 Project Structure

```
resume-template-generator/
├── index.html              # Main UI
├── app.js                  # Application logic & PDF parsing
├── styles.css              # Global styling
├── templates.js            # 12 template definitions
├── vendor/                 # PDF.js library
│   ├── pdf.mjs
│   └── pdf.worker.mjs
├── src/
│   ├── parsers/
│   │   └── pdfjs-parser.js # PDF text extraction
│   └── core/               # Advanced features (optional)
└── README.md              # This file
```

---

## 📖 How It Works

### Phase 1: PDF Parsing

- Upload your PDF resume
- PDF.js extracts raw text
- Advanced regex patterns identify sections:
  - **Contact Info** - Name, email, phone, location, URLs
  - **Work Experience** - Position, company, duration, description
  - **Education** - Degree, institution, dates, location
  - **Skills** - Categorized by type (languages, tools, frameworks)
  - **Projects** - Name, description, technologies used

### Phase 2: Data Normalization

- Clean malformed text and spacing
- Standardize date formats
- Extract structured JSON

### Phase 3: Template Rendering

- Select desired template
- Data flows into template's render function
- HTML + CSS combined and injected into DOM
- Real-time preview displayed with proper styling
- All templates support project sections with technologies

### Phase 4: Export

- **HTML** - Standalone file with embedded CSS and full formatting
- **JSON** - Structured data following JSON Resume standard
- **PDF** - Print-optimized version with clean layout and no borders

---

## 🎯 Use Cases

- 🧑‍💻 **Tech Professionals** - Showcase projects with the Tech template
- 👔 **Corporate Executives** - Professional prestige with Executive template
- 🎨 **Designers** - Portfolio showcase with Creative template
- 🏢 **Corporate HR** - ATS-friendly scanning with ATS template
- 📚 **Academics** - Research CV with Academic template
- 🌈 **Creative Roles** - Bold impact with Colorful template

---

## 🔐 Privacy & Security

✅ **Zero Data Collection** - No data is sent to any server  
✅ **Offline-Capable** - Works without internet connection  
✅ **Client-Side Processing** - All computation in your browser  
✅ **No Tracking** - No analytics, cookies, or tracking pixels  
✅ **GDPR Compliant** - Your resume never leaves your device

---

## 🛠️ Technical Stack

- **Frontend Framework**: Vanilla JavaScript (no frameworks)
- **PDF Processing**: PDF.js 4.0+
- **Styling**: Pure CSS3 with CSS Grid/Flexbox
- **Data Format**: JSON Resume Standard
- **Deployment**: Static HTML/CSS/JS (GitHub Pages ready)

---

## 📝 Resume Data Format

Extracted data follows this structure:

```javascript
{
  basics: {
    name: "Your Name",
    label: "Job Title",
    email: "email@example.com",
    phone: "+1-555-0000",
    url: "https://yoursite.com",
    location: "City, State"
  },
  work: [
    {
      position: "Job Title",
      company: "Company Name",
      startDate: "Jan 2020",
      endDate: "Present",
      summary: "Job description..."
    }
  ],
  education: [
    {
      institution: "University",
      studyType: "Bachelor's",
      area: "Field of Study",
      startDate: "2016",
      endDate: "2020"
    }
  ],
  skills: [
    {
      name: "Category",
      keywords: ["skill1", "skill2"]
    }
  ],
  projects: [
    {
      name: "Project Name",
      summary: "Description",
      keywords: ["tech1", "tech2"]
    }
  ]
}
```

---

## 🤝 Contributing

Contributions are welcome! Areas for enhancement:

- [ ] Additional template designs (Modern variations)
- [ ] Advanced extraction patterns (Custom sections)
- [ ] Multi-language support
- [ ] Resume improvement suggestions
- [ ] Performance optimizations

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-template`)
3. Commit changes (`git commit -am 'Add new template'`)
4. Push to branch (`git push origin feature/new-template`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 🐛 Troubleshooting

### PDF Won't Parse

- Ensure PDF is text-based (not scanned image)
- Try reducing file size
- Check browser console for errors (F12)

### Template Not Displaying

- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh page (Ctrl+Shift+R)
- Check JavaScript console for errors

### Export Not Working

- Ensure you've parsed a resume first
- Try different export format
- Check browser permissions for downloads

---

## 📞 Support

- **Issues**: Open an issue on GitHub
- **Discussions**: GitHub Discussions for feature requests
- **Documentation**: See inline comments in `app.js` and `templates.js`

---

## 🎉 Acknowledgments

- Built with [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla
- Inspired by [JSON Resume](https://jsonresume.org/)
- Template designs inspired by real-world resume formats
- Hosted on [GitHub Pages](https://pages.github.com/)

---

## 🔮 Roadmap

### v1.1 (Planned)

- [ ] Drag-and-drop file upload
- [ ] Additional templates (Gradient, Minimalist, Startup)
- [ ] Custom color themes
- [ ] Section reordering
- [ ] Field editing before export

### v2.0 (Future)

- [ ] Multi-resume management
- [ ] Template builder UI
- [ ] Cloud sync (optional)
- [ ] Browser extensions
- [ ] Mobile app

---

**Made with ❤️ for job seekers everywhere**

Last Updated: November 24, 2025
