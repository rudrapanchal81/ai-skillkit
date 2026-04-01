const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');
const STOP_WORDS = {
  a: true,
  an: true,
  and: true,
  are: true,
  build: true,
  for: true,
  from: true,
  how: true,
  into: true,
  that: true,
  the: true,
  this: true,
  use: true,
  with: true,
  your: true
};

function normalizeName(name) {
  return String(name || '').trim().replace(/\.md$/i, '').toLowerCase();
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function ensureSkillsDirectory(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error('Skills directory not found: ' + dir);
  }

  if (!fs.statSync(dir).isDirectory()) {
    throw new Error('Skills path is not a directory: ' + dir);
  }
}

function resolveSkillsDirectory(dir) {
  const target = typeof dir === 'undefined' ? SKILLS_DIR : path.resolve(String(dir || ''));

  if (!target) {
    throw new Error('A skills directory is required.');
  }

  ensureSkillsDirectory(target);
  return target;
}

function getSkillPath(dir, name) {
  const normalized = normalizeName(name);

  if (!normalized) {
    throw new Error('A skill name is required.');
  }

  return path.join(dir, normalized + '.md');
}

function stripQuotes(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/^['"`]|['"`]$/g, '').trim();
}

function parseInlineArray(value) {
  return value
    .slice(1, -1)
    .split(',')
    .map(function (item) {
      return stripQuotes(item.trim());
    })
    .filter(Boolean);
}

function parseFrontmatterBlock(block) {
  const frontmatter = {};
  let currentKey = null;

  block.split(/\r?\n/).forEach(function (line) {
    if (!line.trim()) {
      return;
    }

    const listMatch = line.match(/^\s*-\s+(.*)$/);

    if (listMatch && currentKey) {
      if (!Array.isArray(frontmatter[currentKey])) {
        frontmatter[currentKey] = [];
      }

      frontmatter[currentKey].push(stripQuotes(listMatch[1]));
      return;
    }

    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    if (!rawValue) {
      frontmatter[key] = [];
      currentKey = key;
      return;
    }

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      frontmatter[key] = parseInlineArray(rawValue);
      currentKey = key;
      return;
    }

    frontmatter[key] = stripQuotes(rawValue);
    currentKey = key;
  });

  return frontmatter;
}

function splitContent(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    return {
      frontmatter: {},
      body: raw
    };
  }

  return {
    frontmatter: parseFrontmatterBlock(match[1]),
    body: raw.slice(match[0].length)
  };
}

function extractTitle(body, fallback) {
  const match = body.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map(function (item) {
        return String(item || '').trim();
      })
      .filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function parseSkillFromRaw(raw, normalizedName, filePath, skillsDir) {
  const parts = splitContent(raw);
  const lines = raw.split(/\r?\n/).length;
  const title = extractTitle(parts.body, parts.frontmatter.name || normalizedName);

  return {
    name: parts.frontmatter.name || normalizedName,
    title: title,
    description: parts.frontmatter.description || '',
    content: parts.body,
    raw: raw,
    lines: lines,
    size: Buffer.byteLength(raw, 'utf8'),
    path: filePath,
    sourceDir: skillsDir,
    triggers: toStringArray(parts.frontmatter.triggers),
    antiTriggers: toStringArray(parts.frontmatter['anti-triggers']),
    frontmatter: parts.frontmatter
  };
}

function listFromDirectory(skillsDir) {
  ensureSkillsDirectory(skillsDir);

  return fs
    .readdirSync(skillsDir)
    .filter(function (entry) {
      return entry.toLowerCase().endsWith('.md');
    })
    .map(function (entry) {
      return path.basename(entry, '.md');
    })
    .sort();
}

function getFromDirectory(skillsDir, name) {
  const filePath = getSkillPath(skillsDir, name);

  if (!fs.existsSync(filePath)) {
    throw new Error('Unknown skill: ' + normalizeName(name));
  }

  return fs.readFileSync(filePath, 'utf8');
}

function parseFromDirectory(skillsDir, name) {
  const normalized = normalizeName(name);
  const filePath = getSkillPath(skillsDir, normalized);
  const raw = getFromDirectory(skillsDir, normalized);

  return parseSkillFromRaw(raw, normalized, filePath, skillsDir);
}

function allFromDirectory(skillsDir) {
  return listFromDirectory(skillsDir).map(function (name) {
    return parseFromDirectory(skillsDir, name);
  });
}

function searchInDirectory(skillsDir, query) {
  const needle = String(query || '').trim().toLowerCase();

  if (!needle) {
    return [];
  }

  return allFromDirectory(skillsDir).filter(function (skill) {
    return skill.raw.toLowerCase().indexOf(needle) !== -1;
  });
}

function resolveSkillNames(skillsDir, input) {
  if (typeof input === 'undefined') {
    return listFromDirectory(skillsDir);
  }

  const values = Array.isArray(input) ? input : [input];
  const seen = {};
  const names = values
    .map(function (value) {
      return normalizeName(value);
    })
    .filter(Boolean)
    .filter(function (name) {
      if (seen[name]) {
        return false;
      }

      seen[name] = true;
      return true;
    });

  if (!names.length) {
    throw new Error('At least one skill name is required.');
  }

  return names.map(function (name) {
    getFromDirectory(skillsDir, name);
    return name;
  });
}

function normalizeComposeOptions(input, options) {
  const defaults = {
    skills: undefined,
    includeIntro: true,
    includeMetadata: false,
    format: 'plain',
    maxLength: 0
  };
  const rawOptions = isPlainObject(input) ? input : Object.assign({ skills: input }, options || {});
  const settings = Object.assign({}, defaults, rawOptions);

  settings.format = settings.format === 'markdown' ? 'markdown' : 'plain';

  if (settings.maxLength) {
    const numericLength = Number(settings.maxLength);

    if (!isFinite(numericLength) || numericLength <= 0) {
      throw new Error('compose maxLength must be a positive number.');
    }

    settings.maxLength = Math.floor(numericLength);
  }

  return settings;
}

function renderMetadata(skill, format) {
  const lines = [];

  if (format === 'markdown') {
    lines.push('- Title: ' + skill.title);

    if (skill.description) {
      lines.push('- Description: ' + skill.description);
    }

    if (skill.triggers.length) {
      lines.push('- Triggers: ' + skill.triggers.join('; '));
    }

    if (skill.antiTriggers.length) {
      lines.push('- Anti-triggers: ' + skill.antiTriggers.join('; '));
    }

    return lines;
  }

  lines.push('Title: ' + skill.title);

  if (skill.description) {
    lines.push('Description: ' + skill.description);
  }

  if (skill.triggers.length) {
    lines.push('Triggers: ' + skill.triggers.join('; '));
  }

  if (skill.antiTriggers.length) {
    lines.push('Anti-triggers: ' + skill.antiTriggers.join('; '));
  }

  return lines;
}

function renderSkillBlock(skill, settings) {
  if (settings.format === 'markdown') {
    const lines = ['## Skill: ' + skill.name, ''];

    if (settings.includeMetadata) {
      lines.push.apply(lines, renderMetadata(skill, 'markdown'));
      lines.push('');
    }

    lines.push(skill.content.trim());
    return lines.join('\n');
  }

  const lines = ['', '=== SKILL: ' + skill.name + ' ===', ''];

  if (settings.includeMetadata) {
    lines.push.apply(lines, renderMetadata(skill, 'plain'));
    lines.push('');
  }

  lines.push(skill.raw);
  return lines.join('\n');
}

function composeFromDirectory(skillsDir, input, options) {
  const settings = normalizeComposeOptions(input, options);
  const names = resolveSkillNames(skillsDir, settings.skills);
  const intro = settings.format === 'markdown'
    ? [
        '# ai-skillkit prompt bundle',
        '',
        'Apply the most relevant skills when the request matches their triggers.',
        'Respect anti-triggers, critical rules, and AI mistakes to avoid.',
        'Do not invent unsupported APIs, dependencies, or workflows.'
      ].join('\n')
    : [
        'You are using ai-skillkit bundled SKILL.md guidance.',
        'Apply the most relevant skills when the request matches their triggers.',
        'Respect anti-triggers, critical rules, and AI mistakes to avoid.',
        'Do not invent unsupported APIs, dependencies, or workflows.'
      ].join('\n');
  const parts = [];

  if (settings.includeIntro) {
    parts.push(intro);
  }

  names.forEach(function (name) {
    parts.push(renderSkillBlock(parseFromDirectory(skillsDir, name), settings));
  });
  
  const output = parts.join('\n\n').trim();
  
  if (settings.maxLength && output.length > settings.maxLength) {
    throw new Error('Composed prompt exceeds maxLength of ' + settings.maxLength + ' characters.');
  }
  
  return output;
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(function (token) {
      return token.length > 2 && !STOP_WORDS[token];
    });
}

function countMatches(text, token) {
  let count = 0;
  let cursor = text.indexOf(token);

  while (cursor !== -1) {
    count += 1;
    cursor = text.indexOf(token, cursor + token.length);
  }

  return count;
}

function scoreSkill(skill, tokens) {
  const title = skill.title.toLowerCase();
  const description = skill.description.toLowerCase();
  const triggerText = skill.triggers.join(' ').toLowerCase();
  const content = skill.content.toLowerCase();

  return tokens.reduce(function (score, token) {
    return score
      + countMatches(title, token) * 6
      + countMatches(description, token) * 4
      + countMatches(triggerText, token) * 4
      + countMatches(content, token);
  }, 0);
}

function recommendFromDirectory(skillsDir, query, options) {
  const tokens = tokenize(query);
  const settings = Object.assign({ limit: 3 }, options || {});
  const limit = Math.max(1, Math.floor(Number(settings.limit) || 3));

  if (!tokens.length) {
    return [];
  }

  return allFromDirectory(skillsDir)
    .map(function (skill) {
      return {
        skill: skill,
        score: scoreSkill(skill, tokens)
      };
    })
    .filter(function (entry) {
      return entry.score > 0;
    })
    .sort(function (left, right) {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.skill.name.localeCompare(right.skill.name);
    })
    .slice(0, limit)
    .map(function (entry) {
      return entry.skill;
    });
}

function hasSection(body, heading) {
  return body.indexOf(heading) !== -1;
}

function validateContent(raw, filePath) {
  const parts = splitContent(raw);
  const frontmatter = parts.frontmatter;
  const errors = [];
  const warnings = [];
  const title = extractTitle(parts.body, '');
  const fallbackName = filePath ? path.basename(filePath, '.md') : '';
  const name = normalizeName(frontmatter.name || fallbackName);

  if (!raw.match(/^---\r?\n/)) {
    errors.push('Missing YAML frontmatter block.');
  }

  if (!name) {
    errors.push('Missing `name` in frontmatter.');
  }

  if (!frontmatter.description) {
    errors.push('Missing `description` in frontmatter.');
  }

  if (!toStringArray(frontmatter.triggers).length) {
    errors.push('Missing `triggers` entries in frontmatter.');
  }

  if (!toStringArray(frontmatter['anti-triggers']).length) {
    errors.push('Missing `anti-triggers` entries in frontmatter.');
  }

  if (!title) {
    errors.push('Missing top-level markdown title.');
  }

  ['## Quick Reference', '## Step-by-Step Instructions', '## Critical Rules', '## Dependencies'].forEach(function (heading) {
    if (!hasSection(parts.body, heading)) {
      errors.push('Missing required section: ' + heading);
    }
  });

  if (!hasSection(parts.body, '## AI Mistakes to Avoid During Vibe Coding')) {
    warnings.push('Missing `## AI Mistakes to Avoid During Vibe Coding` section.');
  }

  if (filePath && frontmatter.name && normalizeName(frontmatter.name) !== normalizeName(path.basename(filePath, '.md'))) {
    warnings.push('Frontmatter `name` does not match the filename.');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    filePath: filePath || '',
    name: name,
    title: title,
    frontmatter: frontmatter
  };
}

function validateFile(filePath) {
  if (!String(filePath || '').trim()) {
    throw new Error('A file path is required.');
  }

  const resolved = path.resolve(String(filePath));

  if (!fs.existsSync(resolved)) {
    throw new Error('Skill file not found: ' + resolved);
  }

  return validateContent(fs.readFileSync(resolved, 'utf8'), resolved);
}

function validateFromDirectory(skillsDir, name) {
  const filePath = getSkillPath(skillsDir, name);
  return validateContent(getFromDirectory(skillsDir, name), filePath);
}

function createCollection(dir) {
  const skillsDir = resolveSkillsDirectory(dir);

  return {
    list: function () {
      return listFromDirectory(skillsDir);
    },
    get: function (name) {
      return getFromDirectory(skillsDir, name);
    },
    parse: function (name) {
      return parseFromDirectory(skillsDir, name);
    },
    all: function () {
      return allFromDirectory(skillsDir);
    },
    search: function (query) {
      return searchInDirectory(skillsDir, query);
    },
    compose: function (input, options) {
      return composeFromDirectory(skillsDir, input, options);
    },
    recommend: function (query, options) {
      return recommendFromDirectory(skillsDir, query, options);
    },
    validate: function (name) {
      return validateFromDirectory(skillsDir, name);
    }
  };
}

const bundled = createCollection(SKILLS_DIR);

function getVibePrompt() {
  return bundled.compose({
    includeMetadata: true,
    format: 'markdown'
  });
}

module.exports = {
  list: bundled.list,
  get: bundled.get,
  parse: bundled.parse,
  all: bundled.all,
  search: bundled.search,
  compose: bundled.compose,
  recommend: bundled.recommend,
  validate: bundled.validate,
  validateContent: validateContent,
  validateFile: validateFile,
  createCollection: createCollection,
  loadSkills: createCollection,
  getVibePrompt: getVibePrompt
};
