// Slopgate Cloud — the hosted, paid tier: a CI gate as a service, a team
// dashboard, shared rule sets, and history across runs.
//
// It is deliberately NOT wired into the open-source CLI. Rather than fake a
// working integration, this command prints an honest "not available" notice and
// exits non-zero, so it can never be mistaken for a passing CI step.
export function cloudCommand() {
  process.stderr.write(
    [
      'Slopgate Cloud (hosted CI gate, team dashboard, shared rule sets) is the paid tier.',
      '',
      '  Status:   NOT AVAILABLE — no backend is connected to this command.',
      '  Tier:     paid / hosted. The open-source CLI is free and fully functional on its own.',
      '  Roadmap:  once the service exists, `slopgate cloud login` will authenticate to it.',
      '',
      'This command exits non-zero by design so it cannot masquerade as a passing step.',
      '',
    ].join('\n'),
  );
  return 2;
}
