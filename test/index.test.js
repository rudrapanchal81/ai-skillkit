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

const names = skillkit.list();

assert.deepStrictEqual(names, ['docx', 'file-reading', 'frontend', 'pdf', 'pptx', 'xlsx']);
assert.ok(skillkit.get('docx').indexOf('name: docx') !== -1);
assert.ok(skillkit.get('pdf').indexOf('# PDF Skill') !== -1);

const parsed = skillkit.parse('xlsx');
assert.strictEqual(parsed.name, 'xlsx');
assert.ok(parsed.title.indexOf('XLSX Skill') !== -1);
assert.ok(parsed.description.indexOf('Excel') !== -1 || parsed.description.indexOf('spreadsheet') !== -1);
assert.ok(parsed.content.indexOf('## Quick Reference') !== -1);
assert.ok(parsed.lines > 20);
assert.ok(parsed.size > 200);

const all = skillkit.all();
assert.strictEqual(all.length, 6);
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

const searchResults = skillkit.search('react component');
assert.ok(searchResults.some(function (item) {
  return item.name === 'frontend';
}));

const listOutput = runCli(['list'], repoRoot);
assert.ok(listOutput.indexOf('docx') !== -1);
assert.ok(listOutput.indexOf('frontend') !== -1);

const infoOutput = runCli(['info', 'pdf'], repoRoot);
assert.ok(infoOutput.indexOf('pdf') !== -1);
assert.ok(infoOutput.indexOf('Description: ') !== -1);

const searchOutput = runCli(['search', 'spreadsheet'], repoRoot);
assert.ok(searchOutput.indexOf('xlsx') !== -1);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-skillkit-'));
const copiedOutput = runCli(['add', 'docx'], tempDir);
assert.ok(copiedOutput.indexOf('Added: ') !== -1);
assert.ok(fs.existsSync(path.join(tempDir, 'skills', 'docx.md')));

const initOutput = runCli(['init', 'custom-agent-workflow'], tempDir);
assert.ok(initOutput.indexOf('Created: ') !== -1);
assert.ok(fs.existsSync(path.join(tempDir, 'skills', 'custom-agent-workflow.md')));
assert.ok(fs.readFileSync(path.join(tempDir, 'skills', 'custom-agent-workflow.md'), 'utf8').indexOf('name: custom-agent-workflow') !== -1);

console.log('All tests passed.');
