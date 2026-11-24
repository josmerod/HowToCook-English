const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DISHES_DIR = path.join(ROOT_DIR, 'dishes');
const TIPS_DIR = path.join(ROOT_DIR, 'tips');
const STARSYSTEM_DIR = path.join(ROOT_DIR, 'starsystem');
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

async function walkFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function existsCaseSensitive(targetPath) {
  const normalized = path.resolve(targetPath);
  const rel = path.relative(ROOT_DIR, normalized);
  if (!rel || rel === '.') return fs.existsSync(ROOT_DIR);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return fs.existsSync(normalized);
  }
  const parts = rel.split(path.sep).filter(Boolean);
  let current = ROOT_DIR;
  for (const part of parts) {
    let entries;
    try {
      entries = fs.readdirSync(current);
    } catch {
      return false;
    }
    if (!entries.includes(part)) {
      return false;
    }
    current = path.join(current, part);
  }
  return true;
}

function validateDishMarkdown(filePath, content, errors) {
  const relPath = path.relative(ROOT_DIR, filePath);
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const filenameWithoutExt = path.parse(filePath).name;

  if (filenameWithoutExt.includes(' ')) {
    errors.push(`${relPath}: filename must not contain spaces ("${filenameWithoutExt}").`);
  }

  const h1Lines = lines.filter((l) => l.startsWith('# '));
  if (!h1Lines.length) {
    errors.push(`${relPath}: missing main H1 heading ("# <Dish Name>").`);
    return;
  }

  const sections = lines.filter((l) => l.startsWith('## '));
  const requiredSections = [
    '## Essential Ingredients and Tools',
    '## Calculations',
    '## Operation',
    '## Additional Content',
  ];

  if (sections.length !== requiredSections.length) {
    errors.push(
      `${relPath}: expected ${requiredSections.length} H2 sections (${requiredSections.join(', ')}), found ${sections.length} (${sections.join(', ')}).`,
    );
    return;
  }

  requiredSections.forEach((sec, idx) => {
    if (sections[idx] !== sec) {
      errors.push(`${relPath}: H2 section #${idx + 1} must be "${sec}", found "${sections[idx]}".`);
    }
  });

  const mainTitleIndex = lines.indexOf(h1Lines[0]);
  const firstH2Index = lines.indexOf(sections[0]);

  if (mainTitleIndex >= 0 && firstH2Index > mainTitleIndex) {
    const headerRegion = lines.slice(mainTitleIndex + 1, firstH2Index);
    const difficultyGeneral = /^Estimated Cooking Difficulty:\s*(.*)$/;
    const difficultyStrict = /^Estimated Cooking Difficulty:\s*★{1,5}$/;
    let foundDifficulty = false;

    for (const line of headerRegion) {
      const match = line.match(difficultyGeneral);
      if (match) {
        foundDifficulty = true;
        if (!difficultyStrict.test(line)) {
          errors.push(
            `${relPath}: difficulty line must match "Estimated Cooking Difficulty: ★..." with 1 to 5 stars (found "${line}").`,
          );
        }
        break;
      }
    }

    if (!foundDifficulty) {
      errors.push(
        `${relPath}: missing "Estimated Cooking Difficulty: ★★" line between the H1 title and first H2 section.`,
      );
    }
  } else {
    errors.push(`${relPath}: invalid heading structure; could not locate difficulty section.`);
  }

  const validFooters = [
    'If you find any issues with this guide or have improvements, please raise an Issue or Pull Request.',
  ];
  if (!lines.some((line) => validFooters.includes(line))) {
    errors.push(`${relPath}: missing required footer line ("${validFooters[0]}").`);
  }
}

function validateNoCjk(filePath, content, errors) {
  const relPath = path.relative(ROOT_DIR, filePath);
  const cjkMatch = content.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/);
  if (cjkMatch) {
    errors.push(`${relPath}: contains unexpected CJK or fullwidth character "${cjkMatch[0]}".`);
  }
}

function validateLocalLinks(filePath, content, errors) {
  const relPath = path.relative(ROOT_DIR, filePath);
  const baseDir = path.dirname(filePath);
  const stripped = content.replace(/<!--[\s\S]*?-->/g, '');
  const linkRegex = /!?\[[^\]]*\]\(([^)]+)\)/g;

  for (const match of stripped.matchAll(linkRegex)) {
    const rawTarget = match[1].trim();
    const target = rawTarget.split('#')[0].split('?')[0].trim();
    if (!target || target.startsWith('http://') || target.startsWith('https://') || target.startsWith('mailto:')) {
      continue;
    }
    let decoded;
    try {
      decoded = decodeURIComponent(target);
    } catch {
      decoded = target;
    }
    const resolved = path.resolve(baseDir, decoded);
    if (!existsCaseSensitive(resolved)) {
      errors.push(`${relPath}: broken local link or image "${rawTarget}" (resolved to ${path.relative(ROOT_DIR, resolved)}).`);
    }
  }
}

async function main() {
  const errors = [];
  const allDishFiles = await walkFiles(DISHES_DIR);

  for (const filePath of allDishFiles) {
    const relPath = path.relative(ROOT_DIR, filePath);
    const stats = await fsp.stat(filePath);

    if (stats.size > MAX_FILE_SIZE) {
      errors.push(`${relPath}: exceeds 1MB limit (${(stats.size / 1048576).toFixed(2)}MB).`);
    }

    if (!path.extname(filePath)) {
      errors.push(`${relPath}: file must have an extension.`);
    }

    if (filePath.endsWith('.md')) {
      const content = await fsp.readFile(filePath, 'utf8');
      validateDishMarkdown(filePath, content, errors);
    }
  }

  const mdFilesToLinkCheck = [
    path.join(ROOT_DIR, 'README.md'),
    path.join(ROOT_DIR, 'CONTRIBUTING.md'),
    path.join(ROOT_DIR, 'CODE_OF_CONDUCT.md'),
    ...(await walkFiles(DISHES_DIR)).filter((f) => f.endsWith('.md')),
    ...(await walkFiles(TIPS_DIR)).filter((f) => f.endsWith('.md')),
    ...(await walkFiles(STARSYSTEM_DIR)).filter((f) => f.endsWith('.md')),
  ];

  for (const filePath of mdFilesToLinkCheck) {
    if (!fs.existsSync(filePath)) continue;
    const content = await fsp.readFile(filePath, 'utf8');
    validateLocalLinks(filePath, content, errors);
    validateNoCjk(filePath, content, errors);
  }

  if (errors.length) {
    errors.forEach((err) => console.error(`ERROR: ${err}`));
    throw new Error(`Found ${errors.length} lint error(s). Please fix them.`);
  }

  console.log(`All checks passed across ${allDishFiles.length} dish files and ${mdFilesToLinkCheck.length} markdown documents.`);
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
