---
name: file-reading
description: Parse uploaded CSV, JSON, and image files safely with type detection, validation, normalization, and metadata extraction.
triggers:
  - Use when a workflow accepts uploaded files and must convert them into trusted structured data
  - Use when CSV, JSON, or images need validation before downstream processing
  - Use when file metadata, schema checks, or normalization rules are part of the task
anti-triggers:
  - Do not use when the task is only frontend styling with no file parsing logic; use the frontend skill instead
  - Do not use when the deliverable is an office document export rather than uploaded file ingestion
  - Do not use when a raw binary pass-through is enough and no parsing or validation is needed
---
# File Reading Skill

## Quick Reference

| Task | Approach |
| --- | --- |
| Parse uploaded CSV data | Use a real CSV parser, normalize headers, and validate every row before use |
| Accept uploaded JSON | Parse strictly, validate schema shape, and reject ambiguous input early |
| Read uploaded images | Inspect metadata with `sharp`, enforce limits, and normalize dimensions or format |
| Route mixed file types | Detect by MIME type and extension, then dispatch to specialized handlers |
| Protect ingestion pipelines | Enforce size limits, trusted types, and explicit error messages for invalid files |

## Step-by-Step Instructions

### 1. Treat uploaded files as untrusted input

The job is not just to read bytes. The job is to decide whether the file should be accepted at all.

Validate at least:

- Declared MIME type
- File extension
- Size limits
- Required fields or columns
- Expected encoding and shape

### 2. Parse CSV, JSON, and images through one normalized entry point

```js
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const sharp = require('sharp');

function normalizeCsvRows(rows) {
  return rows.map(function (row, index) {
    if (!row.email) {
      throw new Error('CSV row ' + (index + 2) + ' is missing email');
    }

    return {
      name: String(row.name || '').trim(),
      email: String(row.email).trim().toLowerCase(),
      team: String(row.team || 'unassigned').trim()
    };
  });
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Expected a JSON object at the root.');
  }

  return data;
}

function readCsvFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return normalizeCsvRows(rows);
}

async function readImageFile(filePath) {
  const metadata = await sharp(filePath).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to determine image dimensions.');
  }

  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    space: metadata.space,
    hasAlpha: Boolean(metadata.hasAlpha)
  };
}

async function parseUploadedFile(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType = String(file.mimetype || '').toLowerCase();

  if (mimeType === 'application/json' || extension === '.json') {
    return {
      kind: 'json',
      data: readJsonFile(file.path)
    };
  }

  if (mimeType === 'text/csv' || extension === '.csv') {
    return {
      kind: 'csv',
      data: readCsvFile(file.path)
    };
  }

  if (mimeType.indexOf('image/') === 0 || ['.png', '.jpg', '.jpeg', '.webp'].indexOf(extension) !== -1) {
    return {
      kind: 'image',
      data: await readImageFile(file.path)
    };
  }

  throw new Error('Unsupported file type: ' + mimeType + ' (' + extension + ')');
}

async function main() {
  const result = await parseUploadedFile({
    path: 'uploads/team.csv',
    originalname: 'team.csv',
    mimetype: 'text/csv'
  });

  console.log(result.kind);
  console.log(result.data[0]);
}

main().catch(function (error) {
  console.error(error.message);
  process.exit(1);
});
```

### 3. Keep validation close to parsing

Do not parse a file in one layer and validate it much later. That makes bad data look trustworthy. Convert files into normalized domain objects immediately.

Example JSON validation pattern:

```js
function validateImportConfig(data) {
  if (typeof data.workspaceId !== 'string' || !data.workspaceId) {
    throw new Error('workspaceId must be a non-empty string');
  }

  if (!Array.isArray(data.rules)) {
    throw new Error('rules must be an array');
  }

  return {
    workspaceId: data.workspaceId,
    rules: data.rules.map(function (rule, index) {
      if (typeof rule.name !== 'string' || !rule.name) {
        throw new Error('rules[' + index + '].name must be a non-empty string');
      }

      return {
        name: rule.name,
        enabled: Boolean(rule.enabled)
      };
    })
  };
}
```

### 4. Surface precise failure messages

Bad uploads are inevitable. Good ingestion tells the caller exactly what failed:

- Unsupported file type
- Missing required column
- Malformed JSON
- Image dimensions exceed allowed maximum
- File too large

That clarity reduces both support work and dangerous retry behavior.

## Critical Rules

- Never trust file extension alone. MIME type, extension, and actual parse success should all agree.
- Enforce size limits before deep parsing, especially for images and large CSV uploads.
- Normalize field names and values before handing data to downstream systems.
- Reject malformed rows with row-level context so users can fix their files quickly.
- Image uploads can contain orientation and color-space surprises. Read metadata before assuming width and height semantics.

## AI Mistakes to Avoid During Vibe Coding

- Do not trust `file.originalname` or browser-reported MIME type as proof of file safety. AI-generated upload code often checks one signal and skips actual content validation.
- Do not parse first and validate later. Bad data should be rejected at the ingestion boundary before it can look trustworthy elsewhere in the system.
- Do not assume CSV is harmless text. Spreadsheet-oriented CSV content can carry formula-style values beginning with `=`, `+`, `-`, or `@`, which may need sanitization before export or round-trip workflows.
- Do not assume all text files are clean UTF-8 with perfect headers. Real uploads include BOM markers, inconsistent column names, blank lines, and mixed casing.
- Do not assume image width and height tell the whole story. Orientation, alpha channels, color space, and oversized dimensions all matter when downstream rendering is involved.
- Do not return vague parse errors. The caller should know whether the failure was size, type, schema, encoding, or row-level content.

## Dependencies

- `csv-parse` for robust CSV parsing with headers and whitespace handling
- `sharp` for image metadata extraction, resizing, and format normalization
- `fs` and `path` from Node.js for file access and extension checks
- Optional `file-type` when MIME sniffing from raw bytes is required
