#!/usr/bin/env node

const paint = function (color, text) {
  const colors = {
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
  };
  return colors[color] + text + colors.reset;
};

const box = function (lines) {
  const maxLength = Math.max.apply(null, lines.map(function (line) {
    return line.length;
  }));
  const border = '─'.repeat(maxLength + 2);
  
  process.stdout.write('\n');
  process.stdout.write('┌' + border + '┐\n');
  lines.forEach(function (line) {
    const padding = ' '.repeat(maxLength - line.length);
    process.stdout.write('│ ' + line + padding + ' │\n');
  });
  process.stdout.write('└' + border + '┘\n');
  process.stdout.write('\n');
};

box([
  paint('green', '✓ ai-skillkit installed'),
  '',
  paint('cyan', 'Make your AI coding agents more reliable:'),
  '',
  '  const skillkit = require(\'ai-skillkit\');',
  '  const prompt = skillkit.compose();',
  '',
  paint('yellow', 'Quick commands:'),
  '  npx ai-skillkit list',
  '  npx ai-skillkit compose frontend file-reading',
  '  npx ai-skillkit recommend "build a React form"',
  '',
  'Docs: https://github.com/rudrapanchal81/ai-skillkit',
  'Examples: ./node_modules/ai-skillkit/examples/'
]);
