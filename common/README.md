# PDF.js Resume Parser

With dev by Shanmuga Priya Kannan - [linkedin.com/in/shanmuga](shanmuga-priya-k-95400a194)

This project extends the Model.Earth portfolio system to display 
resume data parsed directly from a PDF file, converted into structured JSON, and styled through multiple themes.

### Completed Features
- Integrated **PDF.js** to extract resume text data from a local PDF file.
- Structured extracted text into JSON fields (name, email, skills, education, etc.).
- Added **12 JSON Resume themes** with live preview switching.
- Implemented **URL parameters** (`?data=` and `?theme=`) for dynamic loading.
- Optimized **theme load performance** and added timing metrics.
- Integrated **Gravatar** for automatic bio photo display (optional if no photo uploaded).

### Local Setup
1. Run a local server (e.g., VS Code Live Server).
2. Open in browser:  
   `http://127.0.0.1:5500/cv/ShanmugaPriyaKannanindex.html`

### Next Steps (optional)
- Ongoing improvements to PDF text extraction accuracy and section detection.
- Support for secondary JSON syntax and merging.
