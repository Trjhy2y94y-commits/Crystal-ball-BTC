import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('function validateMarketRows(');
const end = html.indexOf('\nasync function loadLive', start);
assert.ok(start >= 0 && end > start, 'validateMarketRows must remain available in index.html');
const validateMarketRows = vm.runInNewContext(
  html.slice(start, end) + '\nvalidateMarketRows',
  {}
);

const DAY = 86_400_000;
function candle(i) {
  const price = 60_000 + i * 10;
  return { t: 1_700_000_000_000 + i * DAY, o: price, h: price + 100, l: price - 100, c: price + 20, v: 12 };
}

test('sorts rows chronologically and counts duplicate timestamps', () => {
  const rows = Array.from({ length: 105 }, (_, i) => candle(i)).reverse();
  rows.push({ ...candle(20), v: 99 });
  const result = validateMarketRows(rows, '1d');
  assert.equal(result.quality.valid, 105);
  assert.equal(result.quality.duplicates, 1);
  assert.equal(result.rows[0].t < result.rows.at(-1).t, true);
  assert.equal(result.rows.find(row => row.t === candle(20).t).v, 99);
});

test('rejects impossible OHLC candles and counts missing daily candles', () => {
  const rows = Array.from({ length: 106 }, (_, i) => candle(i)).filter((_, i) => i !== 50);
  rows.push({ ...candle(107), h: 1 });
  const result = validateMarketRows(rows, '1d');
  assert.equal(result.quality.rejected, 1);
  assert.equal(result.quality.gaps, 1);
  assert.equal(result.quality.maxGap, 1);
});

test('fails closed when fewer than 100 valid candles remain', () => {
  assert.throws(() => validateMarketRows(Array.from({ length: 99 }, (_, i) => candle(i)), '1d'), /Historique OHLCV insuffisant/);
});
