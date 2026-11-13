import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const sw = readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);

test('five tabs and live panels exist', () => {
  for (const id of ['vHome','vChart','vCal','vJarvis','vStats','homeQtPrice','homeQtBias','homeQtWT','homeQtRSI','homeQtSource','prob30','prob90','prob365','qtPrice','qtWT','qtRSI','qtBias','jvPrice']) {
    assert.ok(ids.includes(id), 'Missing live panel '+id);
  }
  for (const tab of ['home','chart','cal','jarvis','stats']) assert.ok(html.includes('data-tab="'+tab+'"'));
});

test('blue gold HUD modules and real-data mirrors exist', () => {
  for (const id of ['cbDeckBias','cbDeckWT','cbDeckRSI','cbDeckSource','cb30','cb90','cb365','cbChartPrice','cbChartWT','cbChartRSI','cbChartBias','cbChartFeed','cbUnifiedHeader','cbUnifiedPrice','cbUnifiedFeed','cbUnifiedRegime']) {
    assert.ok(ids.includes(id), 'Missing HUD value '+id);
  }
  assert.match(html,/V38: synchronize scenario data/);
  assert.match(html,/V39: read-only mirrors of live values/);
  assert.match(html,/V40: responsive cinematic shell/);
  assert.match(html,/V41: header reflects existing live engine values/);
  assert.match(html,/prefers-reduced-motion:reduce/);
});

test('PWA cache has a versioned name', () => {
  assert.match(sw,/const CACHE = "cristal-btc-v\d+[-a-z0-9]+";/);
});
