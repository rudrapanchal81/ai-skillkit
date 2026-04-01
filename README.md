# ai-skillkit
  
 [![npm version](https://img.shields.io/npm/v/ai-skillkit.svg)](https://www.npmjs.com/package/ai-skillkit)
 [![npm downloads](https://img.shields.io/npm/dm/ai-skillkit.svg)](https://www.npmjs.com/package/ai-skillkit)
 [![test](https://github.com/rudrapanchal81/ai-skillkit/actions/workflows/test.yml/badge.svg)](https://github.com/rudrapanchal81/ai-skillkit/actions/workflows/test.yml)
 [![license](https://img.shields.io/npm/l/ai-skillkit.svg)](https://github.com/rudrapanchal81/ai-skillkit/blob/main/LICENSE)
 
 Reusable prompt skills for AI coding agents, with a zero-dependency JavaScript API and CLI.
 
 `ai-skillkit` helps you make AI agents more reliable by packaging reusable `SKILL.md` files into prompt-ready guidance. Each skill defines when to use it, when not to use it, what workflow to follow, and what mistakes to avoid.
 
 ## Who it is for
 
 - AI app builders who need better system prompts for coding agents
 - Teams standardizing how Claude, OpenAI, Cursor, or Windsurf should behave
 - Developers who want reusable prompt building blocks instead of rewriting long instructions from scratch
 
 ## Why it is useful
 
 - Consistent AI behavior across apps, scripts, and internal agents
 - Reusable prompt composition with bundled or local skills
 - Stronger guardrails through triggers, anti-triggers, critical rules, and common mistakes
 - Fast adoption through both code and CLI workflows
 
 ## Common use cases
 
 - Build a focused system prompt for a coding agent
 - Recommend the best skills for a natural-language task
 - Validate project-local skill files before your team uses them
 - Bundle frontend, file parsing, or document-generation guidance into one AI-ready prompt
 
 ## Installation

```bash
npm install ai-skillkit
```

**New to ai-skillkit?** → [Getting Started Guide](./GETTING_STARTED.md)  
**Want integration examples?** → [Examples Directory](./examples/)

### One-line vibe coding setup

```ts
import { getVibePrompt } from 'ai-skillkit';

const systemPrompt = getVibePrompt();
// All basic skills applied, ready to use with any AI model
```

### Full API usage

Use CommonJS or ESM depending on your app setup.

```js
const skillkit = require('ai-skillkit');
```

```js
import skillkit, { compose, recommend } from 'ai-skillkit';
```

## Quickstart
 
 ```js
 const skillkit = require('ai-skillkit');
 
 const suggestedSkills = skillkit.recommend('Build a React CSV upload flow with validation');
 const prompt = skillkit.compose({
   skills: suggestedSkills.map(function (skill) {
     return skill.name;
   }),
   includeMetadata: true,
   format: 'markdown'
 });
 
 console.log(prompt);
 ```
 
 ## Use in `app.ts`
 
 If you want an AI app to follow bundled baseline skills for vibe coding, compose the relevant skills into the system prompt you send to the model.
 
 ```ts
 import skillkit = require('ai-skillkit');
 
 const baseSkillsPrompt = skillkit.compose();
 const uiUploadPrompt = skillkit.compose(['frontend', 'file-reading']);
 
 function buildAgentPrompt(task: string) {
   return [
     'You are an AI coding agent working inside a product codebase.',
     'Use the bundled skills when the request matches their triggers.',
     uiUploadPrompt,
     'Current task: ' + task
   ].join('\n\n');
 }
 
 const prompt = buildAgentPrompt('Build a React CSV upload flow with validation and accessible states.');
 console.log(prompt);
 console.log(baseSkillsPrompt.length > 0);
 ```
 
 Use `compose()` with no argument to include all bundled skills, or pass one skill name or an array of skill names to create a focused prompt for the current task.
 
 ## What `SKILL.md` files are and why they matter
 
 A strong `SKILL.md` file gives an AI agent durable, opinionated guidance for a repeatable class of tasks. Instead of rediscovering patterns from scratch, the agent can load a skill and immediately inherit:
 
 - Clear triggers and anti-triggers
 - A quick decision table for common requests
 - Working implementation patterns with code
 - Critical rules that prevent common failures
 - A dependencies checklist for the target stack
 
 This package ships skills for document generation, presentation building, spreadsheet automation, frontend UI work, and uploaded-file parsing.
 
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
console.log(skillkit.recommend('Build a React CSV upload flow'));
console.log(skillkit.compose({
  skills: ['frontend', 'file-reading'],
  includeMetadata: true,
  format: 'markdown'
}));
```

### `list()`

Returns all bundled skill names.

```js
const skillkit = require('ai-skillkit');
const names = skillkit.list();
```

### `compose(input?)`

Returns one prompt-ready string containing all bundled skills or a selected subset.

```js
const skillkit = require('ai-skillkit');
const allSkillsPrompt = skillkit.compose();
const focusedPrompt = skillkit.compose(['frontend', 'file-reading']);
const markdownPrompt = skillkit.compose({
  skills: ['frontend', 'file-reading'],
  includeMetadata: true,
  format: 'markdown',
  maxLength: 12000
});
```

`compose()` accepts:

- `skills`: a string or array of skill names
- `includeIntro`: include or skip the top-level prompt preface
- `includeMetadata`: include title, description, triggers, and anti-triggers for each skill
- `format`: `plain` or `markdown`
- `maxLength`: fail fast if the composed prompt exceeds a character budget

### `recommend(query, options?)`

Returns the most relevant skills for a natural-language task description.

```js
const skillkit = require('ai-skillkit');
const suggestions = skillkit.recommend('Create a spreadsheet import form with accessible validation', {
  limit: 2
});
```

### `validate(name)`

Checks whether a bundled skill has the expected frontmatter and required sections.

```js
const skillkit = require('ai-skillkit');
const result = skillkit.validate('frontend');
console.log(result.valid);
```

### `createCollection(dir)`

Loads a custom `skills/` directory and returns the same API surface for local or team-specific skills.

```js
const skillkit = require('ai-skillkit');
const projectSkills = skillkit.createCollection('./skills');
const prompt = projectSkills.compose({ includeMetadata: true });
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

### Compose a prompt bundle from the CLI

```bash
npx ai-skillkit compose frontend file-reading --metadata --format markdown
```

### Recommend skills for a task

```bash
npx ai-skillkit recommend "build a React upload form with validation"
```

### Validate a bundled or local skill

```bash
npx ai-skillkit validate frontend
npx ai-skillkit validate --file ./skills/custom-agent-workflow.md
```

## Integration examples

See the [`examples/`](./examples/) directory for complete integration guides:

- **[OpenAI](./examples/openai.js)** - Using ai-skillkit with GPT models
- **[Claude](./examples/claude.js)** - Using ai-skillkit with Anthropic Claude
- **[Cursor/Windsurf](./examples/cursor-windsurf.md)** - Setup guide for AI IDEs
- **[Custom Agent](./examples/custom-agent.js)** - Building your own coding agent

Each example shows how to make AI coding more reliable by loading relevant skills into the system prompt.

## How to add your own custom skills

You can keep bundled skills and project-specific skills side by side.

1. Create a `skills/` directory in your project root.
2. Run `npx ai-skillkit init <name>` to scaffold a new skill.
3. Fill in the frontmatter, quick reference table, implementation steps, critical rules, and dependencies.
4. Keep one skill focused on one category of work so an agent can select it confidently.
5. Store the file in version control so your team and agents share the same operating manual.
6. Load the directory in code with `skillkit.createCollection('./skills')` when you want project-local composition, validation, and recommendation.

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
