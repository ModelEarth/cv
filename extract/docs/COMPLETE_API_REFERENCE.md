# COMPLETE PDF.JS API REFERENCE

## Quick Navigation

- [PdfMasterApi](#pdfmasterapi)
- [EnhancedPdfProcessor](#enhancedpdfprocessor)
- [PdfAdvancedFeatures](#pdfadvancedfeatures)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## PdfMasterApi

### Initialization

```javascript
const api = new PdfMasterApi();
await api.initialize();
```

### Document Management

#### `openDocument(source, options)`

**Parameters:**

- `source` (ArrayBuffer | string): PDF source (buffer or URL)
- `options` (object):
  - `password` (string): Password for encrypted PDFs
  - `useWorkerFetch` (boolean): Use worker for fetching (default: true)
  - `rangeChunkSize` (number): Chunk size for range requests (default: 65536)

**Returns:** Promise<PDFDocument>

```javascript
const pdfDoc = await api.openDocument(arrayBuffer);
const urlPdf = await api.openDocument("https://example.com/doc.pdf");
const encrypted = await api.openDocument(buffer, { password: "secret" });
```

#### `getDocumentInfo(pdfDoc)`

**Parameters:**

- `pdfDoc` (PDFDocument): Document to analyze

**Returns:** Object with pages, fingerprint, encryption, metadata

```javascript
const info = await api.getDocumentInfo(pdfDoc);
// Returns: { pages, fingerprint, isEncrypted, isXfa, permissions, metadata, ... }
```

#### `getPage(pdfDoc, pageNum)`

**Parameters:**

- `pdfDoc` (PDFDocument): Document
- `pageNum` (number): Page number (1-indexed)

**Returns:** Promise<PDFPage>

```javascript
const page = await api.getPage(pdfDoc, 1);
```

#### `closeDocument(pdfDoc)`

**Parameters:**

- `pdfDoc` (PDFDocument): Document to cleanup

**Returns:** void

```javascript
api.closeDocument(pdfDoc);
```

---

### Rendering & Visualization

#### `renderPageToCanvas(page, canvas, options)`

**Parameters:**

- `page` (PDFPage): Page to render
- `canvas` (HTMLCanvasElement): Target canvas
- `options` (object):
  - `scale` (number): Zoom level (default: 1.5)
  - `rotation` (number): Rotation in degrees (default: 0)
  - `renderText` (boolean): Include text layer (default: true)
  - `imageLayer` (boolean): Include images (default: true)

**Returns:** Promise<{success, canvas, viewport, pageWidth, pageHeight}>

```javascript
const canvas = document.createElement("canvas");
const result = await api.renderPageToCanvas(page, canvas, {
  scale: 2.0,
  renderText: true,
});
```

#### `renderPageToSvg(page, options)`

**Parameters:**

- `page` (PDFPage): Page to render
- `options` (object):
  - `scale` (number): Zoom level (default: 1.5)
  - `rotation` (number): Rotation in degrees (default: 0)

**Returns:** Promise<{success, svg, content, viewport}>

```javascript
const svgResult = await api.renderPageToSvg(page, { scale: 1.5 });
document.body.appendChild(svgResult.svg);
```

#### `getPageThumbnail(page, thumbWidth)`

**Parameters:**

- `page` (PDFPage): Page to thumbnail
- `thumbWidth` (number): Thumbnail width in pixels (default: 150)

**Returns:** Promise<string> (Data URL)

```javascript
const thumbnail = await api.getPageThumbnail(page, 100);
img.src = thumbnail;
```

---

### Text Processing

#### `extractPageText(page, options)`

**Parameters:**

- `page` (PDFPage): Page to extract from
- `options` (object):
  - `includeLayout` (boolean): Include layout analysis (default: true)
  - `includeFontInfo` (boolean): Include font information (default: true)
  - `normalizeSpacing` (boolean): Normalize whitespace (default: true)

**Returns:** Promise<{text, items, lines, fullText, pageHeight, pageWidth}>

```javascript
const textData = await api.extractPageText(page, {
  includeLayout: true,
  normalizeSpacing: true,
});
console.log(textData.fullText);
```

#### `searchText(page, searchTerm, caseSensitive)`

**Parameters:**

- `page` (PDFPage): Page to search
- `searchTerm` (string): Text to find
- `caseSensitive` (boolean): Case-sensitive search (default: false)

**Returns:** Promise<Array> (Matches with positions)

```javascript
const matches = await api.searchText(page, "javascript", false);
// Returns: [{ text, index, position, width, height }, ...]
```

#### `extractMarkedText(page)`

**Parameters:**

- `page` (PDFPage): Page to analyze

**Returns:** Promise<Array> (Marked text items)

```javascript
const marked = await api.extractMarkedText(page);
```

---

### Annotations

#### `getPageAnnotations(page)`

**Parameters:**

- `page` (PDFPage): Page to analyze

**Returns:** Promise<Array> (Annotation objects)

```javascript
const annotations = await api.getPageAnnotations(page);
// Returns: [{ id, type, subtype, rect, contents, author, color, ... }, ...]
```

#### `extractAnnotationContent(page)`

**Parameters:**

- `page` (PDFPage): Page to analyze

**Returns:** Promise<{comments, highlights, links, other}>

```javascript
const content = await api.extractAnnotationContent(page);
console.log("Comments:", content.comments);
console.log("Highlights:", content.highlights);
```

#### `renderAnnotations(page, canvas, viewport)`

**Parameters:**

- `page` (PDFPage): Page
- `canvas` (HTMLCanvasElement): Target canvas
- `viewport` (object): Viewport info from rendering

**Returns:** Promise<HTMLElement | null> (Annotation layer)

```javascript
const layer = await api.renderAnnotations(page, canvas, viewport);
if (layer) document.body.appendChild(layer);
```

---

### Forms & Fields

#### `getFormFields(pdfDoc, pageNum)`

**Parameters:**

- `pdfDoc` (PDFDocument): Document
- `pageNum` (number): Optional specific page

**Returns:** Promise<{fields, values, isXfa}>

```javascript
const forms = await api.getFormFields(pdfDoc);
console.log("Fields:", forms.fields);
console.log("Values:", forms.values);
```

#### `extractFormData(pdfDoc)`

**Parameters:**

- `pdfDoc` (PDFDocument): Document

**Returns:** Promise<{hasForm, isXfa, fields, fieldValues}>

```javascript
const formData = await api.extractFormData(pdfDoc);
```

#### `renderFormLayer(page, canvas, viewport)`

**Parameters:**

- `page` (PDFPage): Page
- `canvas` (HTMLCanvasElement): Target canvas
- `viewport` (object): Viewport info

**Returns:** Promise<HTMLElement | null> (Form layer)

```javascript
const formLayer = await api.renderFormLayer(page, canvas, viewport);
```

---

### Advanced Features

#### `extractSignatures(pdfDoc)`

**Parameters:**

- `pdfDoc` (PDFDocument): Document

**Returns:** Promise<{signed, signatures}>

```javascript
const signatures = await api.extractSignatures(pdfDoc);
if (signatures.signed) {
  console.log("Document is digitally signed");
}
```

#### `renderXfaContent(pdfDoc, canvas, pageNum)`

**Parameters:**

- `pdfDoc` (PDFDocument): XFA document
- `canvas` (HTMLCanvasElement): Target
- `pageNum` (number): Page number

**Returns:** Promise<{success, layer, viewport} | null>

```javascript
const xfa = await api.renderXfaContent(pdfDoc, canvas, 1);
```

#### `getDocumentStructure(pdfDoc)`

**Parameters:**

- `pdfDoc` (PDFDocument): Document

**Returns:** Promise<{hasStructure, root}>

```javascript
const structure = await api.getDocumentStructure(pdfDoc);
if (structure.hasStructure) {
  // Document has tagged structure for accessibility
}
```

#### `extractAttachments(pdfDoc)`

**Parameters:**

- `pdfDoc` (PDFDocument): Document

**Returns:** Promise<Array> (Attached files)

```javascript
const attachments = await api.extractAttachments(pdfDoc);
```

---

### Utilities

#### `normalizeUrl(url)`

Normalizes URL for safe usage

```javascript
const normalized = api.normalizeUrl("http://example.com/doc.pdf");
```

#### `getFilenameFromUrl(url)`

Extracts filename from URL

```javascript
const filename = api.getFilenameFromUrl("http://example.com/my-doc.pdf");
// Returns: 'my-doc.pdf'
```

#### `isPdfFile(filename)`

Validates if file is PDF

```javascript
if (api.isPdfFile("document.pdf")) {
  // Valid PDF file
}
```

#### `normalizeUnicodeText(text)`

Normalizes Unicode text

```javascript
const normalized = api.normalizeUnicodeText(dirtyText);
```

#### `clamp(value, min, max)`

Clamps value to range

```javascript
const clamped = api.clamp(50, 0, 100); // 50
const clamped2 = api.clamp(150, 0, 100); // 100
```

#### `generateUuid()`

Generates unique ID

```javascript
const id = api.generateUuid();
```

#### `getLibraryVersion()`

Gets PDF.js version

```javascript
console.log("PDF.js version:", api.getLibraryVersion());
```

---

## EnhancedPdfProcessor

### Initialization

```javascript
const processor = new EnhancedPdfProcessor();
await processor.initialize();
```

### Document Processing

#### `processPdf(source, options)`

Comprehensive PDF processing

**Parameters:**

- `source` (ArrayBuffer | string): PDF source
- `options` (object):
  - `extractMetadata` (boolean)
  - `extractText` (boolean)
  - `extractAnnotations` (boolean)
  - `extractForms` (boolean)
  - `renderThumbnails` (boolean)
  - `structuralAnalysis` (boolean)

**Returns:** Promise<{metadata, pages, text, annotations, forms, signatures, structure, statistics}>

```javascript
const result = await processor.processPdf(arrayBuffer, {
  extractMetadata: true,
  extractText: true,
  extractAnnotations: true,
  extractForms: true,
  renderThumbnails: true
});

// Returns:
{
  metadata: { title, author, subject, pages, ... },
  pages: [
    {
      pageNumber: 1,
      text: "extracted text",
      annotations: [],
      forms: [],
      thumbnail: "data:image/jpeg;base64,...",
      dimensions: { width, height }
    },
    // ... more pages
  ],
  text: "full document text",
  annotations: [],
  forms: { hasForm, fieldValues, fields },
  signatures: { signed, signatures },
  structure: { hasStructure, root },
  statistics: {
    totalPages: 10,
    processingTime: 2340,
    extractedTextLength: 45000,
    annotationCount: 3
  }
}
```

#### `parseResume(pdfDoc)`

Intelligent resume parsing

**Parameters:**

- `pdfDoc` (PDFDocument): Loaded PDF document

**Returns:** Promise<ResumeObject>

```javascript
const pdfDoc = await processor.api.openDocument(arrayBuffer);
const resumeData = await processor.parseResume(pdfDoc);

// Returns:
{
  metadata: { source, author, extractedAt },
  basics: { name, label, email, phone, url, location, summary },
  work: [
    {
      position: "Senior Developer",
      company: "TechCorp",
      startDate: "2020-01-01",
      endDate: "Present",
      summary: "...",
      highlights: []
    },
    // ... more jobs
  ],
  education: [
    {
      institution: "University",
      studyType: "Bachelor's",
      area: "Computer Science",
      startDate: "2016",
      endDate: "2020",
      score: "3.8"
    },
    // ... more education
  ],
  skills: [
    { name: "JavaScript", level: "expert" },
    // ... more skills
  ],
  projects: [],
  languages: [
    { language: "English", fluency: "Native" }
  ],
  certifications: [],
  references: [],
  rawData: { fullText, annotations, formFields }
}
```

#### `clearCache()`

Clears document cache

```javascript
processor.clearCache();
```

---

## PdfAdvancedFeatures

### Initialization

```javascript
const features = new PdfAdvancedFeatures(api);
```

### Batch Processing

#### `processPdfBatch(documents, processingFn, options)`

Process multiple PDFs in parallel

**Parameters:**

- `documents` (Array): Array of PDF sources
- `processingFn` (Function): Async function to process each document
- `options` (object):
  - `concurrent` (number): Max concurrent operations (default: 4)
  - `timeout` (number): Timeout per operation in ms (default: 30000)

**Returns:** Promise<{results, errors, totalProcessed, totalErrors}>

```javascript
const results = await features.processPdfBatch(
  [file1, file2, file3, file4, file5],
  async (file) => {
    const processor = new EnhancedPdfProcessor();
    await processor.initialize();
    return processor.processPdf(file);
  },
  { concurrent: 4, timeout: 60000 }
);

console.log("Processed:", results.totalProcessed);
console.log("Errors:", results.totalErrors);
```

### Text Extraction

#### `extractTextWithOcr(pdfDoc, options)`

Advanced text extraction with OCR support

**Parameters:**

- `pdfDoc` (PDFDocument): Document
- `options` (object):
  - `useOcr` (boolean): Enable OCR mode (default: false)
  - `languages` (Array): Supported languages (default: ['en'])
  - `confidence` (number): Confidence threshold (default: 0.7)

**Returns:** Promise<{pages, fullText, confidence, detectedLanguages}>

```javascript
const textData = await features.extractTextWithOcr(pdfDoc, {
  useOcr: false,
  languages: ["en", "es"],
  confidence: 0.8,
});
```

### Rendering

#### `renderPageMultiFormat(page, options)`

Render page to multiple formats

**Parameters:**

- `page` (PDFPage): Page to render
- `options` (object):
  - `formats` (Array): ['png', 'jpeg', 'webp', 'svg'] (default: all)
  - `scale` (number): Zoom level (default: 1.5)
  - `quality` (number): JPEG/WebP quality (default: 0.8)

**Returns:** Promise<{success, formats, viewport, metadata}>

```javascript
const renders = await features.renderPageMultiFormat(page, {
  formats: ["png", "jpeg", "webp"],
  scale: 2.0,
  quality: 0.9,
});

// Use rendered formats
document.getElementById("preview-png").src = renders.formats.png;
document.getElementById("preview-webp").src = renders.formats.webp;
```

#### `generateThumbnailGrid(pdfDoc, options)`

Generate thumbnail grid for all pages

**Parameters:**

- `pdfDoc` (PDFDocument): Document
- `options` (object):
  - `thumbWidth` (number): Thumbnail width (default: 150)
  - `columns` (number): Grid columns (default: 4)
  - `maxPages` (number): Max pages to thumbnail (default: all)

**Returns:** Promise<{thumbnails, grid}>

```javascript
const grid = await features.generateThumbnailGrid(pdfDoc, {
  thumbWidth: 150,
  columns: 4,
  maxPages: 20,
});

// Display grid
grid.thumbnails.forEach((thumb) => {
  const img = document.createElement("img");
  img.src = thumb.thumbnail;
  container.appendChild(img);
});
```

### Search

#### `searchAndHighlight(pdfDoc, searchTerm, options)`

Search document and get highlighting info

**Parameters:**

- `pdfDoc` (PDFDocument): Document
- `searchTerm` (string): Text to find
- `options` (object):
  - `caseSensitive` (boolean): Case-sensitive (default: false)
  - `wholeWords` (boolean): Whole word match (default: false)
  - `highlightColor` (string): Highlight color (default: 'yellow')

**Returns:** Promise<{matches, totalMatches, pageMatches}>

```javascript
const results = await features.searchAndHighlight(pdfDoc, "JavaScript", {
  caseSensitive: false,
  wholeWords: true,
});

console.log("Total matches:", results.totalMatches);
console.log("Pages with matches:", Object.keys(results.pageMatches));
// e.g., { '1': 3, '5': 2, '10': 1 } (page number -> count)
```

### Document Structure

#### `extractOutline(pdfDoc)`

Extract document bookmarks/outline

**Parameters:**

- `pdfDoc` (PDFDocument): Document

**Returns:** Promise<{hasOutline, bookmarks}>

```javascript
const outline = await features.extractOutline(pdfDoc);
if (outline.hasOutline) {
  console.log("Bookmarks:", outline.bookmarks);
}
```

#### `getDocumentStructure(pdfDoc)`

Get document structure tree (accessibility)

**Parameters:**

- `pdfDoc` (PDFDocument): Document

**Returns:** Promise<{hasStructure, root}>

```javascript
const structure = await features.extractDocumentStructure(pdfDoc);
```

### Comparison

#### `comparePdfs(pdfDoc1, pdfDoc2, pageNum, options)`

Compare two PDFs (visual diff)

**Parameters:**

- `pdfDoc1` (PDFDocument): First document
- `pdfDoc2` (PDFDocument): Second document
- `pageNum` (number): Page to compare (default: 1)
- `options` (object):
  - `scale` (number): Zoom level (default: 1.5)

**Returns:** Promise<{differences, similarity, canvas1, canvas2}>

```javascript
const comparison = await features.comparePdfs(pdfDoc1, pdfDoc2, 1);
console.log("Similarity:", comparison.similarity + "%");
console.log("Differences:", comparison.differences);
```

### Forms

#### `extractFormFieldsWithValidation(pdfDoc)`

Extract and validate form fields

**Parameters:**

- `pdfDoc` (PDFDocument): Document with forms

**Returns:** Promise<{hasForm, fields, isXfa}>

```javascript
const forms = await features.extractFormFieldsWithValidation(pdfDoc);
for (const field of forms.fields) {
  console.log(`${field.name}: ${field.validation.type}`);
  console.log(`Required: ${field.isRequired}`);
  console.log(`Constraints:`, field.constraints);
}
```

### Metrics

#### `getPerformanceMetrics()`

Get performance metrics

**Returns:** Object with metrics

```javascript
const metrics = features.getPerformanceMetrics();
// Returns:
{
  totalDocuments: 5,
  totalPages: 47,
  averageRenderTime: 124.5,
  averageParseTime: 234.8,
  cacheHitRate: "75.00%",
  cacheHits: 15,
  cacheMisses: 5
}
```

#### `resetMetrics()`

Reset performance metrics

```javascript
features.resetMetrics();
```

---

## Error Handling

### Exception Normalization

```javascript
try {
  const pdf = await api.openDocument(arrayBuffer);
} catch (error) {
  const normalized = api.normalizeException(error);
  // Returns: { type, message }
  console.log(`Error type: ${normalized.type}`);
  console.log(`Message: ${normalized.message}`);
}
```

### Error Types

```
InvalidPDF - PDF is corrupted or invalid
RenderingCancelled - Rendering was cancelled
ResponseError - Network or response error
PasswordRequired - PDF requires password
Unknown - Other errors
```

### Recovery Options

```javascript
const options = api.getErrorRecoveryOptions();
// Returns recovery strategies for different error types
```

---

## Examples

### Example 1: Complete Resume Processing

```javascript
async function processResume(pdfFile) {
  const processor = new EnhancedPdfProcessor();
  await processor.initialize();

  const arrayBuffer = await pdfFile.arrayBuffer();

  // Process PDF
  const result = await processor.processPdf(arrayBuffer);

  // Parse resume
  const pdfDoc = await processor.api.openDocument(arrayBuffer);
  const resumeData = await processor.parseResume(pdfDoc);

  // Display results
  console.log("Name:", resumeData.basics.name);
  console.log("Email:", resumeData.basics.email);
  console.log("Experience:", resumeData.work.length);
  console.log("Education:", resumeData.education.length);
  console.log("Skills:", resumeData.skills.length);

  return resumeData;
}
```

### Example 2: Batch Document Processing

```javascript
async function batchProcessPdfs(files) {
  const processor = new EnhancedPdfProcessor();
  await processor.initialize();

  const features = new PdfAdvancedFeatures(processor.api);

  const results = await features.processPdfBatch(
    files,
    async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      return processor.processPdf(arrayBuffer);
    },
    { concurrent: 4, timeout: 60000 }
  );

  console.log(`Processed: ${results.totalProcessed} documents`);
  console.log(`Errors: ${results.totalErrors}`);

  return results;
}
```

### Example 3: Search and Highlight

```javascript
async function searchPdf(pdfFile, keyword) {
  const processor = new EnhancedPdfProcessor();
  await processor.initialize();

  const features = new PdfAdvancedFeatures(processor.api);
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await processor.api.openDocument(arrayBuffer);

  const results = await features.searchAndHighlight(pdfDoc, keyword, {
    caseSensitive: false,
    wholeWords: true,
  });

  console.log(`Found "${keyword}" ${results.totalMatches} times`);
  console.log(`On pages:`, results.pageMatches);

  return results;
}
```

### Example 4: Generate Thumbnail Grid

```javascript
async function generateGrid(pdfFile) {
  const api = new PdfMasterApi();
  await api.initialize();

  const features = new PdfAdvancedFeatures(api);
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await api.openDocument(arrayBuffer);

  const grid = await features.generateThumbnailGrid(pdfDoc, {
    thumbWidth: 150,
    columns: 4,
    maxPages: 12,
  });

  // Display thumbnails
  const container = document.getElementById("thumbnails");
  for (const thumb of grid.thumbnails) {
    const img = document.createElement("img");
    img.src = thumb.thumbnail;
    img.title = `Page ${thumb.page}`;
    container.appendChild(img);
  }

  return grid;
}
```

---

## Memory & Resource Management

### Cleanup

Always cleanup resources when done:

```javascript
// For individual documents
api.closeDocument(pdfDoc);

// For complete cleanup
api.destroy();
processor.destroy();
features.cleanup();
```

### Memory Stats

Monitor memory usage:

```javascript
const stats = api.getMemoryStats();
console.log("Cached documents:", stats.cachedDocuments);
console.log("Active workers:", stats.activeWorkers);
console.log("Rendering tasks:", stats.renderingTasks);
```

### Worker Pool Configuration

```javascript
// Change worker pool size after initialization
api._initializeWorkerPool(8); // Use 8 workers
```

---

## Performance Tips

1. **Use batch processing** for multiple PDFs
2. **Enable caching** for frequently accessed documents
3. **Limit thumbnail rendering** to first few pages
4. **Use appropriate zoom levels** to balance quality and performance
5. **Monitor performance metrics** to identify bottlenecks
6. **Cleanup resources** after processing

---

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Mostly supported (some rendering features limited)
- Mobile: Limited support (memory constraints)

---

## Version Information

- PDF.js: 2.16+
- Minimum IE: Not supported
- Node.js: Not applicable (browser-only)

---

Last Updated: 2025
