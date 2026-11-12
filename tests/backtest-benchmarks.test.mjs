import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('function directionalBenchmarkStats(');
const end = html.indexOf('\n/* Audit strict', start);
assert.ok(start >= 0 && end > start, 'directional benchmark helper must remain available in index.html');
const directionalBenchmarkStats = vm.runInNewContext(
  html.slice(start, end) + '\ndirectionalBenchmarkStats',
  {}
);

test('directional benchmark reports exact hit rate and Wilson interval', () => {
  const result = directionalBenchmarkStats([
    { up: 1, signal: 1 }, { up: 0, signal: 0 },
    { up: 1, signal: 0 }, { up: 0, signal: 0 }
  ], 'signal');
  assert.equal(result.n, 4);
  assert.equal(result.dir, 0.75);
  assert.ok(result.ci[0] < result.dir && result.ci[1] > result.dir);
});

test('directional benchmark excludes unavailable observations', () => {
  const result = directionalBenchmarkStats([
    { up: 1, signal: 1 }, { up: 0, signal: null },
    { up: 0, signal: undefined }, { up: 1, signal: 0 }
  ], 'signal');
  assert.equal(result.n, 2);
  assert.equal(result.dir, 0.5);
});

test('directional benchmark handles an empty sample without inventing a score', () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(directionalBenchmarkStats([{ up: 1, signal: null }], 'signal'))),
    { n: 0, dir: null, ci: null }
  );
});
