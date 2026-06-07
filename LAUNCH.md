# Launch copy for slopgate

Ready-to-post. No fabricated metrics — everything points at the real public repo
and the working `npx` command. Post from your own accounts.

---

## Show HN

**Title:** Show HN: Slopgate – catch AI "slop" (stubs, fake data, swallowed errors) in CI

**Body:**

I kept shipping code from AI agents that looked finished but wasn't: a function with
`// TODO: implement` over a hardcoded return, a "metric" backed by `Math.random()`,
an empty `catch {}` that hid the error.

Slopgate is a zero-dependency CLI that scans for those patterns and exits non-zero,
so it's a drop-in CI gate.

    npx github:ceocxx/slopgate scan .

- `--diff <ref>` gates only the lines a change touches, so you can adopt it on a
  messy existing repo without a wall of pre-existing findings.
- 7 rules, automatic test-file exemptions, JSON output, reusable GitHub Action.

Repo: https://github.com/ceocxx/slopgate

It's brand new — I'd especially value feedback on the rule set and the
false-positive rate.

---

## Reddit (r/programming, r/devtools, r/node)

**Title:** I built a zero-dep CLI that fails CI when AI leaves slop in your code (stubs, fake data, empty catches)

**Body:**

Same pain as above. The part I think is actually useful: `--diff origin/main` only
flags slop on changed lines, which is the difference between "adoptable on a real
codebase" and "1,000 findings on first run."

    npx github:ceocxx/slopgate scan .

Open source, Apache-2.0, zero dependencies: https://github.com/ceocxx/slopgate

Honest status: it launched today, so it has no users yet — feedback welcome.

---

## X / Twitter thread

1/ AI writes plausible code fast. Plausible isn't real: `// TODO: implement` over a
hardcoded return, `Math.random()` "metrics", empty `catch {}`. I built slopgate to
catch that before it merges.

2/ `npx github:ceocxx/slopgate scan .` — zero deps, exits non-zero on slop, so it's
a drop-in CI gate.

3/ `--diff origin/main` flags slop only on the lines you changed → adopt it on an
existing repo without drowning in pre-existing findings.

4/ Open source, Apache-2.0: https://github.com/ceocxx/slopgate
