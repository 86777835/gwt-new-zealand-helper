// Rules logic: setup numbers per player count, config validation, scoring rows, Sarah, ties, token check, random draws.
import assert from 'node:assert/strict';
import {PER_N, ROWS, initialState, reduce, configError, defaultConfig, units, total, standings, scoreError, drawNeutral, drawSides, drawSets, setupN} from '../public/logic.js';
import {setupList, summary, setInfo} from '../public/steps.js';
const H = 'host-123456789012';
const go = (s, a) => reduce(s, a, H);
let s = go(initialState(), {t: 'claim'});

// player-count numbers (EN p4–5); solo uses the 2-player setup
assert.deepEqual(PER_N[2], {bagA: 12, bonusTiles: 3, sheep: 9, setCards: 3});
assert.deepEqual(PER_N[4], {bagA: 14, bonusTiles: 7, sheep: 14, setCards: 6});
assert.equal(setupN({n: 1}), 2);
const text = st => setupList(st).flatMap(x => x.items).map(x => x.text).join('\n');
s = go(s, {t: 'config', config: {...defaultConfig(), n: 3}});
assert.match(text(s), /抽 <b>13<\/b> 块/); assert.match(text(s), /一共 5 块/); assert.match(text(s), /翻开 <b>11<\/b> 张/); assert.match(text(s), /补到 <b>5<\/b> 张/);
assert.match(text(s), /罗姆尼羊 <b>18<\/b> 张/); assert.match(text(s), /开局就有 1 金块/);
assert.doesNotMatch(text(s), /莎拉/);
s = go(s, {t: 'config', config: {...s.config, n: 1, level: 'easy'}});
assert.match(text(s), /#1、#6、#8、#14、#15、#16、#17/); assert.match(text(s), /第一次运送去 3 号/); assert.match(text(s), /一共 3 块/);
assert.equal(summary(s.config), '单人对莎拉（简单）');

// config validation
assert.equal(configError({...defaultConfig(), sets: [1, 2, 2]}), '奖励卡组无效');
assert.equal(configError({...defaultConfig(), sets: [3, 1]}), '奖励卡组无效');
assert.equal(configError({...defaultConfig(), sets: [1, 2, 3, 4, 5]}), '奖励卡组无效');
assert.equal(configError({...defaultConfig(), neutral: 'ABCDEFGA'}), '中立建筑顺序无效');
assert.equal(configError({...defaultConfig(), sides: 'abab'}), '私有建筑朝向无效');
assert.equal(configError({...defaultConfig(), n: 2, first: 2}), '人数或先手无效');

// random draws are valid
let seed = 7; const rnd = n => (seed = (seed * 9301 + 49297) % 233280) % n;
for (let i = 0; i < 50; i++) assert.equal(configError({...defaultConfig(), neutral: drawNeutral(rnd), sides: drawSides(rnd), sets: drawSets(rnd)}), '');
for (let k = 1; k <= 10; k++) assert(setInfo(k).text.length > 10);

// scoring: money in pounds → points, negative rows, Sarah skips 3 rows
const v = arr => ({v: arr, note: '', confirmed: true});
const me = {id: 'p0'};
assert.equal(total(me, v([23, 10, -5, 8, 12, 9, 20, -3, 6, 3, 8, 5])), 4 + 10 - 5 + 8 + 12 + 9 + 20 - 3 + 6 + 3 + 8 + 5);
s = go(s, {t: 'direct'});
assert.deepEqual(units(s).map(u => u.id), ['p0', 'sarah']);
assert.match(scoreError(s, 'sarah', v([5, 0, 0, 0, 0, 0, 0, 0, null, null, 0, 0])), /莎拉不计「钱」/);
assert.equal(scoreError(s, 'sarah', v([null, 1, 2, 3, 4, 5, 6, 7, null, null, 8, 0])), '');
assert.equal(total({id: 'sarah', bot: true}, v([null, 1, 2, 3, 4, 5, 6, 7, null, null, 8, 0])), 36);
assert.match(scoreError(s, 'p0', v([0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0])), /开拓者轨/);
assert.match(scoreError(s, 'p0', v([0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0])), /只能是 0 或 3/);
assert.match(scoreError(s, 'p0', v([0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])), /私有建筑/);
assert.match(scoreError(s, 'p0', {...v([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, null])}), /还有项目没填/);
assert.equal(ROWS.length, 12);

// ties are shared; only one bonus tiles market token
let m = go(go(initialState(), {t: 'claim'}), {t: 'direct'});
m = go(m, {t: 'score', id: 'p0', score: v([10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5])});
m = go(m, {t: 'score', id: 'p1', score: v([10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5])});
assert.throws(() => go(m, {t: 'finish'}), /只能一个人拿 5 分/);
m = go(m, {t: 'score', id: 'p1', score: v([10, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])});
m = go(m, {t: 'finish'});
assert.deepEqual(standings(m).map(r => [r.id, r.place, r.total]), [['p0', 1, 7], ['p1', 1, 7]]);
assert.throws(() => reduce(m, {t: 'config', config: defaultConfig()}, 'guest-123456789012'), /主持人/);
console.log('PASS logic: per-count setup, solo list, validation, random draws, set texts, scoring rows, Sarah, shared ties, single token');
