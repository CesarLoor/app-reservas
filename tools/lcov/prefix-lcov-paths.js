#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const [lcovPath, packagePrefix] = process.argv.slice(2);

if (!lcovPath || !packagePrefix) {
  console.error('Usage: node prefix-lcov-paths.js <lcovPath> <packagePrefix>');
  process.exit(1);
}

const absoluteLcovPath = path.resolve(process.cwd(), lcovPath);
const normalizedPrefix = packagePrefix.replace(/\\/g, '/').replace(/\/+$/, '');
const isAbsolutePath = (sourcePath) =>
  path.isAbsolute(sourcePath) || /^[A-Za-z]:[\\/]/.test(sourcePath);

const content = fs.readFileSync(absoluteLcovPath, 'utf8');
const normalized = content
  .split(/\r?\n/)
  .map((line) => {
    if (!line.startsWith('SF:')) return line;

    const sourcePath = line.slice(3).replace(/\\/g, '/');
    if (isAbsolutePath(sourcePath) || sourcePath.startsWith(`${normalizedPrefix}/`)) {
      return `SF:${sourcePath}`;
    }

    return `SF:${normalizedPrefix}/${sourcePath.replace(/^\.?\//, '')}`;
  })
  .join('\n');

fs.writeFileSync(absoluteLcovPath, normalized);
