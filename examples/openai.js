// Example: Using ai-skillkit with OpenAI API
// This shows how to make OpenAI coding agents more reliable with reusable skills

const skillkit = require('ai-skillkit');

// Option 1: Compose all skills into system prompt
function buildSystemPromptWithAllSkills() {
  const skillsPrompt = skillkit.compose({
    includeMetadata: true,
    format: 'markdown'
  });

  return [
    'You are an expert coding assistant.',
    'Follow these reusable skills when the task matches their triggers:',
    '',
    skillsPrompt
  ].join('\n');
}

// Option 2: Recommend and compose relevant skills based on user request
function buildSystemPromptForTask(userTask) {
  const relevantSkills = skillkit.recommend(userTask, { limit: 3 });
  const skillNames = relevantSkills.map(function (skill) {
    return skill.name;
  });

  const focusedPrompt = skillkit.compose({
    skills: skillNames,
    includeMetadata: true,
    format: 'markdown'
  });

  return [
    'You are an expert coding assistant.',
    'For this task, follow these relevant skills:',
    '',
    focusedPrompt,
    '',
    'User task: ' + userTask
  ].join('\n');
}

// Example usage with OpenAI SDK
async function callOpenAI(userMessage) {
  // Uncomment and add your OpenAI key to use:
  // const OpenAI = require('openai');
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = buildSystemPromptForTask(userMessage);

  console.log('System prompt length:', systemPrompt.length, 'characters');
  console.log('\nSystem prompt preview:');
  console.log(systemPrompt.substring(0, 500) + '...\n');

  // const completion = await openai.chat.completions.create({
  //   model: 'gpt-4',
  //   messages: [
  //     { role: 'system', content: systemPrompt },
  //     { role: 'user', content: userMessage }
  //   ]
  // });
  //
  // return completion.choices[0].message.content;
}

// Demo
const userTask = 'Build a React component that uploads and validates CSV files with accessible error states';
callOpenAI(userTask);

module.exports = {
  buildSystemPromptWithAllSkills: buildSystemPromptWithAllSkills,
  buildSystemPromptForTask: buildSystemPromptForTask
};
