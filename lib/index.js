const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');

function normalizeName(name) {
  return String(name || '').trim().replace(/\.md$/i, '').toLowerCase();
}

function getSkillPath(name) {
  const normalized = normalizeName(name);

  if (!normalized) {
    throw new Error('A skill name is required.');
  }

  return path.join(SKILLS_DIR, normalized + '.md');
}

function ensureSkillsDirectory() {
  if (!fs.existsSync(SKILLS_DIR)) {
    throw new Error('Skills directory not found: ' + SKILLS_DIR);
  }
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

function list() {
  ensureSkillsDirectory();

  return fs
    .readdirSync(SKILLS_DIR)
    .filter(function (entry) {
      return entry.toLowerCase().endsWith('.md');
    })
    .map(function (entry) {
      return path.basename(entry, '.md');
    })
    .sort();
}

function get(name) {
  const filePath = getSkillPath(name);

  if (!fs.existsSync(filePath)) {
    throw new Error('Unknown skill: ' + normalizeName(name));
  }

  return fs.readFileSync(filePath, 'utf8');
}

function parse(name) {
  const normalized = normalizeName(name);
  const raw = get(normalized);
  const parts = splitContent(raw);
  const lines = raw.split(/\r?\n/).length;

  return {
    name: parts.frontmatter.name || normalized,
    title: extractTitle(parts.body, parts.frontmatter.name || normalized),
    description: parts.frontmatter.description || '',
    content: parts.body,
    lines: lines,
    size: Buffer.byteLength(raw, 'utf8')
  };
}

function all() {
  return list().map(function (name) {
    return parse(name);
  });
}

function search(query) {
  const needle = String(query || '').trim().toLowerCase();

  if (!needle) {
    return [];
  }

  return list()
    .filter(function (name) {
      return get(name).toLowerCase().indexOf(needle) !== -1;
    })
    .map(function (name) {
      return parse(name);
    });
}

module.exports = {
  list: list,
  get: get,
  parse: parse,
  all: all,
  search: search
};
