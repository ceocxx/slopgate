#!/usr/bin/env node
// Adoption dashboard — real numbers from public sources (npm registry + GitHub API).
// No telemetry is embedded in the slopgate CLI; this script only reads public stats.
const PKG = 'slopgate';
const REPO = 'ceocxx/slopgate';

async function getJson(url, headers = {}) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'slopgate-usage', ...headers } });
    if (!res.ok) return { __status: res.status };
    return await res.json();
  } catch (err) {
    return { __error: err.message };
  }
}

async function npmDownloads(period) {
  const data = await getJson(`https://api.npmjs.org/downloads/point/${period}/${PKG}`);
  return data && typeof data.downloads === 'number' ? data.downloads : null;
}

async function main() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const ghHeaders = token ? { authorization: `Bearer ${token}` } : {};

  const [day, week, month, repo] = await Promise.all([
    npmDownloads('last-day'),
    npmDownloads('last-week'),
    npmDownloads('last-month'),
    getJson(`https://api.github.com/repos/${REPO}`, ghHeaders),
  ]);

  const lines = [];
  lines.push('');
  lines.push('slopgate — adoption snapshot');
  lines.push('='.repeat(42));
  lines.push('');
  lines.push(`npm downloads (${PKG}):`);
  if (day === null) {
    lines.push('  not published to npm yet — no download data');
  } else {
    lines.push(`  last day:   ${day}`);
    lines.push(`  last week:  ${week}`);
    lines.push(`  last month: ${month}`);
  }
  lines.push('');
  lines.push(`GitHub (${REPO}):`);
  if (repo.__status || repo.__error) {
    lines.push(`  could not read repo (${repo.__status || repo.__error})`);
  } else {
    lines.push(`  stars:       ${repo.stargazers_count}`);
    lines.push(`  forks:       ${repo.forks_count}`);
    lines.push(`  watchers:    ${repo.subscribers_count ?? repo.watchers_count}`);
    lines.push(`  open issues: ${repo.open_issues_count}`);
  }
  lines.push('');
  process.stdout.write(lines.join('\n') + '\n');
}

main().catch((err) => {
  process.stderr.write(`usage: ${err.message}\n`);
  process.exit(1);
});
