// Git integration for diff mode — compute the set of added line numbers per file
// for `slopgate scan --diff <ref>`, so the scanner can report only NEW slop on
// lines changed since a ref (the adoption path for an existing repo).
import { execFileSync } from 'node:child_process';

// Parse `git diff --unified=0` output into Map<path, Set<lineNumber>> of added lines.
export function parseDiff(diffText) {
  const map = new Map();
  let current = null;
  for (const line of diffText.split('\n')) {
    if (line.startsWith('+++ ')) {
      const target = line.slice(4).trim();
      current = target === '/dev/null' ? null : target.replace(/^b\//, '');
      if (current && !map.has(current)) map.set(current, new Set());
    } else if (line.startsWith('@@') && current) {
      const match = /\+(\d+)(?:,(\d+))?/.exec(line);
      if (match) {
        const start = Number.parseInt(match[1], 10);
        const count = match[2] === undefined ? 1 : Number.parseInt(match[2], 10);
        for (let i = 0; i < count; i++) map.get(current).add(start + i);
      }
    }
  }
  return map;
}

// Run git and return the added-lines map for the working tree vs `ref`.
export function addedLines(ref, cwd = process.cwd()) {
  let out;
  try {
    out = execFileSync('git', ['diff', '--unified=0', '--no-color', ref, '--'], {
      cwd,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err) {
    const detail = err && err.stderr ? String(err.stderr).trim() : err.message;
    throw new Error(`git diff failed for ref '${ref}': ${detail}`);
  }
  return parseDiff(out);
}
