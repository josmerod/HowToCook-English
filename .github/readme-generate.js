const { readdir, writeFile, stat, unlink, mkdir, access, readFile } = require('fs/promises');
const path = require('path');

const README_PATH = './README.md';
const MKDOCS_PATH = 'mkdocs.yml';
const dishesFolder = 'dishes';
const starsystemFolder = 'starsystem';

const ignorePaths = [
  '.git',
  '.github',
  'node_modules',
  'site',
  'starsystem',
  'template',
  'README.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
];

const categories = {
  vegetable_dish: {
    title: 'Vegetable Dishes',
    readme: '',
    mkdocs: '',
  },
  meat_dish: {
    title: 'Meat Dishes',
    readme: '',
    mkdocs: '',
  },
  aquatic: {
    title: 'Aquatic Dishes',
    readme: '',
    mkdocs: '',
  },
  breakfast: {
    title: 'Breakfast',
    readme: '',
    mkdocs: '',
  },
  staple: {
    title: 'Staple Foods',
    readme: '',
    mkdocs: '',
  },
  'semi-finished': {
    title: 'Semi-finished Products',
    readme: '',
    mkdocs: '',
  },
  soup: {
    title: 'Soup and Congee',
    readme: '',
    mkdocs: '',
  },
  drink: {
    title: 'Drinks',
    readme: '',
    mkdocs: '',
  },
  condiment: {
    title: 'Condiments and Ingredients',
    readme: '',
    mkdocs: '',
  },
  dessert: {
    title: 'Desserts',
    readme: '',
    mkdocs: '',
  },
};

function formatDisplayTitle(filename) {
  return filename.replace(/\.md$/, '').replace(/_/g, ' ');
}

async function countStars(filename) {
  const data = await readFile(filename, 'utf-8');
  const match = data.match(/^Estimated Cooking Difficulty:\s*(★+)/m);
  if (match) {
    return match[1].length;
  }
  let stars = 0;
  for (const line of data.split('\n')) {
    if (line.includes('Difficulty') || line.includes('★')) {
      stars += (line.match(/★/g) || []).length;
    }
  }
  return stars;
}

async function organizeByStars(dishesDir, starsystemDir) {
  const dishes = {};

  async function processFolder(folderPath) {
    const entries = await readdir(folderPath);
    entries.sort((a, b) => a.localeCompare(b, 'en'));
    for (const filename of entries) {
      if (filename === 'template') continue;
      const filepath = path.join(folderPath, filename);
      const fileStat = await stat(filepath);
      if (fileStat.isFile() && filename.endsWith('.md')) {
        const stars = await countStars(filepath);
        dishes[filepath] = stars;
      } else if (fileStat.isDirectory()) {
        await processFolder(filepath);
      }
    }
  }

  const dishesFolderAbs = path.resolve(dishesDir);
  const starsystemFolderAbs = path.resolve(starsystemDir);

  if (!(await access(starsystemFolderAbs).then(() => true).catch(() => false))) {
    await mkdir(starsystemFolderAbs, { recursive: true });
  } else {
    const existing = await readdir(starsystemFolderAbs);
    for (const file of existing) {
      if (file.endsWith('Star.md')) {
        await unlink(path.join(starsystemFolderAbs, file));
      }
    }
  }

  if (!(await access(dishesFolderAbs).then(() => true).catch(() => false))) {
    await mkdir(dishesFolderAbs, { recursive: true });
  }

  await processFolder(dishesFolderAbs);

  const starRatings = Array.from(new Set(Object.values(dishes))).sort((a, b) => a - b);
  const navigationLinks = [];

  for (const stars of starRatings) {
    const starsFile = path.join(starsystemFolderAbs, `${stars}Star.md`);
    const label = stars === 1 ? '1 Star' : `${stars} Stars`;
    const content = [`# ${label} Difficulty Dishes`, ''];
    const matchingEntries = Object.entries(dishes)
      .filter(([, starCount]) => starCount === stars)
      .sort(([a], [b]) => path.basename(a).localeCompare(path.basename(b), 'en'));

    for (const [filepath] of matchingEntries) {
      const relativePath = path.relative(starsystemFolderAbs, filepath).replace(/\\/g, '/');
      content.push(`* [${formatDisplayTitle(path.basename(filepath))}](./${relativePath})`);
    }
    content.push('');
    await writeFile(starsFile, content.join('\n'), 'utf-8');
    const readmeRel = path.relative(path.dirname(README_PATH), starsFile).replace(/\\/g, '/');
    navigationLinks.push(`- [${label}](${readmeRel})`);
  }

  return navigationLinks;
}

async function getAllMarkdown(dir) {
  const paths = [];
  const files = await readdir(dir);
  files.sort((a, b) => a.localeCompare(b, 'en'));

  for (const file of files) {
    if (ignorePaths.includes(file)) continue;
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);
    if (fileStat.isFile() && file.endsWith('.md')) {
      paths.push({ path: dir.replace(/\\/g, '/'), file });
    } else if (fileStat.isDirectory()) {
      const subFiles = await getAllMarkdown(filePath);
      paths.push(...subFiles);
    }
  }
  return paths;
}

function inlineReadmeTemplate(file, dirPath) {
  return `- [${formatDisplayTitle(file)}](${dirPath}/${file})\n`;
}

function categoryReadmeTemplate(title, inlineStr) {
  return `\n### ${title}\n\n${inlineStr}`;
}

function inlineMkdocsTemplate(file, dirPath, isDish = false) {
  return `${' '.repeat(isDish ? 10 : 6)}- ${formatDisplayTitle(file)}: ${dirPath}/${file}\n`;
}

function categoryMkdocsTemplate(title, inlineStr) {
  return `\n${' '.repeat(6)}- ${title}:\n${inlineStr}`;
}

async function main() {
  let README_BEFORE = '';
  let README_MAIN = '';
  let README_AFTER = '';
  let MKDOCS_BEFORE = '';
  let MKDOCS_MAIN = '';
  let MKDOCS_AFTER = '';

  const markdownObj = await getAllMarkdown('.');

  for (const markdown of markdownObj) {
    if (markdown.path.startsWith('tips/advanced')) {
      README_AFTER += inlineReadmeTemplate(markdown.file, markdown.path);
      MKDOCS_AFTER += inlineMkdocsTemplate(markdown.file, markdown.path);
      continue;
    }

    if (markdown.path.startsWith('tips')) {
      README_BEFORE += inlineReadmeTemplate(markdown.file, markdown.path);
      MKDOCS_BEFORE += inlineMkdocsTemplate(markdown.file, markdown.path);
      continue;
    }

    for (const category of Object.keys(categories)) {
      if (markdown.path === `dishes/${category}` || markdown.path.startsWith(`dishes/${category}/`)) {
        categories[category].readme += inlineReadmeTemplate(markdown.file, markdown.path);
        categories[category].mkdocs += inlineMkdocsTemplate(markdown.file, markdown.path, true);
        break;
      }
    }
  }

  for (const category of Object.values(categories)) {
    README_MAIN += categoryReadmeTemplate(category.title, category.readme);
    MKDOCS_MAIN += categoryMkdocsTemplate(category.title, category.mkdocs);
  }

  let MKDOCS_TEMPLATE;
  let README_TEMPLATE;

  try {
    MKDOCS_TEMPLATE = await readFile('./.github/templates/mkdocs_template.yml', 'utf-8');
  } catch {
    MKDOCS_TEMPLATE = 'site_name: How To Cook\nnav:\n{{main}}\n';
    console.warn('mkdocs_template.yml not found, using default template');
  }

  try {
    README_TEMPLATE = await readFile('./.github/templates/readme_template.md', 'utf-8');
  } catch {
    README_TEMPLATE = '# How To Cook\n\n{{before}}\n\n{{index_stars}}\n\n{{main}}\n\n{{after}}\n';
    console.warn('readme_template.md not found, using default template');
  }

  const navigationLinks = await organizeByStars(dishesFolder, starsystemFolder);
  const navigationSection = `### Index by Difficulty\n\n${navigationLinks.join('\n')}`;

  await writeFile(
    README_PATH,
    README_TEMPLATE
      .replace('{{before}}', README_BEFORE.trim())
      .replace('{{index_stars}}', navigationSection.trim())
      .replace('{{main}}', README_MAIN.trim())
      .replace('{{after}}', README_AFTER.trim()),
  );

  await writeFile(
    MKDOCS_PATH,
    MKDOCS_TEMPLATE
      .replace('{{before}}', MKDOCS_BEFORE.trimEnd())
      .replace('{{main}}', MKDOCS_MAIN.trimEnd())
      .replace('{{after}}', MKDOCS_AFTER.trimEnd()),
  );

  console.log(`Generated ${README_PATH}, ${MKDOCS_PATH}, and ${navigationLinks.length} star index files.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
