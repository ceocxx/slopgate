import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { scanText, scanPaths, SEVERITY_ORDER } from '../src/scanner.mjs';
import { parseDiff } from '../src/gitdiff.mjs';

const slopFixture = fileURLToPath(new URL('../examples/slop-sample.js', import.meta.url));
const cleanFixture = fileURLToPath(new URL('../examples/clean-sample.js', import.meta.url));

test('flags multiple slop patterns in the slop fixture', () => {
  const findings = scanText('examples/slop-sample.js', readFileSync(slopFixture, 'utf8'));
  const ids = new Set(findings.map((f) => f.rule));
  assert.ok(findings.length >= 6, `expected >= 6 findings, got ${findings.length}`);
  assert.ok(ids.has('not-implemented'), 'should flag not-implemented stubs');
  assert.ok(ids.has('empty-catch'), 'should flag empty catch blocks');
  assert.ok(ids.has('fake-randomness'), 'should flag Math.random()');
  assert.ok(ids.has('placeholder-comment'), 'should flag TODO/FIXME markers');
});

test('reports zero findings on clean code', () => {
  const findings = scanText('examples/clean-sample.js', readFileSync(cleanFixture, 'utf8'));
  assert.equal(findings.length, 0, `expected 0 findings, got ${JSON.stringify(findings, null, 2)}`);
});

test('exempts test files from fake-data rules', () => {
  const findings = scanText('payments.test.js', 'const u = Math.random();\nconst mockData = [];');
  assert.equal(findings.filter((f) => f.rule === 'fake-randomness').length, 0);
  assert.equal(findings.filter((f) => f.rule === 'simulated-data').length, 0);
});

test('scanPaths fails (pass=false) when slop is present', () => {
  const result = scanPaths([slopFixture], { failOn: 'medium', version: '0.1.0' });
  assert.equal(result.pass, false);
  assert.ok(result.summary.findings >= 6);
  assert.ok(result.summary.bySeverity.high >= 1, 'fixture has a high-severity stub');
});

test('clean fixture passes at every threshold', () => {
  for (const failOn of ['low', 'medium', 'high']) {
    const result = scanPaths([cleanFixture], { failOn, version: '0.1.0' });
    assert.equal(result.pass, true, `clean fixture should pass at fail-on=${failOn}`);
    assert.equal(result.summary.findings, 0);
  }
});

test('placeholder value is a low-severity finding', () => {
  const findings = scanText('config.js', "const url = 'https://example.com';");
  assert.ok(findings.some((f) => f.rule === 'placeholder-value' && f.severity === 'low'));
});

test('severity ordering is sane', () => {
  assert.ok(SEVERITY_ORDER.high > SEVERITY_ORDER.medium);
  assert.ok(SEVERITY_ORDER.medium > SEVERITY_ORDER.low);
});

test('parseDiff extracts added line numbers per file', () => {
  const diff = [
    'diff --git a/src/x.js b/src/x.js',
    '--- a/src/x.js',
    '+++ b/src/x.js',
    '@@ -1,0 +2,3 @@',
    '+a',
    '+b',
    '+c',
    'diff --git a/src/y.js b/src/y.js',
    '--- a/src/y.js',
    '+++ b/src/y.js',
    '@@ -5 +5 @@',
    '+changed',
  ].join('\n');
  const map = parseDiff(diff);
  assert.deepEqual([...map.get('src/x.js')].sort((a, b) => a - b), [2, 3, 4]);
  assert.deepEqual([...map.get('src/y.js')], [5]);
});

test('restrictToLines keeps only findings on changed lines (diff mode)', () => {
  // line 22 of the slop fixture is the `throw new Error('not implemented')` stub
  const restrict = new Map([['examples/slop-sample.js', new Set([22])]]);
  const result = scanPaths([slopFixture], { failOn: 'medium', version: '0.1.0', restrictToLines: restrict });
  assert.ok(result.findings.length >= 1, 'should keep the finding on the changed line');
  assert.ok(result.findings.every((f) => f.line === 22), 'should drop findings on unchanged lines');
  assert.ok(result.findings.some((f) => f.rule === 'not-implemented'));
});
