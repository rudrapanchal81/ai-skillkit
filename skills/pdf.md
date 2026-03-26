---
name: pdf
description: Generate, merge, annotate, and manipulate PDF files in Node.js with dependable page-level control.
triggers:
  - Use when the final document must be distribution-ready, fixed-layout, or print-safe
  - Use when multiple PDFs need to be merged, stamped, or post-processed in a pipeline
  - Use when the output must preserve layout exactly across viewers and operating systems
anti-triggers:
  - Do not use when users must freely edit the content in Word; use the docx skill instead
  - Do not use when the output is primarily a slide deck; use the pptx skill instead
  - Do not use when the task is spreadsheet calculation or tabular modeling; use the xlsx skill instead
---
# PDF Skill

## Quick Reference

| Task | Approach |
| --- | --- |
| Generate a PDF from raw business data | Use `pdf-lib` and draw text, shapes, and tables with explicit coordinates |
| Merge existing PDFs | Load each file with `pdf-lib`, copy pages, and save a new combined document |
| Add page numbers or stamps | Iterate pages after composition and draw standardized footer text |
| Fill a mostly static layout | Start from a design template PDF and draw dynamic values into known positions |
| Ship compliance-sensitive output | Validate fonts, page count, margins, and printable rendering before release |

## Step-by-Step Instructions

### 1. Choose the right source of truth

Use PDFs when the layout must not drift. Unlike editable office formats, PDF workflows should optimize for deterministic rendering.

Common patterns:

- Data-driven PDF generation for invoices, certificates, and receipts
- Merge-and-stamp pipelines for legal packets and onboarding kits
- Template-overlay workflows when design is fixed and only values change

### 2. Create a PDF with `pdf-lib`

```js
const fs = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function buildInvoice() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const invoice = {
    number: 'INV-2026-041',
    customer: 'Northwind Health',
    issuedAt: '2026-03-26',
    items: [
      { label: 'Discovery workshop', amount: 1800 },
      { label: 'Workflow implementation', amount: 6400 },
      { label: 'Training session', amount: 900 }
    ]
  };

  const total = invoice.items.reduce(function (sum, item) {
    return sum + item.amount;
  }, 0);

  page.drawText('Invoice', { x: 50, y: 780, size: 24, font: bold, color: rgb(0.1, 0.18, 0.38) });
  page.drawText('Invoice #: ' + invoice.number, { x: 50, y: 745, size: 12, font: font });
  page.drawText('Customer: ' + invoice.customer, { x: 50, y: 727, size: 12, font: font });
  page.drawText('Issued: ' + invoice.issuedAt, { x: 50, y: 709, size: 12, font: font });

  page.drawRectangle({ x: 50, y: 662, width: 495, height: 24, color: rgb(0.92, 0.94, 0.98) });
  page.drawText('Line Item', { x: 60, y: 670, size: 11, font: bold });
  page.drawText('Amount', { x: 470, y: 670, size: 11, font: bold });

  let y = 638;
  invoice.items.forEach(function (item) {
    page.drawText(item.label, { x: 60, y: y, size: 11, font: font });
    page.drawText('$' + item.amount.toFixed(2), { x: 470, y: y, size: 11, font: font });
    y -= 22;
  });

  page.drawLine({ start: { x: 50, y: y + 8 }, end: { x: 545, y: y + 8 }, thickness: 1, color: rgb(0.75, 0.78, 0.84) });
  page.drawText('Total', { x: 390, y: y - 14, size: 12, font: bold });
  page.drawText('$' + total.toFixed(2), { x: 470, y: y - 14, size: 12, font: bold });

  const bytes = await pdf.save();
  fs.writeFileSync('invoice.pdf', bytes);
}

buildInvoice().catch(function (error) {
  console.error(error);
  process.exit(1);
});
```

### 3. Merge multiple PDFs and add page numbers

```js
const fs = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function mergePacket(inputFiles, outputFile) {
  const merged = await PDFDocument.create();

  for (const file of inputFiles) {
    const source = await PDFDocument.load(fs.readFileSync(file));
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach(function (page) {
      merged.addPage(page);
    });
  }

  const font = await merged.embedFont(StandardFonts.Helvetica);
  const totalPages = merged.getPageCount();

  merged.getPages().forEach(function (page, index) {
    page.drawText('Packet page ' + (index + 1) + ' of ' + totalPages, {
      x: 50,
      y: 24,
      size: 9,
      font: font,
      color: rgb(0.35, 0.35, 0.35)
    });
  });

  fs.writeFileSync(outputFile, await merged.save());
}

mergePacket(['cover.pdf', 'terms.pdf', 'appendix.pdf'], 'combined-packet.pdf').catch(function (error) {
  console.error(error);
  process.exit(1);
});
```

### 4. Validate like a publisher, not just a developer

Before handing off a PDF:

1. Confirm every page size is expected.
2. Verify that text does not clip at common zoom levels.
3. Print one sample if print fidelity matters.
4. Check merged files for rotated pages and unexpected page boxes.
5. Re-open the written PDF with the same library to catch write corruption early.

## Critical Rules

- PDF layout is absolute. If data length is unpredictable, you must calculate vertical space before drawing or add pagination logic.
- Never assume fonts are available in the viewer. Embed the fonts you rely on.
- Treat merged third-party PDFs as untrusted input. They may contain odd page dimensions, rotations, or metadata.
- Avoid mixing generation and post-processing concerns in one giant function. Compose first, then stamp or paginate.
- If searchable text matters, do not flatten everything into images.

## AI Mistakes to Avoid During Vibe Coding

- Do not assume text will magically wrap or paginate. AI-generated PDF code often draws content at fixed coordinates until it runs off the page.
- Do not rely on system fonts being available everywhere. If typography matters, embed the fonts and test the rendered output on a second machine.
- Do not merge arbitrary third-party PDFs without checking page size, rotation, and crop boxes. Mixed inputs are a common source of broken packets.
- Do not hardcode one perfect sample layout and call it done. Long names, long tables, and multi-page sections are where PDF code usually fails.
- Do not flatten all dynamic content into images just because it looks easier. That breaks searchability, copy-paste, and often accessibility.
- Do not ship a PDF that only passes a file-open check. Re-open the saved file, inspect page count, and print-test if the document is meant for paper workflows.

## Dependencies

- `pdf-lib` for generation, merging, stamping, and page-level manipulation
- `fs` from Node.js for reading and writing PDF bytes
- Optional `@pdf-lib/fontkit` if custom font embedding is required
