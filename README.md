# ai-skillkit

`ai-skillkit` is a publish-ready npm package that bundles reusable `SKILL.md` files for AI agents. Each skill is a self-contained operating manual: when to use it, when not to use it, what dependencies matter, the fastest safe path to execution, and concrete code examples that work in real-world projects.

## What `SKILL.md` files are and why they matter

A strong `SKILL.md` file gives an AI agent durable, opinionated guidance for a repeatable class of tasks. Instead of rediscovering patterns from scratch, the agent can load a skill and immediately inherit:

- Clear triggers and anti-triggers
- A quick decision table for common requests
- Working implementation patterns with code
- Critical rules that prevent common failures
- A dependencies checklist for the target stack

This package ships skills for document generation, presentation building, spreadsheet automation, frontend UI work, and uploaded-file parsing.

## Installation

```bash
npm install ai-skillkit
```

## Bundled skills

| Skill | Description |
| --- | --- |
| `docx` | Generate and template Microsoft Word documents for reports, proposals, and contracts. |
| `pdf` | Create, merge, stamp, and render PDFs using dependable Node.js workflows. |
| `pptx` | Build PowerPoint decks programmatically with layout, theme, and chart patterns. |
| `xlsx` | Produce Excel workbooks with tables, formulas, formatting, and large-data strategies. |
| `frontend` | Design React and CSS-driven interfaces with accessibility, state, and layout discipline. |
| `file-reading` | Parse uploaded CSV, JSON, and image files safely with validation and normalization. |

## Programmatic usage

```js
const skillkit = require('ai-skillkit');

console.log(skillkit.list());
console.log(skillkit.get('docx'));
console.log(skillkit.parse('pdf'));
console.log(skillkit.search('spreadsheet'));
```

### `list()`

Returns all bundled skill names.

```js
const skillkit = require('ai-skillkit');
const names = skillkit.list();
```

### `get(name)`

Returns the raw `SKILL.md` content as a string.

```js
const skillkit = require('ai-skillkit');
const markdown = skillkit.get('frontend');
```

### `parse(name)`

Returns a normalized metadata object.

```js
const skillkit = require('ai-skillkit');
const skill = skillkit.parse('xlsx');

console.log(skill.name);
console.log(skill.title);
console.log(skill.description);
console.log(skill.lines);
console.log(skill.size);
```

### `all()`

Returns parsed metadata for every bundled skill.

```js
const skillkit = require('ai-skillkit');
const allSkills = skillkit.all();
```

### `search(query)`

Performs a case-insensitive search across skill content and returns matching parsed skill objects.

```js
const skillkit = require('ai-skillkit');
const matches = skillkit.search('react component');
```

## CLI usage

### List all skills

```bash
npx ai-skillkit list
```

### Print one skill to stdout

```bash
npx ai-skillkit get docx
```

### Copy one skill into your current project

```bash
npx ai-skillkit add pdf
```

This writes `./skills/pdf.md` in your current working directory.

### Copy all bundled skills into your current project

```bash
npx ai-skillkit add --all
```

### Show metadata for a skill

```bash
npx ai-skillkit info frontend
```

### Scaffold a new local skill template

```bash
npx ai-skillkit init api-design
```

This creates `./skills/api-design.md` in your current working directory.

### Search across all skills

```bash
npx ai-skillkit search spreadsheet
```

## How to add your own custom skills

You can keep bundled skills and project-specific skills side by side.

1. Create a `skills/` directory in your project root.
2. Run `npx ai-skillkit init <name>` to scaffold a new skill.
3. Fill in the frontmatter, quick reference table, implementation steps, critical rules, and dependencies.
4. Keep one skill focused on one category of work so an agent can select it confidently.
5. Store the file in version control so your team and agents share the same operating manual.

A good custom skill should answer these questions immediately:

- When should the agent load this skill?
- What should the agent avoid doing?
- What concrete sequence produces the desired artifact?
- What dependencies are required?
- What failure modes must be checked before handoff?

## Contributing guide

Contributions are welcome if they make the skills more practical, more reliable, or easier for agents to apply.

1. Fork or clone the repository.
2. Add or improve a skill in `skills/`.
3. Keep examples executable and avoid filler text.
4. Preserve zero runtime dependencies for the published package itself.
5. Run `npm test` before opening a pull request.
6. Update the README skills registry if you add a new bundled skill.

## Development

```bash
npm test
```

The test suite uses Node's built-in `assert` module and exercises both the programmatic API and CLI behavior.

## License

MIT
