# slopgate

[![ci](https://github.com/ceocxx/slopgate/actions/workflows/ci.yml/badge.svg)](https://github.com/ceocxx/slopgate/actions/workflows/ci.yml)

**Catch AI slop before it ships.** A zero-dependency CLI that scans your codebase for the junk AI coding agents leave behind — stubs, placeholder comments, fake data, swallowed errors — and fails CI when it finds them.

> **Status (v0.3.0):** the open-source CLI works today (see [Verified](#verified)). The hosted **Slopgate Cloud** tier is **not built yet** — the `cloud` command says so and exits non-zero rather than pretend it works.

## Why

AI agents generate *plausible* code fast. Plausible is not the same as real: a function that returns `9.99` under a `// TODO: implement pricing`, a metric backed by `Math.random()`, a `catch {}` that hides the error. Slopgate is a fast, deterministic gate that catches those patterns before they reach `main`.

## What it catches

| Rule | Severity | Flags |
|------|----------|-------|
| `not-implemented` | high | `not implemented`, `NotImplementedError`, `unimplemented!()`, `panic("TODO")` |
| `merge-conflict` | high | unresolved `<<<<<<<` / `>>>>>>>` conflict markers |
| `debugger-statement` | high | leftover `debugger;` |
| `placeholder-comment` | medium | `TODO`, `FIXME`, `HACK`, `XXX`, `STUB`, `PLACEHOLDER` |
| `fake-randomness` | medium | `Math.random(` — suppressed in test files |
| `simulated-data` | medium | `mockData`, `fakeData`, `simulate`, `hardcoded`, … — suppressed in tests |
| `empty-catch` | medium | `catch {}` / `catch (e) {}` that swallow errors |
| `fill-in-text` | medium | `your code here`, `implement this`, `coming soon`, … |
| `placeholder-value` | low | `YOUR_API_KEY`, `changeme`, `example.com`, `lorem ipsum` |
| `type-suppression` | low | `@ts-ignore`, `@ts-nocheck`, `# type: ignore` |

Test files (`*.test.*`, `*.spec.*`, `test/`) are automatically exempt from the fake-data rules, where mocks are legitimate.

## Install

**From npm:**

```sh
npm install -g @xiis/slopgate
slopgate scan .
```

Or run straight from GitHub without installing:

```sh
npx github:ceocxx/slopgate scan .
```

Or clone and run from source:

```sh
git clone https://github.com/ceocxx/slopgate
cd slopgate
node bin/slopgate.mjs scan path/to/your/code
```

## Usage

```sh
slopgate scan .                      # scan the current directory
slopgate scan src/ api/              # scan specific paths
slopgate scan . --json               # machine-readable output for CI
slopgate scan . --fail-on high       # only fail on high-severity slop
slopgate scan . --diff origin/main   # only flag slop on lines changed vs origin/main
```

### Adopting on an existing repo

A legacy codebase will light up on the first scan. Use `--diff` so the gate only
judges the lines a change actually touched — pre-existing slop is ignored, new
slop is blocked:

```sh
slopgate scan . --diff origin/main
```

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | clean — nothing at or above the threshold |
| `1` | slop found at or above the threshold |
| `2` | usage or config error |

That makes it a drop-in CI gate:

```yaml
# .github/workflows/slop.yml — block PRs that add new slop
- run: npx slopgate scan . --diff origin/${{ github.base_ref }} --fail-on medium
```

## Configuration

Optional `slopgate.config.json` in your repo root:

```json
{
  "failOn": "medium",
  "exclude": ["dist", "vendor", "src/generated"],
  "rules": { "placeholder-value": false }
}
```

## Open-core

The **CLI in this repo is free and Apache-2.0** — fork it, self-host it, run it in CI forever. The planned **Slopgate Cloud** (hosted gate, team dashboard, trend history, shared rule sets, PR annotations) is the commercial layer. The split is deliberate: the thing that builds trust is open; the hosted convenience teams pay for is not.

## Verified

Every claim above is backed by a runnable artifact in this repo:

```sh
npm test                                              # unit tests (node --test)
node bin/slopgate.mjs scan examples/slop-sample.js    # watch it flag real slop (exit 1)
node bin/slopgate.mjs scan examples/clean-sample.js   # clean code passes (exit 0)
node bin/slopgate.mjs scan .                           # the repo dogfoods its own gate
```

## Watching adoption

Real numbers from public sources — no telemetry is embedded in the CLI:

```sh
npm run usage    # npm download counts + GitHub stars / forks
```

## License

Apache-2.0 © Christopher Frost. See [LICENSE](LICENSE).
