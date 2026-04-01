// Example: Using ai-skillkit with Anthropic Claude API
// This shows how to make Claude coding agents more reliable with reusable skills

const skillkit = require('ai-skillkit');

// Build a system prompt for Claude with relevant skills
function buildClaudeSystemPrompt(userTask) {
  const relevantSkills = skillkit.recommend(userTask, { limit: 3 });
  const skillNames = relevantSkills.map(function (skill) {
    return skill.name;
  });

  const skillsPrompt = skillkit.compose({
    skills: skillNames,
    includeMetadata: true,
    format: 'markdown',
    maxLength: 20000
  });

  return [
    'You are Claude, an expert coding assistant.',
    '',
    'For this task, follow these proven skills and patterns:',
    '',
    skillsPrompt,
    '',
    'Apply the skills when the task matches their triggers.',
    'Respect anti-triggers and critical rules to avoid common mistakes.'
  ].join('\n');
}

// Example usage with Anthropic SDK
async function callClaude(userMessage) {
  // Uncomment and add your Anthropic key to use:
  // const Anthropic = require('@anthropic-ai/sdk');
  // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = buildClaudeSystemPrompt(userMessage);

  console.log('System prompt length:', systemPrompt.length, 'characters');
  console.log('\nRecommended skills for this task:');
  const skills = skillkit.recommend(userMessage, { limit: 3 });
  skills.forEach(function (skill) {
    console.log('  -', skill.name, ':', skill.description);
  });
  console.log('');

  // const message = await anthropic.messages.create({
  //   model: 'claude-3-5-sonnet-20241022',
  //   max_tokens: 4096,
  //   system: systemPrompt,
  //   messages: [
  //     { role: 'user', content: userMessage }
  //   ]
  // });
  //
  // return message.content[0].text;
}

// Demo
const userTask = 'Create a PowerPoint presentation generator with custom themes and charts';
callClaude(userTask);

module.exports = {
  buildClaudeSystemPrompt: buildClaudeSystemPrompt
};
