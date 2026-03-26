---
name: docx
description: Create and update Microsoft Word documents with structured content, templates, tables, and brand-safe formatting.
triggers:
  - Use when the output must be a .docx file that stakeholders can edit in Word or Google Docs
  - Use when reports, proposals, letters, or contracts need to be generated from structured data
  - Use when non-developers care about document layout and need a repeatable authoring workflow
anti-triggers:
  - Do not use when the final artifact must be print-locked or digitally signed; use the pdf skill instead
  - Do not use when the deliverable is a presentation deck; use the pptx skill instead
  - Do not use when the primary output is tabular analysis; use the xlsx skill instead
---
# DOCX Skill

## Quick Reference

| Task | Approach |
| --- | --- |
| Generate a report from application data | Build the document from normalized JSON using `docx` sections, headings, and tables |
| Fill a repeatable business template | Use `docxtemplater` with merge fields so layout can be edited outside code |
| Create branded proposals | Centralize typography, spacing, and heading helpers before adding content |
| Insert tabular data | Normalize rows first, then render a fixed-width table with explicit headers |
| Update an existing Word file | Prefer template-based regeneration over brittle low-level document mutation |

## Step-by-Step Instructions

### 1. Start from structured data, not freeform strings

A Word document is easiest to maintain when the content model is explicit before layout begins.

```js
const proposal = {
  clientName: 'Northwind Health',
  projectName: 'Claims Automation Rollout',
  preparedBy: 'Apex Systems',
  summary: 'Replace manual intake with a rules-driven workflow and audit trail.',
  milestones: [
    { name: 'Discovery', owner: 'Strategy', weeks: 2 },
    { name: 'Implementation', owner: 'Delivery', weeks: 6 },
    { name: 'Training', owner: 'Enablement', weeks: 1 }
  ]
};
```

Keep data shaping outside the document builder. The builder should receive already-clean values.

### 2. Generate a `.docx` file with `docx`

Use `docx` when your team owns document structure in code and needs deterministic output.

```js
const fs = require('fs');
const {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType
} = require('docx');

const proposal = {
  clientName: 'Northwind Health',
  projectName: 'Claims Automation Rollout',
  preparedBy: 'Apex Systems',
  summary: 'Replace manual intake with a rules-driven workflow and audit trail.',
  milestones: [
    { name: 'Discovery', owner: 'Strategy', weeks: 2 },
    { name: 'Implementation', owner: 'Delivery', weeks: 6 },
    { name: 'Training', owner: 'Enablement', weeks: 1 }
  ]
};

function heading(text, level) {
  return new Paragraph({
    text: text,
    heading: level,
    spacing: { after: 180 }
  });
}

function body(text) {
  return new Paragraph({
    children: [new TextRun({ text: text, size: 24 })],
    spacing: { after: 140 }
  });
}

const milestoneRows = [
  new TableRow({
    children: ['Milestone', 'Owner', 'Weeks'].map(function (label) {
      return new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })]
      });
    })
  })
].concat(
  proposal.milestones.map(function (item) {
    return new TableRow({
      children: [item.name, item.owner, String(item.weeks)].map(function (value) {
        return new TableCell({
          children: [new Paragraph(String(value))]
        });
      })
    });
  })
);

const doc = new Document({
  creator: 'ai-skillkit',
  title: proposal.projectName + ' Proposal',
  description: 'Client proposal for ' + proposal.clientName,
  sections: [
    {
      properties: {},
      children: [
        heading(proposal.projectName, HeadingLevel.TITLE),
        body('Client: ' + proposal.clientName),
        body('Prepared by: ' + proposal.preparedBy),
        heading('Executive Summary', HeadingLevel.HEADING_1),
        body(proposal.summary),
        heading('Milestones', HeadingLevel.HEADING_1),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: milestoneRows
        })
      ]
    }
  ]
});

Packer.toBuffer(doc)
  .then(function (buffer) {
    fs.writeFileSync('proposal.docx', buffer);
    console.log('Created proposal.docx');
  })
  .catch(function (error) {
    console.error(error);
    process.exit(1);
  });
```

### 3. Use a template workflow when layout is owned by business users

If marketing or operations edits wording and spacing directly in Word, use merge fields and regenerate the document from a template instead of manually modifying XML.

```js
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const templateBinary = fs.readFileSync('templates/proposal-template.docx', 'binary');
const zip = new PizZip(templateBinary);
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

doc.render({
  client_name: 'Northwind Health',
  project_name: 'Claims Automation Rollout',
  summary: 'Replace manual intake with a rules-driven workflow and audit trail.',
  milestones: [
    { name: 'Discovery', owner: 'Strategy', weeks: 2 },
    { name: 'Implementation', owner: 'Delivery', weeks: 6 },
    { name: 'Training', owner: 'Enablement', weeks: 1 }
  ]
});

const output = doc.getZip().generate({ type: 'nodebuffer' });
fs.writeFileSync('proposal-from-template.docx', output);
```

This is the right path when copy changes often but the data model stays stable.

### 4. Validate the output in more than one viewer

Before shipping the document:

1. Open it in Microsoft Word.
2. Open it in LibreOffice or Google Docs if cross-tool compatibility matters.
3. Confirm tables do not wrap unexpectedly.
4. Confirm heading order and spacing remain intact after edits.
5. Regenerate from a different data set to catch overflow early.

## Critical Rules

- Treat the document as a rendered artifact. Regenerate from source data instead of editing individual XML parts unless you have no alternative.
- Normalize dates, currency, and optional fields before rendering. Conditional logic inside document layout becomes brittle fast.
- Use explicit table headers and fixed document structure when the file is likely to be revised by other teams.
- Test with long names, long paragraphs, and empty arrays. Word layout failures usually show up at the content extremes.
- If you need tracked changes, comments, or deep editing of an existing `.docx`, verify the library can preserve those features before committing to the workflow.

## AI Mistakes to Avoid During Vibe Coding

- Do not tell yourself that a `.docx` file is easy to patch in place. AI-generated code often underestimates how fragile direct document mutation is and breaks styles, numbering, comments, or tracked changes.
- Do not build the entire document from giant concatenated strings. Generate sections, paragraphs, runs, and tables from structured data so formatting and optional fields stay predictable.
- Do not assume template variables are all present. Missing merge keys, empty loops, and renamed placeholders are one of the most common causes of broken output in template-based flows.
- Do not trust a sample data set with short values. Long client names, multiline paragraphs, empty arrays, and missing fields are the cases that expose wrapping and spacing bugs.
- Do not mix business rules and layout code in one function. When AI writes both together, later edits usually break the document structure in subtle ways.
- Do not ship after only checking that the file opens. Open it in Word, edit a few fields manually, save again, and confirm the structure still behaves correctly.

## Dependencies

- `docx` for code-driven document generation
- `docxtemplater` for merge-field templating against business-owned templates
- `pizzip` for loading and writing `.docx` zip content in template workflows
- `fs` from Node.js for file output
