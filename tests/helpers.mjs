// Shared Playwright helpers. Complete games only ever run against a local wrangler dev.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
export const BASE = process.argv[2] || 'http://localhost:8961/';
export const OUT = process.argv[3] || '/tmp/claude-501/gwtnz_shots';
assert(['localhost', '127.0.0.1'].includes(new URL(BASE).hostname), 'Only run complete games locally');
export async function browser() { await mkdir(OUT, {recursive: true}); return chromium.launch({channel: 'chrome'}); }
// A phone context. Reviews to the live hub are always intercepted: no test data goes online.
export async function phone(b) {
  const c = await b.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  await c.route('https://boardgame.leisurecat.cloud/**', r => r.fulfill({json: {ok: true}}));
  return c;
}
export const idle = p => p.waitForFunction(() => !document.querySelector('.conn')?.textContent.includes('保存中'));
export async function act(p, a, extra = '') { await p.locator(`[data-act="${a}"]${extra}`).first().click(); await p.waitForTimeout(150); await idle(p); }
export async function pick(p, key, val) { await p.click(`[data-act="config"][data-key="${key}"][data-val="${val}"]`); await p.waitForSelector(`[data-key="${key}"][data-val="${val}"][aria-pressed="true"]`); }
export async function room(p) { await p.goto(BASE); await act(p, 'create'); await p.waitForSelector('[data-act="begin"]:not(:disabled)'); return new URL(p.url()).searchParams.get('r'); }
export async function shot(p, name) { await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({path: `${OUT}/gwtnz_${name}.png`, fullPage: true}); }
export async function choose(p, id) { await p.click(`[data-act="mine"][data-id="${id}"]`); await p.waitForSelector(`#score-form[data-k="score-${id}"]`); }
// Fill a unit's score form and confirm it. vals: {row index: value}; rows not given are filled with 0 (only rows shown).
export async function score(p, id, vals = {}) {
  await choose(p, id);
  for (const i of [9, 11]) if (await p.locator(`[data-act="only"][data-i="${i}"]`).count()) await p.click(`[data-act="only"][data-i="${i}"][data-val="${vals[i] ?? 0}"]`);
  for (let i = 0; i < 12; i++) if (i !== 9 && i !== 11 && await p.locator(`#score-form [name="v${i}"]`).count()) await p.fill(`#score-form [name="v${i}"]`, String(vals[i] ?? 0));
  await p.click('#score-form [value="confirm"]');
  await p.waitForSelector(`[data-act="mine"][data-id="${id}"]:has-text("✓")`);
  await idle(p);
}
