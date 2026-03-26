---
name: xlsx
description: Generate Excel spreadsheets with formulas, tables, formatting, frozen panes, and high-volume export patterns.
triggers:
  - Use when the output is a spreadsheet that humans will sort, filter, or extend in Excel
  - Use when business data needs formulas, tabs, formatting, or validation rules
  - Use when a recurring export must preserve structure across runs
anti-triggers:
  - Do not use when the final output is a print-safe fixed document; use the pdf skill instead
  - Do not use when the artifact is narrative prose; use the docx skill instead
  - Do not use when the task is mainly UI implementation; use the frontend skill instead
---
# XLSX Skill

## Quick Reference

| Task | Approach |
| --- | --- |
| Export a business report to Excel | Use `exceljs`, define columns explicitly, and write normalized rows |
| Deliver analyst-friendly workbooks | Freeze headers, apply number formats, and add Excel tables |
| Add formulas safely | Write formulas after data rows are in place and keep ranges deterministic |
| Handle very large exports | Use the streaming workbook writer to avoid memory spikes |
| Support downstream editing | Prefer plain cells, tables, and formulas over image-heavy or merged-cell layouts |

## Step-by-Step Instructions

### 1. Design the workbook around how people will use it

Ask these questions before generating anything:

- Will the recipient sort and filter rows?
- Do they need formulas to remain editable?
- Does each worksheet represent a different workflow or merely a different view?
- Will the file grow beyond memory-friendly limits?

If analysts are going to touch the workbook, optimize for clarity over visual flair.

### 2. Generate a well-structured workbook with `exceljs`

```js
const ExcelJS = require('exceljs');

async function buildPipelineWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ai-skillkit';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Pipeline', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  const rows = [
    { deal: 'Northwind Renewal', owner: 'Ava', stage: 'Proposal', amount: 85000, probability: 0.7 },
    { deal: 'Fabrikam Expansion', owner: 'Leo', stage: 'Negotiation', amount: 120000, probability: 0.5 },
    { deal: 'Contoso Pilot', owner: 'Mia', stage: 'Discovery', amount: 42000, probability: 0.3 }
  ];

  sheet.columns = [
    { header: 'Deal', key: 'deal', width: 28 },
    { header: 'Owner', key: 'owner', width: 16 },
    { header: 'Stage', key: 'stage', width: 18 },
    { header: 'Amount', key: 'amount', width: 14 },
    { header: 'Probability', key: 'probability', width: 14 },
    { header: 'Weighted Revenue', key: 'weightedRevenue', width: 18 }
  ];

  rows.forEach(function (row) {
    const record = Object.assign({}, row, {
      weightedRevenue: row.amount * row.probability
    });
    sheet.addRow(record);
  });

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEAF2FF' }
  };

  sheet.getColumn('amount').numFmt = '$#,##0.00';
  sheet.getColumn('probability').numFmt = '0%';
  sheet.getColumn('weightedRevenue').numFmt = '$#,##0.00';

  const totalRowNumber = rows.length + 2;
  sheet.getCell('E' + totalRowNumber).value = 'Total Weighted Revenue';
  sheet.getCell('E' + totalRowNumber).font = { bold: true };
  sheet.getCell('F' + totalRowNumber).value = {
    formula: 'SUM(F2:F' + (rows.length + 1) + ')'
  };
  sheet.getCell('F' + totalRowNumber).numFmt = '$#,##0.00';
  sheet.getCell('F' + totalRowNumber).font = { bold: true };

  sheet.addTable({
    name: 'PipelineTable',
    ref: 'A1',
    headerRow: true,
    style: {
      theme: 'TableStyleMedium2',
      showRowStripes: true
    },
    columns: [
      { name: 'Deal' },
      { name: 'Owner' },
      { name: 'Stage' },
      { name: 'Amount' },
      { name: 'Probability' },
      { name: 'Weighted Revenue' }
    ],
    rows: rows.map(function (row) {
      return [
        row.deal,
        row.owner,
        row.stage,
        row.amount,
        row.probability,
        row.amount * row.probability
      ];
    })
  });

  await workbook.xlsx.writeFile('pipeline-report.xlsx');
}

buildPipelineWorkbook().catch(function (error) {
  console.error(error);
  process.exit(1);
});
```

### 3. Stream very large exports instead of holding everything in memory

When row counts are high, use the streaming writer.

```js
const ExcelJS = require('exceljs');

async function buildLargeExport() {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    filename: 'large-export.xlsx'
  });
  const sheet = workbook.addWorksheet('Events');

  sheet.columns = [
    { header: 'Event ID', key: 'id', width: 16 },
    { header: 'Type', key: 'type', width: 18 },
    { header: 'Created At', key: 'createdAt', width: 24 }
  ];

  for (let i = 1; i <= 50000; i += 1) {
    sheet.addRow({
      id: 'evt_' + i,
      type: i % 2 === 0 ? 'processed' : 'queued',
      createdAt: new Date().toISOString()
    }).commit();
  }

  await workbook.commit();
}

buildLargeExport().catch(function (error) {
  console.error(error);
  process.exit(1);
});
```

### 4. Validate with actual spreadsheet users in mind

Before shipping:

1. Open in Excel, not just a browser preview.
2. Confirm filters and sorting work as expected.
3. Verify formulas survive copy/paste and row insertion.
4. Check date, currency, and percentage formats on the target locale.
5. Load a realistic large data set to test performance.

## Critical Rules

- Always define columns explicitly. Column order drift is one of the easiest ways to break downstream workflows.
- Keep merged cells rare. They look nice and behave badly.
- Add formulas only after row counts are known so ranges stay correct.
- Format cells intentionally. If finance users open a workbook full of raw decimals, the export is not production-ready.
- For large exports, stream rows and commit frequently to avoid memory pressure.

## AI Mistakes to Avoid During Vibe Coding

- Do not assume numbers, dates, and percentages will be interpreted correctly just because the raw values are present. AI-generated spreadsheet code often forgets number formats and leaves analysts with misleading cells.
- Do not hardcode formula ranges before the final row count is known. Off-by-one mistakes in totals and summary rows are one of the most common spreadsheet bugs.
- Do not overuse merged cells, decorative formatting, or floating labels. Those choices make filtering, sorting, copy-paste, and downstream editing much worse.
- Do not forget spreadsheet injection risk when exporting untrusted text. Values beginning with `=`, `+`, `-`, or `@` can be interpreted as formulas by spreadsheet tools and should be sanitized when exporting user-controlled content.
- Do not generate giant workbooks in memory when the row count can spike. Streaming writers exist for a reason and should be the default for large exports.
- Do not validate only with one happy-path workbook. Test sorting, filtering, formulas, locale formatting, and opening the file in actual Excel.

## Dependencies

- `exceljs` for workbook creation, styling, formulas, and streaming writes
- Structured JSON or database output normalized before row generation
- Optional domain-specific validation rules if the workbook must reject invalid edits
