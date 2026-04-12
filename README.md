# About CV Automation

[Drag to parse resume PDF into json](extract/) - [About Extract Process](extract.html)

[Team PRs and AI Insights](/team/projects/#list=modelteam&showrepos=true)


### 1. Embeddable Module: `cv/common/cv.js`

- ✅ Includes filter HTML (data/theme dropdowns)
- ✅ Manages theme loading without iframe
- ✅ Displays both JSON and PDF data (on localhost)
- ✅ Loads additional README.md content from each CV folder
- ✅ Easy to add new CV pages and update Bio List in Github

<br>

# Add your CV

CVs from significant contributors are featured. Create yours in a fork, then push when you have examples of work to share. Send a preview link using: [your account].github.io/cv/[your folder] after turning on Github Pages for your forks of the "cv" and "localsite" repos.

### To Add a New CV Page:
1. Create folder under `cv/bios/YourName/`
2. Copy index.html template from `YashGondkar/index.html`
3. Use the [extract](extract) page and add `detailed.json` with your resume .json data
4. Set the `CVFilters` in your index.html and optionally add a PDF link:

### Your Filters:
```javascript
CVFilters.init({
  defaultJson: 'detailed.json',
  defaultPDF: 'https://your-resume-host-site.com/Your-Name-Resume.pdf',
  defaultTheme: 'elegant',
  showReadme: false,        // Hide README section
  showDataPreview: false    // Hide JSON preview
});
```

<!--
### To Override Theme Loading:
```javascript
// After CVFilters.init()
CVFilters.loadTheme = function(jsonFile, theme) {
  // Your custom loading logic
};
```
-->