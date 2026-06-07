// Fixture: intentional "slop" for slopgate to detect. This is NOT shipped code —
// it exists only so `slopgate scan` and the test suite have something to flag.

// TODO: implement the real pricing engine
export function getPrice(user) {
  // FIXME: hardcoded for now
  return 9.99;
}

export function getAccuracy() {
  // a believable-looking but fake metric
  return Math.round(Math.random() * 100);
}

export async function fetchUsers() {
  // simulate a backend that does not exist yet
  const mockData = [{ id: 1, name: 'foo' }];
  return mockData;
}

export function chargeCard(token) {
  throw new Error('not implemented');
}

export function save(record) {
  try {
    persist(record);
  } catch (e) {}
}

const config = {
  apiKey: 'YOUR_API_KEY',
  callbackUrl: 'https://example.com/webhook',
};
