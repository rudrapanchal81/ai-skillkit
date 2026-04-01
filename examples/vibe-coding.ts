// Example: One-line vibe coding setup with ai-skillkit
// This is the simplest way to make any AI model follow proven coding patterns

import { getVibePrompt } from 'ai-skillkit';

// That's it! One import, one call.
const systemPrompt = getVibePrompt();

// Now use systemPrompt with any AI model:

// OpenAI example:
// const completion = await openai.chat.completions.create({
//   model: 'gpt-4',
//   messages: [
//     { role: 'system', content: systemPrompt },
//     { role: 'user', content: 'Build a React CSV upload component' }
//   ]
// });

// Claude example:
// const message = await anthropic.messages.create({
//   model: 'claude-3-5-sonnet-20241022',
//   system: systemPrompt,
//   messages: [
//     { role: 'user', content: 'Build a React CSV upload component' }
//   ]
// });

// Cursor/Windsurf: Just paste systemPrompt into .cursorrules

// What you get automatically:
// ✓ All 6 bundled skills (docx, pdf, pptx, xlsx, frontend, file-reading)
// ✓ Metadata included (triggers, anti-triggers, critical rules)
// ✓ Markdown format for better AI parsing
// ✓ Ready to use with any AI model

console.log('System prompt ready!');
console.log('Length:', systemPrompt.length, 'characters');
console.log('\nPreview:');
console.log(systemPrompt.substring(0, 500) + '...');

export { systemPrompt };
