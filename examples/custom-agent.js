// Example: Building a custom coding agent with ai-skillkit
// This shows how to create a reliable coding agent from scratch

const skillkit = require('ai-skillkit');

// Simple coding agent that uses ai-skillkit for reliable behavior
class CodingAgent {
  constructor(options) {
    this.options = options || {};
    this.skillsDir = this.options.skillsDir;
    this.collection = this.skillsDir ? skillkit.createCollection(this.skillsDir) : skillkit;
  }

  buildSystemPrompt(task) {
    const relevantSkills = this.collection.recommend(task, {
      limit: this.options.maxSkills || 3
    });

    const skillNames = relevantSkills.map(function (skill) {
      return skill.name;
    });

    const skillsPrompt = this.collection.compose({
      skills: skillNames,
      includeMetadata: true,
      format: 'markdown',
      maxLength: this.options.maxPromptLength || 20000
    });

    return [
      'You are an expert coding assistant.',
      '',
      'Task: ' + task,
      '',
      'Follow these relevant skills and patterns:',
      '',
      skillsPrompt,
      '',
      'Apply skills when the task matches their triggers.',
      'Respect anti-triggers and critical rules.',
      'Do not invent APIs or dependencies not mentioned in the skills.'
    ].join('\n');
  }

  async execute(task) {
    const systemPrompt = this.buildSystemPrompt(task);

    console.log('Agent executing task:', task);
    console.log('System prompt length:', systemPrompt.length, 'characters');
    console.log('\nRelevant skills:');
    
    const skills = this.collection.recommend(task, { limit: 3 });
    skills.forEach(function (skill) {
      console.log('  -', skill.name);
      console.log('    Triggers:', skill.triggers.join(', '));
      console.log('    Anti-triggers:', skill.antiTriggers.join(', '));
    });

    // Here you would call your AI model with systemPrompt
    // For example:
    // const response = await callYourAIModel(systemPrompt, task);
    // return response;

    return {
      systemPrompt: systemPrompt,
      skills: skills
    };
  }

  validateSkills() {
    const skillNames = this.collection.list();
    const results = [];

    skillNames.forEach(function (name) {
      const validation = this.collection.validate(name);
      results.push({
        name: name,
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings
      });
    }.bind(this));

    return results;
  }
}

// Example usage

// Agent with bundled skills only
const agent = new CodingAgent();

// Agent with custom project skills
// const agent = new CodingAgent({
//   skillsDir: './skills',
//   maxSkills: 3,
//   maxPromptLength: 15000
// });

// Execute a task
agent.execute('Build a React component that uploads CSV files with validation and accessible error states')
  .then(function (result) {
    console.log('\nAgent ready to execute.');
    console.log('Skills loaded:', result.skills.length);
  });

// Validate all skills before deployment
const validation = agent.validateSkills();
const invalid = validation.filter(function (v) {
  return !v.valid;
});

if (invalid.length > 0) {
  console.log('\nWarning: Some skills have validation errors:');
  invalid.forEach(function (v) {
    console.log('  -', v.name, ':', v.errors.join(', '));
  });
}

module.exports = CodingAgent;
