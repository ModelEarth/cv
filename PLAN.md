# PLAN - CV display from PDF source files

## TO DO

1. **Document the source repo** which was forked for the theme display and modified for the theme process. Clues might be in the SatvikPraveen folder. Or modifications (if not easily mergeable) could potentially be pushed as a new "view" folder within their source repo.

2. **Add an input field for pasting an external resume .PDF URLs** on the SatvikPraveen/index.html page. We'll use this to confirm that resumes can be pulled from .PDF files and converted to .json for display in templates without the need to place the resume on the same server as the templates.

3. **Move the input from SatvikPraveen** to its own "add" folder - and attempt to be in sync with any repos we've forked to changes can be pushed to the source. This may involve have a fork reside outside the cv folder, or as a submodule in the cv folder.

4. **Add filters to other CV pages** that don't currently have them

5. **In the "work" node of the detailed.json file**, use the order of the fields to set the bold title for each work (job) listed. The Harvard standard is "organization" first. Include support for the term "organization" as an alternative to "company".

6. **Implement the use of .dark css which is provided by toggle in header** how can we be compatible with the source to send a PR with our changes? The SatvikPraveen folder may have clues.

7. **Auto-detect JSON files** per person folder

8. **Determine if the safe select will result in errors** if jQuery is added **AFTER** the following $ select runs in filters.js


### Before Refactoring
```javascript
// Each CV page had this - CONFLICTED with jQuery
const $ = s => document.querySelector(s);
```

### After Refactoring
```javascript
// common/filters.js - NO CONFLICT
function select(selector) {
  if (typeof jQuery !== 'undefined') {
    return jQuery(selector)[0];
  }
  return document.querySelector(selector);
}
```

### Verification
- No console errors when localsite.js loads jQuery - but do we know if this occurs AFTER select runs?  Add a delay for when localhost.js is loaded into the page, which inturn loads jQuery.

---
<br>

# Changes made to originally forked repo 

[Add link to original here]

### 1. Created New Module: `cv/common/filters.js`

A jQuery-compatible filter module that:
- ✅ Provides a safe selector function that works with or without jQuery
- ✅ Dynamically generates filter HTML (data/theme dropdowns)
- ✅ Handles URL parameter reading/writing
- ✅ Manages theme loading in iframe
- ✅ Fetches and displays JSON data
- ✅ Loads README.md content
- ✅ Provides public API for customization

### Maintainability
- ✅ Single source of truth for filter logic
- ✅ Easier to add new CV pages
- ✅ Consistent behavior across all pages
- ✅ jQuery conflicts resolved
- ✅ Ready for Model.Earth header/footer integration

<br>

# Steps for adding your CV page

Only pages from significant contributors are activated, but start working on yours early in a fork, then push when you have examples of work to share. Send a preview link using: [your account].github.io/cv/[your folder] after turning on Github Pages for your forks of "cv" and "localsite".

### To Add a New CV Page:
1. Create folder under `cv/YourName/`
2. Add `detailed.json` with resume data
3. Copy index.html template from `YashGondkar/index.html`
4. Update `personFolder` in initialization:
   ```javascript
   CVFilters.init({
     personFolder: 'YourName',
     defaultJson: 'detailed.json',
     defaultTheme: 'elegant'
   });
   ```

### To Customize Filters:
```javascript
CVFilters.init({
  personFolder: 'YourName',
  defaultJson: 'detailed.json',
  defaultTheme: 'elegant',
  showReadme: false,        // Hide README section
  showDataPreview: false    // Hide JSON preview
});
```

### To Override Theme Loading:
```javascript
// After CVFilters.init()
CVFilters.loadTheme = function(jsonFile, theme) {
  // Your custom loading logic
};
```