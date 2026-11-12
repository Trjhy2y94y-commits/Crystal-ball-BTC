import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('function historicalStructureFeatures(');
const end = html.indexOf('\nfunction priceForecastAudit(', start);
assert.ok(start >= 0 && end > start, 'historical feature function must remain available');
const historicalStructureFeatures = vm.runInNewContext(
  html.slice(start, end) + '\nhistoricalStructureFeatures',
  {}
);

function candles(count) {
  const rows = [];
  let close = 30000;
  for (let i = 0; i < count; i++) {
    const wave = Math.sin(i / 11) * 180 + Math.cos(i / 37) * 260;
    const next = close + wave + (i % 17 === 0 ? 420 : -18);
    rows.push({
      t: Date.UTC(2024, 0, 1) + i * 86400000,
      o: close,
      h: Math.max(close, next) + 90 + (i % 5) * 7,
      l: Math.min(close, next) - 85 - (i % 3) * 9,
      c: next,
      v: 1000 + (i % 29) * 31
    });
    close = next;
  }
  return rows;
}

test('historical structure features are identical on a full series and its prefix', () => {
  const rows = candles(520);
  const origin = 470;
  const full = historicalStructureFeatures(rows, origin);
  const prefix = historicalStructureFeatures(rows.slice(0, origin + 1), origin);
  assert.deepEqual(JSON.parse(JSON.stringify(full)), JSON.parse(JSON.stringify(prefix)));
});

test('mutating every candle after the forecast origin cannot change its features', () => {
  const rows = candles(520);
  const origin = 470;
  const expected = historicalStructureFeatures(rows, origin);
  const alteredFuture = rows.map((row, i) => i <= origin ? { ...row } : {
    ...row,
    o: row.o * 4,
    h: row.h * 5,
    l: row.l / 5,
    c: row.c * 4,
    v: row.v * 1000
  });
  const actual = historicalStructureFeatures(alteredFuture, origin);
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)));
});

test('feature extraction clamps an origin to the available history', () => {
  const rows = candles(420);
  const last = historicalStructureFeatures(rows, rows.length - 1);
  const beyond = historicalStructureFeatures(rows, rows.length + 50);
  assert.deepEqual(JSON.parse(JSON.stringify(beyond)), JSON.parse(JSON.stringify(last)));
});
