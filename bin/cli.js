#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const skillkit = require('../lib');

const colors = {
  reset: '\u001b[0m',
  red: '\u001b[31m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  blue: '\u001b[34m',
  magenta: '\u001b[35m',
  cyan: '\u001b[36m',
  bold: '\u001b[1m'
};

function paint(color, text) {
  return colors[color] + text + colors.reset;
}

function heading(text) {
  return paint('bold', paint('cyan', text));
}

function fail(message) {
  console.error(paint('red', 'Error: ') + message);
  process.exit(1);
}

function normalizeName(name) {
  return String(name || '').trim().replace(/\.md$/i, '').toLowerCase();
}

function requireName(name, command) {
  const normalized = normalizeName(name);

  if (!normalized) {
    fail('Missing skill name for `' + command + '` command.');
  }

  return normalized;
}

function ensureProjectSkillsDir() {
  const dir = path.join(process.cwd(), 'skills');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

function sourcePathFor(name) {
  return path.join(__dirname, '..', 'skills', normalizeName(name) + '.md');
}

function copySkill(name, targetDir) {
  const normalized = requireName(name, 'add');
  const sourcePath = sourcePathFor(normalized);
  const targetPath = path.join(targetDir, normalized + '.md');

  if (!fs.existsSync(sourcePath)) {
    fail('Unknown skill: ' + normalized);
  }

  if (fs.existsSync(targetPath)) {
    return {
      name: normalized,
      targetPath: targetPath,
      created: false
    };
  }

  fs.copyFileSync(sourcePath, targetPath);

  return {
    name: normalized,
    targetPath: targetPath,
    created: true
  };
}

function createTemplate(name) {
  const normalized = requireName(name, 'init');
  const targetDir = ensureProjectSkillsDir();
  const targetPath = path.join(targetDir, normalized + '.md');
  const title = normalized
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');

  if (fs.existsSync(targetPath)) {
    fail('Refusing to overwrite existing file: ' + targetPath);
  }

  const template = [
    '---',
    'name: ' + normalized,
    'description: Structured guidance for ' + title + ' tasks.',
    'triggers:',
    '  - Use when the agent must handle ' + title.toLowerCase() + ' work from scratch',
    '  - Use when the agent needs a repeatable workflow and code examples',
    'anti-triggers:',
    '  - Do not use when a more specific bundled skill already fits better',
    '  - Do not use when the task is purely conceptual and needs no workflow',
    '---',
    '# ' + title + ' Skill',
    '',
    '## Quick Reference',
    '',
    '| Task | Approach |',
    '| --- | --- |',
    '| Plan the work | Start with outputs, constraints, and failure modes |',
    '| Implement safely | Prefer small, testable steps with visible checkpoints |',
    '| Validate results | Add concrete verification steps before finalizing |',
    '',
    '## Step-by-Step Instructions',
    '',
    '1. Define the final artifact, constraints, and acceptance criteria.',
    '2. Break the work into a short sequence that can be verified incrementally.',
    '3. Produce the artifact with executable examples, not abstract guidance.',
    '4. Validate output shape, edge cases, and failure handling before handoff.',
    '',
    '```txt',
    'Input: task request, expected output, constraints',
    'Process: plan -> implement -> verify -> summarize',
    'Output: reliable result with clear assumptions',
    '```',
    '',
    '## Critical Rules',
    '',
    '- Match the depth of the workflow to the task complexity.',
    '- Prefer deterministic outputs over clever but fragile shortcuts.',
    '- Keep examples runnable and keep assumptions explicit.',
    '',
    '## Dependencies',
    '',
    '- None required for the skill structure itself.',
    '- Add task-specific libraries only when they materially reduce risk or effort.',
    ''
  ].join('\n');

  fs.writeFileSync(targetPath, template, 'utf8');
  return targetPath;
}

function requireOptionValue(value, flag) {
  if (!value) {
    fail('Missing value for `' + flag + '` option.');
  }

  return value;
}

function parseOptions(argv) {
  const parsed = {
    _: [],
    dir: '',
    format: 'plain',
    metadata: false,
    includeIntro: true,
    maxLength: 0,
    limit: 3,
    file: ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--dir') {
      parsed.dir = requireOptionValue(argv[index + 1], '--dir');
      index += 1;
      continue;
    }

    if (token === '--format') {
      parsed.format = requireOptionValue(argv[index + 1], '--format');
      index += 1;
      continue;
    }

    if (token === '--metadata') {
      parsed.metadata = true;
      continue;
    }

    if (token === '--no-intro') {
      parsed.includeIntro = false;
      continue;
    }

    if (token === '--max-length') {
      parsed.maxLength = Number(requireOptionValue(argv[index + 1], '--max-length'));
      index += 1;
      continue;
    }

    if (token === '--limit') {
      parsed.limit = Number(requireOptionValue(argv[index + 1], '--limit'));
      index += 1;
      continue;
    }

    if (token === '--file') {
      parsed.file = requireOptionValue(argv[index + 1], '--file');
      index += 1;
      continue;
    }

    parsed._.push(token);
  }

  return parsed;
}

function getCollection(dir) {
  return dir ? skillkit.createCollection(dir) : skillkit;
}

function printValidation(result) {
  const status = result.valid ? paint('green', 'Valid') : paint('red', 'Invalid');
  const lines = [
    heading('Validation result'),
    paint('magenta', 'Status: ') + status,
    paint('magenta', 'Name: ') + (result.name || '(unknown)'),
    paint('magenta', 'Title: ') + (result.title || '(missing)')
  ];

  if (result.filePath) {
    lines.push(paint('magenta', 'File: ') + result.filePath);
  }

  if (result.errors.length) {
    lines.push(paint('red', 'Errors:'));
    result.errors.forEach(function (message) {
      lines.push('  - ' + message);
    });
  }

  if (result.warnings.length) {
    lines.push(paint('yellow', 'Warnings:'));
    result.warnings.forEach(function (message) {
      lines.push('  - ' + message);
    });
  }

  process.stdout.write(lines.join('\n') + '\n');
}

function printHelp() {
  const lines = [
    heading('ai-skillkit'),
    '',
    'Usage:',
    '  ai-skillkit list',
    '  ai-skillkit get <name>',
    '  ai-skillkit add <name>',
    '  ai-skillkit add --all',
    '  ai-skillkit info <name>',
    '  ai-skillkit init <name>',
    '  ai-skillkit search <query>',
    '  ai-skillkit compose [name ...] [--dir <path>] [--format plain|markdown] [--metadata] [--no-intro] [--max-length <n>]',
    '  ai-skillkit recommend <query> [--dir <path>] [--limit <n>]',
    '  ai-skillkit validate <name> [--dir <path>]',
    '  ai-skillkit validate --file <path>',
    ''
  ];

  process.stdout.write(lines.join('\n'));
}

function run() {
  const parsed = parseOptions(process.argv.slice(2));
  const command = parsed._[0];
  const args = parsed._.slice(1);
  const collection = getCollection(parsed.dir);

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    process.exit(0);
  }

  if (command === 'list') {
    const skills = collection.list();
    process.stdout.write(heading('Available skills') + '\n');
    skills.forEach(function (name) {
      process.stdout.write(paint('green', '- ') + name + '\n');
    });
    return;
  }

  if (command === 'get') {
    const name = requireName(args[0], 'get');
    process.stdout.write(collection.get(name));
    return;
  }

  if (command === 'add') {
    const targetDir = ensureProjectSkillsDir();

    if (args.indexOf('--all') !== -1) {
      const results = skillkit.list().map(function (name) {
        return copySkill(name, targetDir);
      });
      const created = results.filter(function (item) {
        return item.created;
      });
      const skipped = results.filter(function (item) {
        return !item.created;
      });

      process.stdout.write(heading('Copied skills') + '\n');
      created.forEach(function (item) {
        process.stdout.write(paint('green', '- added ') + item.name + '\n');
      });
      skipped.forEach(function (item) {
        process.stdout.write(paint('yellow', '- skipped ') + item.name + ' (already exists)\n');
      });
      process.stdout.write('\n' + created.length + ' added, ' + skipped.length + ' skipped.\n');
      return;
    }

    const result = copySkill(args[0], targetDir);

    if (!result.created) {
      process.stdout.write(paint('yellow', 'Skipped: ') + result.name + ' already exists at ' + result.targetPath + '\n');
      return;
    }

    process.stdout.write(paint('green', 'Added: ') + result.name + ' -> ' + result.targetPath + '\n');
    return;
  }

  if (command === 'info') {
    const name = requireName(args[0], 'info');
    const info = collection.parse(name);
    const lines = [
      heading('Skill info'),
      paint('magenta', 'Name: ') + info.name,
      paint('magenta', 'Title: ') + info.title,
      paint('magenta', 'Description: ') + info.description,
      paint('magenta', 'Lines: ') + String(info.lines),
      paint('magenta', 'Size: ') + String(info.size) + ' bytes',
      paint('magenta', 'Triggers: ') + info.triggers.join('; '),
      paint('magenta', 'Anti-triggers: ') + info.antiTriggers.join('; ')
    ];

    process.stdout.write(lines.join('\n') + '\n');
    return;
  }

  if (command === 'init') {
    const targetPath = createTemplate(args[0]);
    process.stdout.write(paint('green', 'Created: ') + targetPath + '\n');
    return;
  }

  if (command === 'search') {
    const query = args.join(' ').trim();

    if (!query) {
      fail('Missing search query.');
    }

    const results = collection.search(query);

    if (!results.length) {
      process.stdout.write(paint('yellow', 'No matches for: ') + query + '\n');
      return;
    }

    process.stdout.write(heading('Search results') + '\n');
    results.forEach(function (result) {
      process.stdout.write(paint('green', '- ') + result.name + ': ' + result.description + '\n');
    });
    return;
  }

  if (command === 'compose') {
    const output = collection.compose({
      skills: args.length ? args : undefined,
      includeIntro: parsed.includeIntro,
      includeMetadata: parsed.metadata,
      format: parsed.format,
      maxLength: parsed.maxLength > 0 ? parsed.maxLength : undefined
    });

    process.stdout.write(output + '\n');
    return;
  }

  if (command === 'recommend') {
    const query = args.join(' ').trim();

    if (!query) {
      fail('Missing recommendation query.');
    }

    const results = collection.recommend(query, {
      limit: parsed.limit > 0 ? parsed.limit : 3
    });

    if (!results.length) {
      process.stdout.write(paint('yellow', 'No recommended skills for: ') + query + '\n');
      return;
    }

    process.stdout.write(heading('Recommended skills') + '\n');
    results.forEach(function (result) {
      process.stdout.write(paint('green', '- ') + result.name + ': ' + result.description + '\n');
    });
    return;
  }

  if (command === 'validate') {
    const result = parsed.file
      ? skillkit.validateFile(parsed.file)
      : collection.validate(requireName(args[0], 'validate'));

    printValidation(result);

    if (!result.valid) {
      process.exit(1);
    }

    return;
  }

  fail('Unknown command: ' + command);
}

run();
