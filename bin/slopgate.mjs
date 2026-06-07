#!/usr/bin/env node
// slopgate — catch AI slop before it ships.
// Open-source CLI entrypoint. Zero runtime dependencies.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { scanPaths } from '../src/scanner.mjs';
import { formatText, formatJson } from '../src/report.mjs';
import { cloudCommand } from '../src/cloud.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'));

const HELP = `slopgate v${pkg.version} — catch AI slop before it ships

USAGE
  slopgate scan [path ...]      Scan files/dirs (default: current directory)
  slopgate cloud <command>      Hosted CI gate + dashboard (paid tier — not built yet)
  slopgate --version
  slopgate --help

SCAN OPTIONS
  --json                        Machine-readable JSON output
  --fail-on <low|medium|high>   Minimum severity that fails the run (default: medium)
  --quiet                       Hide the matched source line for each finding

EXIT CODES
  0   clean — nothing at or above the fail-on threshold
  1   slop found at or above the threshold
  2   usage or configuration error

CONFIG
  Optional slopgate.config.json in the working directory:
    { "failOn": "medium", "exclude": ["dist"], "rules": { "placeholder-value": false } }
`;

function parseArgs(argv) {
  const opts = { _: [], json: false, quiet: false, failOn: undefined, help: false, version: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opts.json = true;
    else if (a === '--quiet' || a === '-q') opts.quiet = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--version' || a === '-v') opts.version = true;
    else if (a === '--fail-on') opts.failOn = argv[++i];
    else if (a.startsWith('--fail-on=')) opts.failOn = a.slice('--fail-on='.length);
    else opts._.push(a);
  }
  return opts;
}

function loadConfig(cwd) {
  const p = join(cwd, 'slopgate.config.json');
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (err) {
    process.stderr.write(`slopgate: cannot parse slopgate.config.json: ${err.message}\n`);
    process.exit(2);
  }
}

function disabledFromConfig(rulesCfg) {
  const disabled = {};
  if (rulesCfg && typeof rulesCfg === 'object') {
    for (const [id, enabled] of Object.entries(rulesCfg)) {
      if (enabled === false) disabled[id] = true;
    }
  }
  return disabled;
}

function run(argv) {
  const opts = parseArgs(argv);
  if (opts.version) {
    process.stdout.write(`${pkg.version}\n`);
    return 0;
  }
  if (opts.help) {
    process.stdout.write(HELP);
    return 0;
  }

  const command = opts._[0];
  if (!command) {
    process.stdout.write(HELP);
    return 0;
  }
  if (command === 'cloud') {
    return cloudCommand(opts._.slice(1));
  }
  if (command !== 'scan') {
    process.stderr.write(`slopgate: unknown command '${command}'. Run 'slopgate --help'.\n`);
    return 2;
  }

  const cwd = process.cwd();
  const config = loadConfig(cwd);
  const targets = opts._.slice(1);
  if (targets.length === 0) targets.push('.');
  for (const t of targets) {
    if (!existsSync(t)) {
      process.stderr.write(`slopgate: path not found: ${t}\n`);
      return 2;
    }
  }

  const failOn = opts.failOn || config.failOn || 'medium';
  if (!['low', 'medium', 'high'].includes(failOn)) {
    process.stderr.write(`slopgate: invalid --fail-on '${failOn}' (use low, medium, or high)\n`);
    return 2;
  }

  const result = scanPaths(targets, {
    version: pkg.version,
    failOn,
    exclude: config.exclude || [],
    disabledRules: disabledFromConfig(config.rules),
  });

  process.stdout.write(opts.json ? formatJson(result) : formatText(result, { quiet: opts.quiet, targets }));
  return result.pass ? 0 : 1;
}

process.exit(run(process.argv.slice(2)));
