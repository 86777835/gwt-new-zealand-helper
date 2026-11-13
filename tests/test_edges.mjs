// Other modes and conditions: solo against Sarah, 4 players, sides draw, offline draft.
import assert from 'node:assert/strict';
import {browser, phone, act, pick, room, shot, score, choose} from './helpers.mjs';
const b = await browser();
try {
  const c = await phone(b), p = await c.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  // Solo against Sarah: 2-player setup, difficulty, Sarah skips three rows
  await room(p); await pick(p, 'n', 1); await pick(p, 'level', 'hard');
  const list = await p.locator('#checklist').innerText();
  assert.match(list, /抽 12 块[\s\S]*一共 3 块[\s\S]*翻开 9 张/); assert.match(list, /#10–#13/); assert.match(list, /第一次运送去 9 号/);
  assert.match(list, /单人规则 p1/);
  assert.equal(await p.locator('[data-act="order"]').count(), 0);
  await shot(p, 'solo_setup');
  await act(p, 'direct');
  await score(p, 'p0', {0: 30, 4: 10});
  await choose(p, 'sarah');
  for (const i of [0, 8]) assert.equal(await p.locator(`#score-form [name="v${i}"]`).count(), 0);
  assert.equal(await p.locator('[data-act="only"][data-i="9"]').count(), 0);
  await score(p, 'sarah', {1: 12, 4: 6});
  await act(p, 'finish'); await p.waitForSelector('#shot');
  assert.match(await p.locator('#shot').innerText(), /莎拉[\s\S]*18[\s\S]*玩家1[\s\S]*16/);
  console.log('PASS solo: 2-player numbers, difficulty, Sarah rows, ranking');
  // 4 players: numbers and seat money; random private building sides
  await room(p); await pick(p, 'n', 4);
  assert.match(await p.locator('#checklist').innerText(), /抽 14 块[\s\S]*一共 7 块[\s\S]*翻开 14 张/);
  assert.match(await p.locator('.seats').innerText(), /4 号位：10 元，抽 7 张/);
  await act(p, 'sides', '[data-val="random"]'); await p.waitForSelector('[data-act="redraw"][data-val="sides"]');
  assert.equal((await p.locator('.map.ten b').allInnerTexts()).filter(t => /^\d+[ab]$/.test(t)).length, 10);
  assert.match(await p.locator('#checklist').innerText(), /按上面抽到的 a\/b 面摆/);
  await pick(p, 'n', 2); assert.equal(await p.locator('.seat').count(), 2);
  console.log('PASS 4 players numbers, seat money, sides draw, back to 2 players');
  // Offline: a score draft survives reconnecting
  await room(p); await act(p, 'direct'); await choose(p, 'p0');
  await c.setOffline(true); await p.waitForSelector('.conn.off');
  await p.fill('#score-form [name="v1"]', '21');
  await c.setOffline(false); await p.waitForSelector('.conn.on');
  assert.equal(await p.inputValue('#score-form [name="v1"]'), '21');
  console.log('PASS offline draft survives reconnect');
  assert.deepEqual(errors, []);
} finally { await b.close(); }
