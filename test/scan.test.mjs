import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { scanText, scanPaths, SEVERITY_ORDER } from '../src/scanner.mjs';

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
