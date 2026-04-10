const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const skillkit = require('../lib');

const repoRoot = path.join(__dirname, '..');
const cliPath = path.join(repoRoot, 'bin', 'cli.js');

function runCli(args, cwd) {
  return childProcess.execFileSync(process.execPath, [cliPath].concat(args), {
    cwd: cwd,
    encoding: 'utf8'
  });
}

async function main() {
  const names = skillkit.list();

  assert.deepStrictEqual(names, ['api-design', 'backend', 'docx', 'file-reading', 'frontend', 'pdf', 'pptx', 'testing', 'xlsx']);
  assert.ok(skillkit.get('docx').indexOf('name: docx') !== -1);
  assert.ok(skillkit.get('pdf').indexOf('# PDF Skill') !== -1);

  const parsed = skillkit.parse('xlsx');
  assert.strictEqual(parsed.name, 'xlsx');
  assert.ok(parsed.title.indexOf('XLSX Skill') !== -1);
  assert.ok(parsed.description.indexOf('Excel') !== -1 || parsed.description.indexOf('spreadsheet') !== -1);
  assert.ok(parsed.content.indexOf('## Quick Reference') !== -1);
  assert.ok(parsed.lines > 20);
  assert.ok(parsed.size > 200);
  assert.ok(parsed.path.indexOf(path.join('skills', 'xlsx.md')) !== -1);
  assert.ok(parsed.triggers.length > 0);
  assert.ok(parsed.antiTriggers.length > 0);

  const all = skillkit.all();
  assert.strictEqual(all.length, 9);
  assert.ok(all.every(function (item) {
    return item.name && item.title;
  }));

  const composedAll = skillkit.compose();
  assert.ok(composedAll.indexOf('You are using ai-skillkit bundled SKILL.md guidance.') !== -1);
  assert.ok(composedAll.indexOf('=== SKILL: docx ===') !== -1);
  assert.ok(composedAll.indexOf('=== SKILL: xlsx ===') !== -1);

  const composedFocused = skillkit.compose(['frontend', 'file-reading']);
  assert.ok(composedFocused.indexOf('=== SKILL: frontend ===') !== -1);
  assert.ok(composedFocused.indexOf('=== SKILL: file-reading ===') !== -1);
  assert.ok(composedFocused.indexOf('=== SKILL: pdf ===') === -1);

  const composedMarkdown = skillkit.compose({
    skills: ['frontend', 'file-reading'],
    includeMetadata: true,
    format: 'markdown',
    maxLength: 40000
  });
  assert.ok(composedMarkdown.indexOf('# ai-skillkit prompt bundle') !== -1);
  assert.ok(composedMarkdown.indexOf('## Skill: frontend') !== -1);
  assert.ok(composedMarkdown.indexOf('- Triggers: ') !== -1);

  assert.throws(function () {
    skillkit.compose({
      skills: ['frontend'],
      maxLength: 10
    });
  }, /maxLength/);

  const searchResults = skillkit.search('react component');
  assert.ok(searchResults.some(function (item) {
    return item.name === 'frontend';
  }));

  const recommendations = skillkit.recommend('Build a React CSV upload form with validation', {
    limit: 4
  });
  assert.ok(recommendations.length > 0);
  assert.strictEqual(recommendations[0].name, 'file-reading');
  assert.ok(recommendations.some(function (item) {
    return item.name === 'frontend';
  }));

  const validation = skillkit.validate('frontend');
  assert.strictEqual(validation.valid, true);
  assert.strictEqual(validation.errors.length, 0);

  const invalidValidation = skillkit.validateContent('# Missing Frontmatter');
  assert.strictEqual(invalidValidation.valid, false);
  assert.ok(invalidValidation.errors.length > 0);

  const listOutput = runCli(['list'], repoRoot);
  assert.ok(listOutput.indexOf('docx') !== -1);
  assert.ok(listOutput.indexOf('frontend') !== -1);

  const infoOutput = runCli(['info', 'pdf'], repoRoot);
  assert.ok(infoOutput.indexOf('pdf') !== -1);
  assert.ok(infoOutput.indexOf('Description: ') !== -1);
  assert.ok(infoOutput.indexOf('Triggers: ') !== -1);

  const searchOutput = runCli(['search', 'spreadsheet'], repoRoot);
  assert.ok(searchOutput.indexOf('xlsx') !== -1);

  const composeOutput = runCli(['compose', 'frontend', 'file-reading', '--metadata', '--format', 'markdown'], repoRoot);
  assert.ok(composeOutput.indexOf('## Skill: frontend') !== -1);
  assert.ok(composeOutput.indexOf('- Description: ') !== -1);

  const recommendOutput = runCli(['recommend', 'build', 'a', 'React', 'upload', 'form', 'with', 'validation'], repoRoot);
  assert.ok(recommendOutput.indexOf('frontend') !== -1);

  const validateOutput = runCli(['validate', 'frontend'], repoRoot);
  assert.ok(validateOutput.indexOf('Valid') !== -1);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-skillkit-'));
  const copiedOutput = runCli(['add', 'docx'], tempDir);
  assert.ok(copiedOutput.indexOf('Added: ') !== -1);
  assert.ok(fs.existsSync(path.join(tempDir, 'skills', 'docx.md')));

  const initOutput = runCli(['init', 'custom-agent-workflow'], tempDir);
  assert.ok(initOutput.indexOf('Created: ') !== -1);
  assert.ok(fs.existsSync(path.join(tempDir, 'skills', 'custom-agent-workflow.md')));
  assert.ok(fs.readFileSync(path.join(tempDir, 'skills', 'custom-agent-workflow.md'), 'utf8').indexOf('name: custom-agent-workflow') !== -1);

  const localSkillsDir = path.join(tempDir, 'local-skills');
  fs.mkdirSync(localSkillsDir, { recursive: true });
  fs.copyFileSync(path.join(repoRoot, 'skills', 'frontend.md'), path.join(localSkillsDir, 'frontend.md'));
  fs.copyFileSync(path.join(repoRoot, 'skills', 'file-reading.md'), path.join(localSkillsDir, 'file-reading.md'));

  const localCollection = skillkit.createCollection(localSkillsDir);
  assert.deepStrictEqual(localCollection.list(), ['file-reading', 'frontend']);
  assert.ok(localCollection.compose({ includeIntro: false, format: 'markdown' }).indexOf('## Skill: frontend') !== -1);

  const localComposeOutput = runCli(['compose', 'frontend', '--dir', localSkillsDir, '--no-intro'], repoRoot);
  assert.ok(localComposeOutput.indexOf('=== SKILL: frontend ===') !== -1);
  assert.ok(localComposeOutput.indexOf('You are using ai-skillkit bundled SKILL.md guidance.') === -1);

  const localValidateOutput = runCli(['validate', 'frontend', '--dir', localSkillsDir], repoRoot);
  assert.ok(localValidateOutput.indexOf('Valid') !== -1);

  const invalidFilePath = path.join(tempDir, 'invalid-skill.md');
  fs.writeFileSync(invalidFilePath, '# Missing Frontmatter\n', 'utf8');

  let invalidCliError = null;

  try {
    runCli(['validate', '--file', invalidFilePath], repoRoot);
  } catch (error) {
    invalidCliError = error;
  }

  assert.ok(invalidCliError);
  assert.strictEqual(invalidCliError.status, 1);
  assert.ok(String(invalidCliError.stdout).indexOf('Invalid') !== -1);

  const esmOutput = childProcess.execFileSync(process.execPath, ['--input-type=module', '-e', "import skillkit, { compose, recommend } from './index.mjs'; const results = recommend('React upload validation'); if (!results.length) { throw new Error('missing recommendations'); } const output = compose(['frontend']); if (!output.includes('frontend')) { throw new Error('missing compose output'); } if (typeof skillkit.list !== 'function') { throw new Error('missing default export'); } process.stdout.write('esm ok');"], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  assert.ok(esmOutput.indexOf('esm ok') !== -1);

  console.log('All tests passed.');
}

main().catch(function (error) {
  console.error(error);
  process.exit(1);
});
