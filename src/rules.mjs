// slopgate detection rules. Each rule is a global RegExp run over the file text.
// Rules marked `skipInTests` are suppressed in *.test.* / *.spec.* / test dirs,
// where mocks and fakes are legitimate.
//
// NOTE: this file necessarily contains the literal patterns it looks for, so it
// is listed under `exclude` in slopgate.config.json to stop the tool from
// flagging its own rule definitions when scanning this repo.

export const rules = [
  {
    id: 'placeholder-comment',
    severity: 'medium',
    pattern: /\b(TODO|FIXME|HACK|XXX|STUB|PLACEHOLDER)\b/g,
    message: 'Marker comment — unfinished work left in shipped code.',
  },
  {
    id: 'not-implemented',
    severity: 'high',
    pattern: /not[ _-]?implemented|NotImplementedError|unimplemented!\(\)/gi,
    message: 'Stub — this code path is explicitly not implemented.',
  },
  {
    id: 'fake-randomness',
    severity: 'medium',
    skipInTests: true,
    pattern: /Math\.random\s*\(/g,
    message: 'Math.random() — confirm this is not generating user-visible fake data or metrics.',
  },
  {
    id: 'simulated-data',
    severity: 'medium',
    skipInTests: true,
    pattern: /\b(fakeData|mockData|dummyData|sampleData|fake_data|mock_data|simulated?|hardcoded)\b/gi,
    message: 'Possible simulated or placeholder data in non-test code.',
  },
  {
    id: 'empty-catch',
    severity: 'medium',
    pattern: /catch\s*(?:\([^)]*\))?\s*\{\s*\}/g,
    message: 'Empty catch block silently swallows errors.',
  },
  {
    id: 'placeholder-value',
    severity: 'low',
    pattern: /\b(your[_-]?api[_-]?key|changeme|change_me|lorem ipsum)\b|example\.com/gi,
    message: 'Placeholder value — replace before shipping.',
  },
  {
    id: 'fill-in-text',
    severity: 'medium',
    pattern: /\b(your code here|implement (this|me)|coming soon|fill (this )?in|placeholder text)\b/gi,
    message: 'Fill-in placeholder text left in code.',
  },
];
