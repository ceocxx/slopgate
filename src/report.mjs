// slopgate reporters — human-readable text and machine-readable JSON.

const SEV_LABEL = { high: 'high  ', medium: 'medium', low: 'low   ' };
const CHECK = '✓';
const CROSS = '✗';

export function formatText(result, { quiet = false, targets = ['.'] } = {}) {
  const out = [];
  out.push(`slopgate v${result.version} — scanned ${targets.join(', ')}`);
  out.push('');

  if (result.findings.length === 0) {
    out.push(`${CHECK} PASS — no slop found (threshold: ${result.threshold}); ${result.summary.filesScanned} file(s) scanned`);
    return out.join('\n') + '\n';
  }

  const byFile = new Map();
  for (const f of result.findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }

  for (const [file, items] of byFile) {
    out.push(file);
    for (const f of items) {
      const loc = `${f.line}:${f.column}`.padEnd(7);
      out.push(`  ${loc} ${SEV_LABEL[f.severity]}  ${f.rule.padEnd(20)} ${f.message}`);
      if (!quiet) out.push(`  ${' '.repeat(7)}         ${f.snippet}`);
    }
    out.push('');
  }

  const s = result.summary;
  out.push(`Summary: ${s.findings} finding(s) — ${s.bySeverity.high} high, ${s.bySeverity.medium} medium, ${s.bySeverity.low} low — in ${s.filesWithFindings} of ${s.filesScanned} file(s)`);
  out.push(
    result.pass
      ? `${CHECK} PASS — nothing at or above threshold (${result.threshold})`
      : `${CROSS} FAIL — slop found at or above threshold (${result.threshold})`,
  );
  return out.join('\n') + '\n';
}

export function formatJson(result) {
  return JSON.stringify(result, null, 2) + '\n';
}
