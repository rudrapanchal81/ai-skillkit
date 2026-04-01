# Getting Started with ai-skillkit

## Why Every AI Coding Project Needs This

When you build with AI coding assistants (OpenAI, Claude, Cursor, Windsurf), you face these problems:

- **Hallucinations** - AI invents APIs that don't exist
- **Inconsistency** - Different results every time
- **No guardrails** - AI doesn't know what NOT to do
- **Reinventing patterns** - AI rediscovers solutions from scratch
- **Dependency confusion** - AI suggests wrong package versions

`ai-skillkit` solves this by giving AI agents **reusable, validated skills** with:

- ✓ Clear triggers (when to use)
- ✓ Anti-triggers (when NOT to use)
- ✓ Working code patterns
- ✓ Critical rules (mistakes to avoid)
- ✓ Correct dependencies

## Install

```bash
npm install ai-skillkit
```

## 10-Second Quickstart (One-Line Vibe Coding)

```ts
import { getVibePrompt } from 'ai-skillkit';

const systemPrompt = getVibePrompt();
// All basic skills applied automatically - use with OpenAI, Claude, Cursor, etc.
```

That's it! All basic skills are now loaded and ready for your AI model.

## 30-Second Quickstart (Custom Skills)

```js
const skillkit = require('ai-skillkit');

// Get relevant skills for your task
const skills = skillkit.recommend('Build a React CSV upload form with validation');

// Compose into AI-ready prompt
const prompt = skillkit.compose({
  skillOne-line vibe coding (simplest)

```ts
import { getVibePrompt } from 'ai-skillkit';

const systemPrompt = getVibePrompt();
// Use with any AI model - OpenAI, Claude, Cursor, Windsurf, etc.
```

### 2. s: skills.map(s => s.name),
  includeMetadata: true,
  format: 'markdown'
});
3
// Use in your AI system prompt
console.log(prompt);
```

## Common Use Cases

### 1. Make OpenAI more reliable

```js
const skillkit = require('ai-skillkit');

const systemPrompt = [
  'You are an expert coding assistant.',
  skillkit.compose({ includeMetadata: true, format: 'markdown' })
].jo4n('\n\n');

// Use systemPrompt in your OpenAI call
```

### 2. Make Claude follow your patterns

```js
const skillkit = require('ai-skillkit');

cons5 relevantSkills = skillkit.recommend(userTask);
const systemPrompt = skillkit.compose({
  skills: relevantSkills.map(s => s.name),
  includeMetadata: true,
  format: 'markdown'
});

// Use systemPrompt in your Claude call
```

### 3. Make Cursor/Windsurf consistent

```bash
# Generate .cursorrules for your project
npx ai-skillkit compose --metadata --format markdown > .cursorrules

# Or for specific skills
npx ai-skillkit compose frontend file-reading --metadata > .cursorrules
```

### 4. Add team-specific skills

```bash
# Create custom skills directory
mkdir skills

# Scaffold a new skill
npx ai-skillkit init team-api-patterns

# Edit skills/team-api-patterns.md with your patterns

# Validate before using
npx ai-skillkit validate --dir ./skills

# Compose bundled + custom skills
npx ai-skillkit compose --dir ./skills --metadata > .cursorrules
```

## What's Included

### Bundled Skills

- **docx** - Generate Word documents
- **pdf** - Create and manipulate PDFs
- **pptx** - Build PowerPoint presentations
- **xlsx** - Produce Excel workbooks
- **frontend** - React and CSS patterns
- **file-reading** - Parse CSV, JSON, images

### API Methods

```js
skillkit.list()                    // List all skills
skillkit.get('frontend')           // Get raw skill content
skillkit.parse('frontend')         // Get parsed skill object
skillkit.search('react')           // Search skills
skillkit.recommend('task')         // Get relevant skills
skillkit.compose(options)          // Bundle into prompt
skillkit.validate('frontend')      // Check skill validity
skillkit.createCollection('./dir') // Load custom skills
```

### CLI Commands

```bash
npx ai-skillkit list
npx ai-skillkit get frontend
npx ai-skillkit search react
npx ai-skillkit recommend "build a form"
npx ai-skillkit compose frontend file-reading
npx ai-skillkit validate frontend
npx ai-skillkit add frontend
npx ai-skillkit init custom-skill
```

## Integration Examples

See the `examples/` directory for:

- [OpenAI integration](./examples/openai.js)
- [Claude integration](./examples/claude.js)
- [Cursor/Windsurf setup](./examples/cursor-windsurf.md)
- [Custom agent builder](./examples/custom-agent.js)

## Why This Makes AI Coding Better

### Before ai-skillkit

```
User: "Build a React CSV upload component"

AI: *invents random CSV parsing library*
AI: *forgets accessibility*
AI: *uses deprecated React patterns*
AI: *no validation logic*
```

### After ai-skillkit

```
User: "Build a React CSV upload component"

AI: *loads frontend + file-reading skills*
AI: *uses proven CSV parsing (papaparse)*
AI: *includes ARIA labels and keyboard nav*
AI: *follows modern React patterns*
AI: *adds validation with clear error states*
```

## Best Practices

### 1. Use `recommend()` for focused tasks

```js
// Better: Only load relevant skills
const skills = skillkit.recommend(userTask);
const prompt = skillkit.compose({ skills: skills.map(s => s.name) });

// Avoid: Loading all skills for every task
const prompt = skillkit.compose(); // Too broad
```

### 2. Include metadata for better AI understanding

```js
// Better: AI knows when to apply each skill
const prompt = skillkit.compose({
  skills: ['frontend', 'file-reading'],
  includeMetadata: true
});

// Avoid: No context about triggers/anti-triggers
const prompt = skillkit.compose(['frontend', 'file-reading']);
```

### 3. Use markdown format for structured prompts

```js
// Better: Easier for AI to parse
const prompt = skillkit.compose({
  skills: ['frontend'],
  format: 'markdown',
  includeMetadata: true
});

// Avoid: Plain text can be harder to parse
const prompt = skillkit.compose({ skills: ['frontend'] });
```

### 4. Validate custom skills before deployment

```js
// Always validate team skills
const validation = skillkit.validateFile('./skills/custom.md');
if (!validation.valid) {
  console.error('Skill errors:', validation.errors);
}
```

### 5. Set maxLength for token budgets

```js
// Better: Prevent prompt overflow
const prompt = skillkit.compose({
  skills: ['frontend', 'file-reading'],
  maxLength: 15000
});

// Avoid: Unbounded prompts can exceed model limits
```

## Troubleshooting

**Q: AI not following skills?**

A: Make sure you're including the composed prompt in your system message, not user message.

**Q: Prompt too long?**

A: Use `recommend()` to pick 2-3 relevant skills instead of all skills, or set `maxLength`.

**Q: Want project-specific patterns?**

A: Create custom skills in `skills/` directory and use `createCollection('./skills')`.

**Q: Skills not loading in Cursor/Windsurf?**

A: Make sure `.cursorrules` is in project root and restart the IDE.

## Next Steps

1. **Try the examples** - Run `node examples/openai.js`
2. **Add to your project** - Integrate with your AI tool
3. **Create custom skills** - Add team-specific patterns
4. **Share with team** - Standardize AI behavior

## Learn More

- [Full API Documentation](./README.md#programmatic-usage)
- [CLI Usage](./README.md#cli-usage)
- [Integration Examples](./examples/)
- [Contributing Guide](./README.md#contributing-guide)

## Support

- GitHub Issues: https://github.com/rudrapanchal81/ai-skillkit/issues
- npm: https://www.npmjs.com/package/ai-skillkit

---

**Make your AI coding agents more reliable. Start with `npm install ai-skillkit`.**
