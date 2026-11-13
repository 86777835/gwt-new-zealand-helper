// 大西部开拓者新西兰助手 · rules shared by the page and the authoritative Room (src/worker.js).
// Sources: EN = official English rulebook (eggertspiele 2023, 20 pages; page numbers are printed pages),
// SOLO = official solo rules v2 (2023-08). Errata and clarifications: docs/规则笔记.md §9.

export const LEVELS = {easy: '简单', medium: '中等', hard: '困难'};
export const NEUTRAL = 'ABCDEFGH';
export const SETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// What changes with the player count (EN p4–5). The solo game uses the 2-player setup (SOLO p1).
export const PER_N = {
  2: {bagA: 12, bonusTiles: 3, sheep: 9, setCards: 3},
  3: {bagA: 13, bonusTiles: 5, sheep: 11, setCards: 5},
  4: {bagA: 14, bonusTiles: 7, sheep: 14, setCards: 6}
};
// Starting money and hand by seat (EN p5, step 19). Everyone also takes 1 exchange token.
export const SEAT = [{money: 7, cards: 4}, {money: 8, cards: 5}, {money: 9, cards: 6}, {money: 10, cards: 7}];

// Score pad, 12 rows (EN p19). Row 1 is entered in pounds and converted (1 point per 5 pounds).
// min < 0: the row can be negative. only: the row can take just these values.
export const ROWS = [
  {k: 'money', name: '钱', sub: '填剩下多少元，每 5 元 1 分', max: 999},
  {k: 'private', name: '私有建筑', sub: '场上自己建筑印的分'},
  {k: 'posts', name: '贸易站', sub: '当地、外国、羊毛站上自己圆片露出的分；0 号站每个 −8；绿箭头两头都有才算', min: -300},
  {k: 'harbours', name: '港口', sub: '小型、中型港口上自己仓库和圆片露出的分，含左上黄箭头的 4 分'},
  {k: 'pathfinder', name: '开拓者轨', sub: '到过的最高分格，最多 15', max: 15},
  {k: 'tiles', name: '天灾与奖励板块', sub: '面前天灾、奖励板块印的分'},
  {k: 'cards', name: '卡牌分', sub: '整个牧羊牌库（个人牌库＋手牌＋弃牌区）里带分的羊和奖励卡，不含奖励目标卡'},
  {k: 'objectives', name: '目标卡', sub: '完成加分、没完成扣分；牧羊牌库里剩下的可以选择不算', min: -300},
  {k: 'harbourmaster', name: '港务长板块', sub: '每块下半部分的任务分'},
  {k: 'handLimit', name: '手牌上限格', sub: '右边那格清空了得 3 分', only: [0, 3]},
  {k: 'workers', name: '工人与仓库', sub: '每列第 5 格有工人 4 分，加上清空的仓库对 2/4 分'},
  {k: 'token', name: '奖励市场标记', sub: '触发终局、拿走标记的人 5 分', only: [0, 5]}
];
// Sarah does not score money, harbourmaster tiles or the hand limit space (SOLO p2).
export const SARAH_SKIP = ['money', 'harbourmaster', 'handLimit'];

const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
export const mode = c => c.n === 1 ? 'solo' : 'multi';
export const setupN = c => c.n === 1 ? 2 : c.n;

export function configError(c) {
  if (!c || !int(c.n, 1, 4) || !int(c.first, 0, Math.max(0, c.n - 1))) return '人数或先手无效';
  if (!LEVELS[c.level]) return '单人难度无效';
  if (typeof c.neutral !== 'string' || c.neutral && (c.neutral.length !== 8 || [...NEUTRAL].some(x => !c.neutral.includes(x)))) return '中立建筑顺序无效';
  if (typeof c.sides !== 'string' || c.sides && !/^[ab]{10}$/.test(c.sides)) return '私有建筑朝向无效';
  if (!Array.isArray(c.sets) || c.sets.length > 4 || c.sets.some(x => !SETS.includes(x)) || new Set(c.sets).size !== c.sets.length
    || c.sets.some((x, i) => i && x < c.sets[i - 1])) return '奖励卡组无效';
  return '';
}

// neutral '' = first game, tiles on their own letters; sides '' = everybody uses the a-sides (EN p4–5).
export const defaultConfig = () => ({n: 2, first: 0, level: 'medium', neutral: '', sides: '', sets: []});
export const emptyScore = () => ({v: ROWS.map(() => null), note: '', confirmed: false});

export function initialState() {
  return {
    revision: 0, host: null, stage: 'setup', config: defaultConfig(),
    players: Array.from({length: 4}, (_, i) => ({id: 'p' + i, name: '玩家' + (i + 1)})),
    checks: {}, scores: {}, gid: null, prev: null
  };
}

export const participants = s => s.players.slice(0, s.config.n);
// Seats in turn order, starting with the first player.
export const seatOrder = s => { const ps = participants(s); return ps.map((_, i) => ps[(s.config.first + i) % ps.length]); };

// Scoring units: one per player; the solo game adds Sarah.
export function units(s) {
  const list = participants(s).map(p => ({id: p.id, name: p.name}));
  if (mode(s.config) === 'solo') list.push({id: 'sarah', name: '莎拉', bot: true});
  return list;
}
export const rowsFor = u => ROWS.filter(r => !(u.bot && SARAH_SKIP.includes(r.k)));
export const rowPoints = (r, v) => r.k === 'money' ? Math.floor(v / 5) : v;

export function total(u, q) {
  return rowsFor(u).reduce((a, r) => a + rowPoints(r, q.v[ROWS.indexOf(r)] ?? 0), 0);
}
export const complete = (u, q) => !!q && rowsFor(u).every(r => q.v[ROWS.indexOf(r)] !== null);

export function scoreError(s, id, q) {
  const u = units(s).find(u => u.id === id);
  if (!u) return '本局没有这个玩家';
  if (!q || !Array.isArray(q.v) || q.v.length !== ROWS.length) return '分数无效';
  for (const [i, r] of ROWS.entries()) {
    const v = q.v[i];
    if (v === null) continue;
    if (u.bot && SARAH_SKIP.includes(r.k)) return `莎拉不计「${r.name}」`;
    if (r.only ? !r.only.includes(v) : !int(v, r.min ?? 0, r.max ?? 300)) return r.only ? `「${r.name}」只能是 ${r.only.join(' 或 ')}` : `「${r.name}」请填 ${r.min ?? 0}–${r.max ?? 300} 的整数`;
  }
  if (typeof q.note !== 'string' || q.note.length > 200 || typeof q.confirmed !== 'boolean') return '备注最多 200 字';
  if (q.confirmed && !complete(u, q)) return '还有项目没填，空着的填 0';
  return '';
}

// Ties are shared: the rulebook has no tie-breaker (EN p19).
export function standings(s) {
  const rows = units(s).map(u => ({...u, q: s.scores[u.id] || emptyScore()})).map(u => ({...u, total: total(u, u.q)}));
  rows.sort((a, b) => b.total - a.total);
  rows.forEach((r, i) => { r.place = i && rows[i - 1].total === r.total ? rows[i - 1].place : i + 1; });
  return rows;
}

const shuffle = (a, rnd) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Random setup choices, drawn on the host phone. rnd(n) returns an integer 0..n-1.
export const drawNeutral = rnd => shuffle([...NEUTRAL], rnd).join('');
export const drawSides = rnd => Array.from({length: 10}, () => 'ab'[rnd(2)]).join('');
export const drawSets = rnd => shuffle([...SETS], rnd).slice(0, 4).sort((a, b) => a - b);

export function reduce(s, a, actor) {
  if (!a || typeof a.t !== 'string') throw Error('无效操作');
  if (a.t === 'claim') { if (s.host && s.host !== actor) throw Error('已经有主持人了'); return {...s, host: actor, revision: s.revision + 1}; }
  const anyone = ['check', 'score'];
  if (!anyone.includes(a.t) && s.host !== actor) throw Error('这一步由主持人（建房的手机）来点');
  const n = structuredClone(s);
  n.prev = {...s, prev: null};
  n.revision++;
  switch (a.t) {
    case 'config': {
      if (s.stage !== 'setup') throw Error('开局后不能改设置');
      const e = configError(a.config); if (e) throw Error(e);
      n.config = structuredClone(a.config);
      break;
    }
    case 'player': {
      if (s.stage !== 'setup') throw Error('开局后不能改玩家');
      const p = n.players.find(p => p.id === a.id);
      if (!p) throw Error('没有这个座位');
      if (typeof a.name !== 'string' || !a.name.trim() || a.name.length > 16) throw Error('名字 1–16 个字');
      p.name = a.name.trim();
      break;
    }
    case 'check':
      if (s.stage === 'over' || typeof a.id !== 'string' || a.id.length > 60 || typeof a.value !== 'boolean') throw Error('无效的清单项');
      n.checks[a.id] = a.value;
      break;
    case 'begin': case 'direct': {
      if (s.stage !== 'setup') throw Error('已经开局了');
      const e = configError(s.config); if (e) throw Error(e);
      n.stage = a.t === 'direct' ? 'score' : 'play'; n.scores = {};
      n.gid = Date.now() + '-' + crypto.randomUUID();
      break;
    }
    case 'end':
      if (s.stage !== 'play') throw Error('现在不在对局中');
      n.stage = 'score';
      break;
    case 'score': {
      if (s.stage !== 'score') throw Error('还没到终局计分');
      const e = scoreError(s, a.id, a.score); if (e) throw Error(e);
      n.scores[a.id] = {v: a.score.v.slice(), note: a.score.note, confirmed: a.score.confirmed};
      break;
    }
    case 'finish': {
      if (s.stage !== 'score') throw Error('还没到终局计分');
      if (units(s).some(u => !s.scores[u.id]?.confirmed)) throw Error('还有人没确认分数');
      const ti = ROWS.findIndex(r => r.k === 'token');
      if (units(s).filter(u => s.scores[u.id].v[ti] === 5).length > 1) throw Error('奖励市场标记只有一个，只能一个人拿 5 分');
      n.stage = 'over';
      break;
    }
    case 'reopen':
      if (s.stage !== 'over') throw Error('还没结算');
      n.stage = 'score';
      break;
    case 'undo':
      if (!s.prev) throw Error('没有可以撤销的操作');
      return {...s.prev, host: s.host, revision: s.revision + 1, prev: null};
    default: throw Error('未知操作');
  }
  return n;
}

export function gameRecord(s) {
  return {
    gid: s.gid, config: s.config, mode: mode(s.config), ended: Date.now(),
    results: standings(s).map(r => ({id: r.id, name: r.name, place: r.place, total: r.total, bot: !!r.bot, score: r.q}))
  };
}
