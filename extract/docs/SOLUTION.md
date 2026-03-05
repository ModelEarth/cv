# Resume Extraction Solution Plan

## Problem Analysis

From the PDF images provided, the resume structure is:

```
Name
Contact Info | Links

Summary paragraph

EDUCATION (section header - all caps)
  Institution 1
  Degree
  Date - Date
  Location

  Institution 2
  ...

EXPERIENCE (section header - all caps)
  Position | Company
  Date - Date
  Description/bullets

  ...

PROJECTS (section header - all caps)
  Project Name | Technologies
  Description

  ...

TECHNICAL SKILLS (section header - all caps)
  Category: Item1, Item2, Item3
  ...
```

## Root Cause

The PDF.js text extraction is:

1. ✅ Extracting text correctly
2. ✅ Finding "EDUCATION", "EXPERIENCE", "PROJECTS", "TECHNICAL SKILLS" headers
3. ❌ BUT: The sections are being concatenated incorrectly in the parsers

The `identifySections()` function needs to:

- Find each section header position
- Extract text from that position until the next section header
- Return clean sections with no bleeding

## Solution

Use a simple, robust approach:

1. Find all section headers with their positions
2. For each section, extract text from header to next header
3. Pass ONLY that section's text to the parser
4. Each parser works on isolated section content

Key insight: **The section content should NOT contain other section headers or dates from other sections**

If parseWorkExperience is getting education dates, it means the EDUCATION content is being passed to it.
If parseEducation returns [], it means it's not getting any content or the content format is wrong.

## Implementation

The fix must ensure:

- Each section's content is isolated
- No bleeding between sections
- Each parser receives only relevant content
