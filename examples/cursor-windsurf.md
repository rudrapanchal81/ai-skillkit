# Using ai-skillkit with Cursor and Windsurf

This guide shows how to make Cursor and Windsurf AI coding more reliable by loading `ai-skillkit` skills into your project context.

## Why use ai-skillkit with Cursor/Windsurf

- **Consistent coding patterns** across your team
- **Fewer hallucinations** about APIs and dependencies
- **Faster development** with proven workflows
- **Better error prevention** through critical rules and anti-triggers

## Setup

1. Install in your project:

```bash
npm install ai-skillkit
```

2. Add skills to your project's `.cursorrules` or `.windsurfrules`:

```bash
npx ai-skillkit compose > .cursorrules
```

Or for specific skills:

```bash
npx ai-skillkit compose frontend file-reading xlsx > .cursorrules
```

## Option 1: Use bundled skills

Create a `.cursorrules` file in your project root:

```markdown
# Project AI Rules

You are working in a production codebase. Follow these reusable skills:

<!-- Paste output from: npx ai-skillkit compose --metadata --format markdown -->
```

## Option 2: Use recommended skills

For a focused task, get skill recommendations:

```bash
npx ai-skillkit recommend "build a React dashboard with CSV import"
```

Then compose only those skills:

```bash
npx ai-skillkit compose frontend file-reading xlsx --metadata --format markdown > .cursorrules
```

## Option 3: Add custom project skills

1. Create a `skills/` directory in your project
2. Add your team's custom skills:

```bash
npx ai-skillkit init team-api-patterns
npx ai-skillkit init team-testing-workflow
```

3. Compose bundled + local skills:

```bash
npx ai-skillkit compose --dir ./skills --metadata --format markdown > .cursorrules
```

## Best practices

- **Keep skills focused**: One skill per domain (frontend, backend, testing, etc.)
- **Update regularly**: Run `npx ai-skillkit compose` when you add new skills
- **Use metadata**: Include `--metadata` so AI knows when to apply each skill
- **Validate custom skills**: Run `npx ai-skillkit validate --dir ./skills` before committing

## Example `.cursorrules` structure

```markdown
# Project Coding Standards

You are an AI coding assistant working in this codebase.

## When to use skills

- Apply skills when the user's request matches the skill's triggers
- Respect anti-triggers and avoid using skills when they don't apply
- Follow critical rules to prevent common mistakes

## Bundled Skills

<!-- Output from ai-skillkit compose -->

## Project-Specific Skills

<!-- Output from ai-skillkit compose --dir ./skills -->
```

## Verify it works

After adding `.cursorrules`:

1. Open Cursor/Windsurf
2. Ask: "Build a React component that uploads CSV files"
3. The AI should follow the `frontend` and `file-reading` skills automatically

## Troubleshooting

**AI not following skills?**
- Make sure `.cursorrules` is in project root
- Restart Cursor/Windsurf
- Check that skills are formatted correctly

**Skills too long?**
- Use `--max-length 15000` to limit prompt size
- Compose only relevant skills instead of all skills
- Use `recommend` to pick the best 2-3 skills

**Want team-specific patterns?**
- Create custom skills in `skills/` directory
- Use `npx ai-skillkit init <name>` to scaffold
- Validate with `npx ai-skillkit validate --dir ./skills`
