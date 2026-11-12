import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const mathsStart = html.indexOf('const ema=');
const mathsEnd = html.indexOf('\n\n/* cache des calculs lourds', mathsStart);
const liqStart = html.indexOf('function buildLiq(');
const liqEnd = html.indexOf('\n\n/* ---', liqStart);
assert.ok(mathsStart >= 0 && mathsEnd > mathsStart && liqStart >= 0 && liqEnd > liqStart,
  'liquidity builder and causal math helpers must remain available');

const DAY = 86400000;
const start = Date.UTC(2020, 0, 1);
const count = 1600;
function series(fn) {
  const out = [];
  for (let i = 0; i < count; i += 7) {
    out.push([new Date(start + i * DAY).toISOString().slice(0, 10), fn(i)]);
  }
  return out;
}
function makeMacro() {
  return {
    WM2NS: series(i => 22000 + i * 0.5 + Math.sin(i / 40) * 300),
    WALCL: series(i => 7000000 + i * 1000 + Math.sin(i / 20) * 50000),
    WTREGEN: series(i => 500000 + i * 50 + Math.sin(i / 15) * 20000),
    RRPONTSYD: series(i => 800000 + i * 200 + Math.sin(i / 30) * 30000),
    ECBASSETSW: series(i => 7000000 + i * 2000 + Math.sin(i / 50) * 70000),
    DEXUSEU: series(i => 1.1 + Math.sin(i / 100) * 0.05)
  };
}
function makeDaily(n) {
  return Array.from({ length: n }, (_, i) => ({
    t: start + i * DAY, o: 30000 + i, h: 30100 + i, l: 29900 + i, c: 30010 + i, v: 1000
  }));
}
function build(macro) {
  const context = { macro, liqCfg: { lag: 70, mode: 'mix' } };
  vm.runInNewContext(
    html.slice(mathsStart, mathsEnd) + '\n' + html.slice(liqStart, liqEnd),
    context
  );
  return context.buildLiq;
}

test('liquidity history is unchanged when BTC candles after the origin are appended', () => {
  const macro = makeMacro(), fn = build(macro), origin = 1400;
  const prefix = fn(makeDaily(origin + 1));
  const full = fn(makeDaily(count));
  assert.ok(Number.isFinite(prefix.liq[origin]), 'fixture must produce a real liquidity value');
  assert.equal(full.liq[origin], prefix.liq[origin]);
});

test('future macro observations cannot rewrite liquidity known at the forecast origin', () => {
  const macro = makeMacro(), origin = 1400, lag = 70, cutoff = start + (origin - lag) * DAY;
  const altered = structuredClone(macro);
  for (const [key, rows] of Object.entries(altered)) {
    for (const row of rows) {
      if (Date.parse(row[0] + 'T00:00:00Z') <= cutoff) continue;
      row[1] = key === 'DEXUSEU' ? row[1] + 0.02 : row[1] * 1.05;
    }
  }
  const daily = makeDaily(origin + 1);
  const expected = build(macro)(daily).liq[origin];
  const actual = build(altered)(daily).liq[origin];
  assert.ok(Number.isFinite(expected), 'fixture must produce a real liquidity value');
  assert.ok(Math.abs(actual - expected) < 1e-10,
    'post-cutoff macro observations must not affect the origin liquidity value');
});
