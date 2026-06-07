// Fixture: clean, honest code. slopgate should report zero findings here.
export function add(a, b) {
  return a + b;
}

export function formatName(first, last) {
  return `${first} ${last}`.trim();
}

export function parsePort(value, fallback = 3000) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}
