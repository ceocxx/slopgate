// slopgate core scanner — walks files, applies rules, returns structured findings.
// Zero dependencies; Node built-ins only.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { rules as DEFAULT_RULES } from './rules.mjs';

export const SEVERITY_ORDER = { low: 1, medium: 2, high: 3 };

const CODE_EXT = new Set([
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java',
  '.rb', '.php', '.c', '.cc', '.cpp', '.h', '.hpp', '.cs', '.swift', '.kt',
  '.kts', '.scala', '.vue', '.svelte', '.sql', '.sh', '.bash',
]);

const ALWAYS_IGNORE = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', 'coverage',
  '.next', '.turbo', 'vendor', '.venv', 'venv', '__pycache__',
]);

function normalize(p) {
  return p.replace(/\\/g, '/');
}

function isTestPath(p) {
  const n = normalize(p);
  return /(^|\/)(tests?|__tests__|spec)\//.test(n) || /\.(test|spec)\.[a-z0-9]+$/i.test(n);
}

function isExcluded(relPath, name, excludes) {
  for (const raw of excludes) {
    const ex = normalize(raw).replace(/\/+$/, '');
    if (relPath === ex || relPath.startsWith(ex + '/') || name === ex) return true;
  }
  return false;
}

// Detect binary files by looking for a NUL byte in the first chunk.
// Uses char code 0 rather than embedding a literal control character.
function looksBinary(text) {
  const limit = Math.min(text.length, 8000);
  for (let i = 0; i < limit; i++) {
    if (text.charCodeAt(i) === 0) return true;
  }
  return false;
}

function buildLineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) starts.push(i + 1);
  }
  return starts;
}

function positionAt(starts, index) {
  let lo = 0;
  let hi = starts.length - 1;
  let line = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= index) {
      line = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return { line: line + 1, column: index - starts[line] + 1 };
}

function lineSlice(text, starts, line) {
  const start = starts[line - 1];
  const end = line < starts.length ? starts[line] - 1 : text.length;
  return text.slice(start, end);
}

// Scan a single text buffer. `displayPath` is used for reporting + test detection.
export function scanText(displayPath, text, options = {}) {
  const rules = options.rules || DEFAULT_RULES;
  const disabled = options.disabledRules || {};
  const testFile = isTestPath(displayPath);
  const starts = buildLineIndex(text);
  const findings = [];

  for (const rule of rules) {
    if (disabled[rule.id]) continue;
    if (testFile && rule.skipInTests) continue;
    const flags = rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g';
    const re = new RegExp(rule.pattern.source, flags);
    let match;
    while ((match = re.exec(text)) !== null) {
      const { line, column } = positionAt(starts, match.index);
      findings.push({
        file: displayPath,
        line,
        column,
        rule: rule.id,
        severity: rule.severity,
        message: rule.message,
        snippet: lineSlice(text, starts, line).trim().slice(0, 200),
      });
      if (match.index === re.lastIndex) re.lastIndex++;
    }
  }

  findings.sort((a, b) => a.line - b.line || a.column - b.column);
  return findings;
}

function collectFiles(target, excludes) {
  const stats = statSync(target);
  if (stats.isFile()) return [target]; // explicit file target bypasses excludes
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = join(dir, entry.name);
      const rel = normalize(relative(process.cwd(), full));
      if (isExcluded(rel, entry.name, excludes)) continue;
      if (entry.isDirectory()) {
        if (ALWAYS_IGNORE.has(entry.name)) continue;
        walk(full);
      } else if (entry.isFile() && CODE_EXT.has(extname(entry.name))) {
        files.push(full);
      }
    }
  };
  walk(target);
  return files;
}

// Scan one or more file/dir targets. Returns a structured result object.
export function scanPaths(targets, options = {}) {
  const excludes = options.exclude || [];
  const seen = new Set();
  for (const target of targets) {
    for (const file of collectFiles(target, excludes)) seen.add(file);
  }

  const findings = [];
  let filesScanned = 0;
  for (const file of seen) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (looksBinary(text)) continue;
    filesScanned++;
    const display = normalize(relative(process.cwd(), file)) || file;
    findings.push(...scanText(display, text, options));
  }

  const bySeverity = { high: 0, medium: 0, low: 0 };
  for (const f of findings) bySeverity[f.severity]++;
  const filesWithFindings = new Set(findings.map((f) => f.file)).size;
  const threshold = options.failOn || 'medium';
  const thresholdRank = SEVERITY_ORDER[threshold] || SEVERITY_ORDER.medium;
  const pass = !findings.some((f) => SEVERITY_ORDER[f.severity] >= thresholdRank);

  return {
    tool: 'slopgate',
    version: options.version || '0.0.0',
    threshold,
    pass,
    summary: { filesScanned, filesWithFindings, findings: findings.length, bySeverity },
    findings,
  };
}
