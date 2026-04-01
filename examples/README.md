# ai-skillkit Examples

This directory contains integration examples showing how to use `ai-skillkit` with popular AI coding tools.

## Examples

- **[openai.js](./openai.js)** - Using ai-skillkit with OpenAI GPT models
- **[claude.js](./claude.js)** - Using ai-skillkit with Anthropic Claude
- **[cursor-windsurf.md](./cursor-windsurf.md)** - Using ai-skillkit with Cursor and Windsurf IDEs
- **[custom-agent.js](./custom-agent.js)** - Building a custom coding agent with ai-skillkit

## Quick Start

All examples follow the same pattern:

1. **Recommend skills** based on the user's task
2. **Compose skills** into a prompt-ready string
3. **Send to AI** as system prompt or context

```js
const skillkit = require('ai-skillkit');

// Get relevant skills for the task
const skills = skillkit.recommend('Build a React CSV upload form');

// Compose into a prompt
const prompt = skillkit.compose({
  skills: skills.map(s => s.name),
  includeMetadata: true,
  format: 'markdown'
});

// Use in your AI call
// system: prompt
// user: task
```

## Why use ai-skillkit

- **Fewer hallucinations** - AI follows proven patterns instead of guessing
- **Better code quality** - Skills include critical rules and anti-patterns
- **Faster development** - AI inherits working examples and dependencies
- **Team consistency** - Everyone's AI follows the same standards

## Running examples

```bash
# Install dependencies
npm install ai-skillkit

# Run OpenAI example
node examples/openai.js

# Run Claude example
node examples/claude.js

# Run custom agent example
node examples/custom-agent.js
```

## Adding your own examples

1. Create a new file in `examples/`
2. Import `ai-skillkit`
3. Show how to integrate with your AI tool
4. Add to this README

## Learn more

- [Main README](../README.md)
- [Getting Started Guide](../GETTING_STARTED.md)
- [API Documentation](../README.md#programmatic-usage)
