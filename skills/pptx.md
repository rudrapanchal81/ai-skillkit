---
name: pptx
description: Build PowerPoint presentations programmatically with consistent layouts, theme choices, speaker-ready structure, and chart support.
triggers:
  - Use when the deliverable is a PowerPoint deck that must be editable by humans after generation
  - Use when repeated status decks, investor updates, or sales presentations need consistent structure
  - Use when charts, talking points, and branded layouts must be assembled from live data
anti-triggers:
  - Do not use when the output is a fixed-layout printable document; use the pdf skill instead
  - Do not use when the content is a prose-heavy report; use the docx skill instead
  - Do not use when the main output is spreadsheet analysis; use the xlsx skill instead
---
# PPTX Skill

## Quick Reference

| Task | Approach |
| --- | --- |
| Build a recurring business review deck | Create slide factory helpers for title, metrics, and chart slides |
| Keep brand consistency | Set theme fonts, color tokens, and layout constants once at the top |
| Add charts from application data | Normalize labels and values before calling `addChart` |
| Create speaker-friendly slides | Limit each slide to one message and use notes outside the slide body |
| Generate editable output | Use `pptxgenjs` so teams can fine-tune in PowerPoint after export |

## Step-by-Step Instructions

### 1. Decide the deck narrative before writing code

Strong slide generation starts with a stable outline. A good deck has a beginning, middle, and end:

1. Context slide
2. Evidence slide
3. Decision or recommendation slide

Keep each slide focused on one point. If you cannot state the slide message in one sentence, split it.

### 2. Generate a branded deck with `pptxgenjs`

```js
const pptxgen = require('pptxgenjs');

async function buildQuarterlyUpdate() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'ai-skillkit';
  pptx.company = 'Apex Systems';
  pptx.subject = 'Quarterly business review';
  pptx.title = 'Q1 Business Review';
  pptx.theme = {
    headFontFace: 'Aptos Display',
    bodyFontFace: 'Aptos',
    lang: 'en-US'
  };

  const colors = {
    navy: '16324F',
    blue: '2D6CDF',
    ink: '1F2937',
    gray: '6B7280',
    soft: 'EEF4FF',
    green: '157F3B'
  };

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: 'F7FAFC' };
  titleSlide.addText('Q1 Business Review', {
    x: 0.6,
    y: 0.7,
    w: 8.5,
    h: 0.6,
    fontFace: 'Aptos Display',
    fontSize: 24,
    bold: true,
    color: colors.navy
  });
  titleSlide.addText('Northwind Health | Automation Program', {
    x: 0.6,
    y: 1.4,
    w: 6,
    h: 0.3,
    fontSize: 11,
    color: colors.gray
  });
  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0.6,
    y: 2.0,
    w: 2.4,
    h: 0.45,
    fill: { color: colors.blue },
    line: { color: colors.blue }
  });
  titleSlide.addText('Outcome: ship intake automation in Q2', {
    x: 0.75,
    y: 2.1,
    w: 4.8,
    h: 0.2,
    color: 'FFFFFF',
    fontSize: 11,
    bold: true
  });

  const metricsSlide = pptx.addSlide();
  metricsSlide.addText('Program Highlights', {
    x: 0.6,
    y: 0.5,
    w: 4,
    h: 0.4,
    fontSize: 22,
    bold: true,
    color: colors.navy
  });

  const cards = [
    { label: 'Cycle time reduction', value: '38%', color: colors.blue },
    { label: 'Automation coverage', value: '71%', color: colors.green },
    { label: 'Open risks', value: '3', color: colors.ink }
  ];

  cards.forEach(function (card, index) {
    const x = 0.6 + index * 3.0;
    metricsSlide.addShape(pptx.ShapeType.roundRect, {
      x: x,
      y: 1.3,
      w: 2.5,
      h: 1.4,
      rectRadius: 0.08,
      fill: { color: colors.soft },
      line: { color: colors.soft }
    });
    metricsSlide.addText(card.value, {
      x: x + 0.15,
      y: 1.55,
      w: 2.1,
      h: 0.35,
      fontSize: 24,
      bold: true,
      color: card.color,
      align: 'center'
    });
    metricsSlide.addText(card.label, {
      x: x + 0.12,
      y: 2.08,
      w: 2.2,
      h: 0.3,
      fontSize: 10,
      color: colors.gray,
      align: 'center'
    });
  });

  const chartSlide = pptx.addSlide();
  chartSlide.addText('Throughput by Month', {
    x: 0.6,
    y: 0.5,
    w: 4.5,
    h: 0.4,
    fontSize: 22,
    bold: true,
    color: colors.navy
  });
  chartSlide.addChart(pptx.ChartType.bar, [
    {
      name: 'Processed cases',
      labels: ['Jan', 'Feb', 'Mar'],
      values: [420, 510, 640]
    }
  ], {
    x: 0.7,
    y: 1.2,
    w: 6.6,
    h: 3.8,
    catAxisLabelFontSize: 10,
    valAxisLabelFontSize: 10,
    showLegend: false,
    chartColors: [colors.blue],
    valAxisMinVal: 0,
    valAxisMaxVal: 700,
    valAxisMajorUnit: 100
  });
  chartSlide.addText([
    { text: 'Decision needed: ', options: { bold: true } },
    { text: 'approve two additional automation rules for the April release.' }
  ], {
    x: 7.6,
    y: 1.5,
    w: 2.3,
    h: 1.5,
    fontSize: 12,
    color: colors.ink,
    margin: 0.08,
    breakLine: false
  });

  await pptx.writeFile({ fileName: 'q1-business-review.pptx' });
}

buildQuarterlyUpdate().catch(function (error) {
  console.error(error);
  process.exit(1);
});
```

### 3. Use slide factories for repeatable decks

Once a deck repeats every week or month, hide layout details in helpers such as `addTitleSlide`, `addMetricCards`, and `addDecisionSlide`. The data should vary; the visual grammar should not.

### 4. Validate in presentation mode

Before handoff:

1. Open the deck in Microsoft PowerPoint.
2. Start slideshow mode and verify text sizes from a distance.
3. Check chart labels for truncation.
4. Confirm that the first slide clearly states the point of the deck.
5. Make sure editing in PowerPoint does not break alignment.

## Critical Rules

- One slide, one idea. Generated decks become unreadable when code tries to cram every data point onto one page.
- Treat layout values as tokens. Scattershot magic numbers make deck maintenance painful.
- Use charts only when they change the decision quality. If a sentence is clearer than a chart, use the sentence.
- Keep speaker notes and appendix material out of the main narrative flow.
- Test on the actual aspect ratio your audience expects, usually 16:9.

## AI Mistakes to Avoid During Vibe Coding

- Do not trust a generated slide just because nothing overlaps in one sample run. PPTX code fails most often when titles, labels, and chart captions get longer than expected.
- Do not scatter positioning numbers across every slide. AI-generated deck code becomes unmaintainable fast when spacing, font sizes, and card widths are not centralized.
- Do not put multiple messages on one slide because the data is available. The deck becomes harder to present and easier to ignore.
- Do not assume chart labels and legends will remain readable after export. Small fonts, long category names, and narrow charts create unreadable business slides.
- Do not optimize only for the canvas editor view. Start slideshow mode and review the deck full-screen, because presentation mode exposes hierarchy and contrast problems quickly.
- Do not forget post-export editing. A slide that looks correct but falls apart when someone tweaks text in PowerPoint is not production-ready.

## Dependencies

- `pptxgenjs` for PowerPoint generation and chart support
- Source data from JSON, APIs, or database queries normalized before rendering
- Optional brand assets such as logos and custom fonts if your deck requires them
