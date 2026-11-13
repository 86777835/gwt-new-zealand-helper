// Two phones, full game: setup sync, random draws, seats, checklist, play stage with this game's bonus cards,
// scoring with negative rows and a tie, result, long image, archive, revision.
import assert from 'node:assert/strict';
import {BASE, browser, phone, act, pick, room, shot, score} from './helpers.mjs';
const b = await browser();
try {
  const c1 = await phone(b), c2 = await phone(b), p = await c1.newPage(), q = await c2.newPage(), errors = [];
  for (const x of [p, q]) x.on('pageerror', e => errors.push(e.message));
  const code = await room(p);
  await pick(p, 'n', 3);
  await p.fill('[data-player="p0"]', '阿青'); await p.locator('[data-player="p0"]').blur(); await p.waitForSelector('.seats:has-text("阿青")');
  assert.match(await p.locator('[data-act="order"]').innerText(), /手指轮盘/);
  await pick(p, 'first', 1);
  assert.match(await p.locator('.seats').innerText(), /玩家2[\s\S]*1 号位：7 元，抽 4 张[\s\S]*玩家3[\s\S]*8 元[\s\S]*阿青[\s\S]*9 元，抽 6 张/);
  await q.goto(p.url()); await q.waitForSelector('#checklist');
  assert(await q.locator('[data-act="begin"]').isDisabled(), 'guest cannot start');
  assert(await q.locator('[data-act="neutral"]').first().isDisabled(), 'guest cannot draw');
  // random draws sync to the other phone
  await act(p, 'neutral', '[data-val="random"]'); await q.waitForSelector('.map:not(.ten)');
  assert.equal(new Set((await q.locator('.map:not(.ten) b').allInnerTexts())).size, 8);
  await act(p, 'redraw', '[data-val="sets"]'); await q.waitForSelector('.placed li:nth-child(4)');
  assert.match(await q.locator('.placed').innerText(), /船舵[\s\S]*酒桶[\s\S]*钟[\s\S]*罗盘/);
  assert.match(await q.locator('.placed').innerText(), /这个组合放 5 张/);
  // hand-picked sets: tap off one, tap another
  const sets = (await p.locator('.chips.sets [aria-pressed="true"]').allInnerTexts()).map(Number);
  const other = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find(k => !sets.includes(k));
  await act(p, 'set', `[data-val="${sets[0]}"]`); await act(p, 'set', `[data-val="${other}"]`);
  await q.waitForSelector(`.chips.sets [data-val="${other}"][aria-pressed="true"]`);
  const list = await q.locator('#checklist').innerText();
  assert.match(list, /抽 13 块[\s\S]*一共 5 块，前两行都要填[\s\S]*翻开 11 张/); assert.match(list, /按上面抽到的顺序/);
  await q.locator('[data-check="board"] + .tick').click(); await p.waitForSelector('[data-check="board"]:checked');
  await shot(p, 'setup');
  await act(p, 'begin'); await q.waitForSelector('.setlist');
  assert.equal(await q.locator('.setlist li').count(), 4);
  await q.click('[data-act="ref"][data-id="wellington"]'); assert.match(await q.locator('.refcard[data-k="ref-wellington"]').innerText(), /重复的同种羊/);
  await shot(q, 'play');
  await act(p, 'end'); await q.waitForSelector('#score-form');
  // A draft on one phone survives the other phone's update.
  await p.fill('#score-form [name="v1"]', '17');
  await score(q, 'p1', {0: 24, 1: 10, 2: -6, 7: 4, 11: 5});
  assert.equal(await p.inputValue('#score-form [name="v1"]'), '17');
  assert.match(await q.locator('#preview').innerText(), /总分\s*17/);   // 24 元 → 4, + 10 − 6 + 4 + 5
  await score(p, 'p0', {0: 10, 1: 15});      // 2 + 15 = 17
  await score(p, 'p2', {3: 9, 9: 3});        // 12
  await shot(p, 'score');
  await act(p, 'finish'); await p.waitForSelector('#shot'); await q.waitForSelector('#shot');
  const rows = await p.locator('#shot .rank').allInnerTexts();
  assert.equal(rows.length, 3); assert.match(rows[0], /^1[\s\S]*阿青[\s\S]*17/); assert.match(rows[1], /^1[\s\S]*玩家2[\s\S]*贸易站 -6[\s\S]*17/); assert.match(rows[2], /^3[\s\S]*12/);
  assert.match(await p.locator('#shot').innerText(), /共享名次/);
  await shot(p, 'result');
  await act(p, 'image'); assert((await p.locator('.overlay img').getAttribute('src')).startsWith('data:image/png')); await shot(p, 'long_image'); await p.click('#close-image');
  const saved = async () => (await (await p.request.get(new URL('/api/games', BASE).href)).json()).filter(g => g.code === code);
  await p.waitForFunction(async c => (await (await fetch('/api/games')).json()).some(g => g.code === c), code);
  let games = await saved(); assert.equal(games.length, 1); assert.equal(games[0].config.n, 3); assert.equal(games[0].results.find(r => r.id === 'p0').total, 17);
  await act(p, 'reopen'); await p.waitForSelector('#score-form');
  await score(p, 'p2', {3: 30}); await act(p, 'finish'); await p.waitForSelector('#shot');
  await p.waitForFunction(async c => (await (await fetch('/api/games')).json()).some(g => g.code === c && g.results[0].total === 30), code);
  games = await saved(); assert.equal(games.length, 1, 'a revised game replaces its record');
  assert.deepEqual(errors, []);
  console.log('PASS two phones: seats and money, random draws sync, set picking, checklist, play cards, drafts, negative row, ties, result, long image, archive, revision');
} finally { await b.close(); }
