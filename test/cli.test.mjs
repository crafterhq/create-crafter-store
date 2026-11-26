import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore, toPackageName } from '../bin/create-crafter-store.mjs';

const BIN = fileURLToPath(new URL('../bin/create-crafter-store.mjs', import.meta.url));

function tempDir() {
  return mkdtempSync(join(tmpdir(), 'create-crafter-store-'));
}

test('copies the template, renames gitignore and sets the package name', () => {
  const root = tempDir();
  try {
    const target = createStore(join(root, 'My Store'));
    assert.ok(existsSync(join(target, '.gitignore')));
    assert.ok(!existsSync(join(target, 'gitignore')));
    assert.ok(existsSync(join(target, '.env.example')));
    assert.ok(existsSync(join(target, 'src/app/api/checkout/route.ts')));
    assert.ok(!existsSync(join(target, 'node_modules')));
    assert.ok(!existsSync(join(target, '.next')));
    const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'my-store');
    assert.equal(pkg.private, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('refuses a non-empty directory unless --force is given', () => {
  const root = tempDir();
  try {
    writeFileSync(join(root, 'existing.txt'), 'x');
    assert.throws(() => createStore(root), /not empty/);
    createStore(root, { force: true });
    assert.ok(existsSync(join(root, 'package.json')));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the bin prints next steps and fails without a directory', () => {
  const root = tempDir();
  try {
    const out = execFileSync(process.execPath, [BIN, 'shop'], { cwd: root, encoding: 'utf8' });
    assert.match(out, /npm install/);
    assert.ok(existsSync(join(root, 'shop', 'package.json')));
    assert.throws(() => execFileSync(process.execPath, [BIN], { cwd: root, stdio: 'pipe' }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('package names are npm safe', () => {
  assert.equal(toPackageName('/tmp/My Cool Store!'), 'my-cool-store');
  assert.equal(toPackageName('/tmp/---'), 'crafter-store');
});
