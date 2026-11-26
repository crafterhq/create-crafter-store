#!/usr/bin/env node
// Copies the bundled Next.js template into a new directory. No network access.
import { cpSync, existsSync, readdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'template');
// Never copied, even when the template was built locally
const SKIP = new Set(['node_modules', '.next', '.env', '.env.local', 'next-env.d.ts', 'package-lock.json', 'tsconfig.tsbuildinfo']);
// npm drops dotfiles like .gitignore from published packages, so they ship without the dot
const RENAME = { gitignore: '.gitignore' };

const HELP = `Usage: npx create-crafter-store <directory> [--force]

Creates a Next.js storefront for your headless Crafter store.

Options:
  --force       Write into a directory that is not empty
  -h, --help    Show this help
`;

export function toPackageName(dir) {
  const name = basename(resolve(dir))
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+|[-]+$/g, '');
  return name || 'crafter-store';
}

export function createStore(targetDir, { force = false } = {}) {
  const target = resolve(targetDir);
  if (existsSync(target) && readdirSync(target).length > 0 && !force) {
    throw new Error(`Directory "${targetDir}" is not empty. Use --force to write into it anyway.`);
  }

  cpSync(TEMPLATE_DIR, target, {
    recursive: true,
    filter: (src) => !SKIP.has(basename(src)),
  });

  for (const [from, to] of Object.entries(RENAME)) {
    const file = join(target, from);
    if (existsSync(file)) renameSync(file, join(target, to));
  }

  const pkgPath = join(target, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.name = toPackageName(target);
  pkg.version = '0.1.0';
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

  return target;
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes('-h') || args.includes('--help')) {
    process.stdout.write(HELP);
    return 0;
  }
  const force = args.includes('--force');
  const dir = args.find((arg) => !arg.startsWith('-'));
  if (!dir) {
    process.stderr.write(`Please name the directory for your store.\n\n${HELP}`);
    return 1;
  }

  let target;
  try {
    target = createStore(dir, { force });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }

  const cd = relative(process.cwd(), target) || '.';
  process.stdout.write(`
Created a Crafter store in ${target}

Next steps:
  cd ${cd}
  cp .env.example .env.local   # add your store id and API keys
  npm install
  npm run dev

Use test keys (cp_pk_test_..., cp_sk_test_...) and the card 4242 4242 4242 4242 while you build.
Docs: https://github.com/crafterhq/create-crafter-store#readme
`);
  return 0;
}

// Run only when executed directly (the tests import this file)
function isDirectRun() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}
if (isDirectRun()) {
  process.exitCode = main(process.argv);
}
