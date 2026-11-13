// 大西部开拓者新西兰助手 · room page. The host phone sets up the game; every phone can tick the checklist and enter its own
// score. State lives in the Room Durable Object (src/worker.js); rules in logic.js; checklist and texts in steps.js / ref.js.
import {LEVELS, NEUTRAL, SEAT, PER_N, setupN, ROWS, mode, participants, seatOrder, units, rowsFor, rowPoints, total, complete, standings, emptyScore, configError, drawNeutral, drawSides, drawSets} from './logic.js';
import {BOOK, SUPPLY, setupList, setInfo, summary} from './steps.js';
import {REF, refCard} from './ref.js';
import {morph, esc} from './dom.js';

const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search);
const code = params.get('r');
const GAME = 'gwt-new-zealand';
// 定先后手用总入口的手指轮盘 / 抽签，点「返回」回到这里
const orderUrl = n => `https://boardgame.leisurecat.cloud/?order=${n}&back=${encodeURIComponent(location.href)}`;
const store = {get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} }};
const actor = store.get('gwtnz-actor') || crypto.randomUUID();
store.set('gwtnz-actor', actor);

let S = null, ws = null, online = false, pending = false, pendingScore = null;
// Screen state that morph() would otherwise wipe: open panels, drafts, choices not yet sent.
const ui = {rooms: [], error: '', busy: false, mine: store.get('gwtnz-unit') || 'p0', scores: {}, players: {}, open: {},
  review: {stars: 5, text: '', sent: false, name: null}, quick: params.has('quick'), prepOpen: true};

const COLORS = ['#2f6f8f', '#b5452f', '#d1a224', '#4e7d3a'];
const color = id => id === 'sarah' ? '#6b6560' : COLORS[Number(String(id).slice(1))] || COLORS[0];
const dot = id => `<span class="dot" style="--c:${color(id)}"></span>`;
const isHost = () => S?.isHost;
const hostOnly = () => !isHost() || !online || pending ? 'disabled' : '';
const anyone = () => !online || pending ? 'disabled' : '';
const roomQ = code ? '?r=' + code : '';
const tag = x => !x.page ? '' : x.page.startsWith('附') ? `<a class="tag" href="${BOOK.appendix}" target="_blank" rel="noopener">附录 ${esc(x.page.slice(1))}</a>`
  : `<a class="tag" href="${x.solo ? BOOK.solo : BOOK.rules}" target="_blank" rel="noopener">${x.solo ? '单人规则' : '规则书'} ${esc(x.page)}</a>`;
const STAGE = {setup: '准备中', play: '对局中', score: '计分中', over: '已结算'};

// Segmented control: each button sends act/key/val.
const seg = (act, key, options, value, dis = '') => `<div class="seg" role="group">${options.map(([v, t, sub]) =>
  `<button type="button" data-act="${act}" data-key="${key}" data-val="${esc(v)}" aria-pressed="${String(v) === String(value)}" ${dis}><span>${t}</span>${sub ? `<small>${sub}</small>` : ''}</button>`).join('')}</div>`;

function checklist(items, dis) {
  return `<ul class="steps">${items.map(x => {
    const on = !!S.checks[x.id];
    return `<li class="${on ? 'done' : ''}${x.warn ? ' warn' : ''}" data-k="setup-${x.id}"><label><input type="checkbox" data-check="${esc(x.id)}" ${on ? 'checked' : ''} ${dis}><span class="tick" aria-hidden="true"></span><span class="txt">${x.text}</span></label>${tag(x)}</li>`;
  }).join('')}</ul>`;
}

function notify(t) { $('#notice').textContent = t; clearTimeout(notify.timer); notify.timer = setTimeout(() => { $('#notice').textContent = ''; }, 6500); }
function render() { const t = document.createElement('div'); t.innerHTML = view(); morph($('#app'), t); }
function send(action) {
  if (!online || ws.readyState !== 1) return notify('连接断了，这一步没发出去。恢复连接后再点一次。');
  if (pending) return notify('上一步还在保存，稍等一下');
  pending = true;
  if (action.t === 'score') pendingScore = action;
  ws.send(JSON.stringify({revision: S.revision, action}));
  render();
}
function connect() {
  if (!navigator.onLine || ws && ws.readyState < 2) return;
  if (!/^[A-Z0-9]{4}$/.test(code || '')) { ui.error = '房间码是 4 位字母或数字'; return render(); }
  ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/room/${code}/ws?actor=${actor}`);
  ws.onopen = () => { online = true; render(); };
  ws.onmessage = e => {
    if (e.data === 'pong') return;
    const m = JSON.parse(e.data);
    pending = false;
    if (m.type !== 'state') { ui.error = m.error; notify(m.error); return render(); }
    S = m.state;
    // Drop the local draft once the server holds the same score.
    if (pendingScore && JSON.stringify(S.scores[pendingScore.id]) === JSON.stringify(pendingScore.score)) { delete ui.scores[pendingScore.id]; pendingScore = null; }
    if (!S.hasHost) send({t: 'claim'});
    render();
  };
  ws.onclose = () => { online = false; pending = false; render(); setTimeout(connect, 2500); };
  ws.onerror = () => notify('连不上房间，请检查网络');
}
window.addEventListener('offline', () => { ws?.close(); online = false; pending = false; render(); });
window.addEventListener('online', () => { if (code) connect(); });
setInterval(() => { if (ws?.readyState === 1) ws.send('ping'); }, 25000);

// ---------- landing ----------
function landing() {
  const rooms = ui.rooms.map(r => `<a class="room" href="/?r=${r.code}"><b class="rcode">${r.code}</b><span class="rinfo"><span>${esc(r.players.join('、'))}</span><small>${esc(summary(r.config))}</small></span><span class="chip ${r.stage === 'over' ? '' : 'live'}">${STAGE[r.stage] || '对局中'}</span></a>`).join('');
  return `<header class="hero"><a class="back-nav" href="https://boardgame.leisurecat.cloud">‹ 全部游戏</a><a class="back-nav rate-nav" href="https://boardgame.leisurecat.cloud/?rate=${GAME}&back=${encodeURIComponent(location.href)}">★ 写评价</a>
  <img class="cover" src="/img/cover.jpg" width="128" height="128" alt="大西部开拓者：新西兰开拓史简体中文版官方封面">
  <h1>大西部开拓者<span>新西兰开拓史 · 助手</span></h1><p class="motto">按人数列开局清单，终局 12 项分开算</p></header>
  <main class="landing">
   <section class="card entry">
    <button class="primary big" data-act="create" ${ui.busy ? 'disabled' : ''}>建一个房间</button>
    <p class="note center">建好后把房间码告诉同桌，大家看同一份清单、各自填分。</p>
    <div class="or"><span>或者输入房间码加入</span></div>
    <form id="join" class="join"><label class="sr-only" for="joinCode">房间码</label><input id="joinCode" placeholder="房间码" maxlength="4" required autocapitalize="characters" autocomplete="off"><button class="dark">加入</button></form>
    <button class="linkish" data-act="quick">已经打完了？直接去终局计分 ›</button>
   </section>
   <a class="teachgo" href="/teach"><span class="hexico" style="--h:var(--sea)">讲</span><span><b>第一次玩？${TEACH_MIN} 分钟讲规则</b>照着念就能开局，不懂的词点一下</span><i>›</i></a>
   <nav class="tiles">
    <a class="tile" href="/ref.html"><span class="hexico" style="--h:var(--grass)">查</span><span><b>局中速查</b><small>威灵顿、买羊、附属行动</small></span></a>
    <a class="tile" href="/guide.html"><span class="hexico" style="--h:var(--wool)">教</span><span><b>新手教程</b><small>流程、计分</small></span></a>
    <a class="tile" href="/guide.html#faq"><span class="hexico" style="--h:var(--rock)">问</span><span><b>常见问题</b><small>附规则书页码</small></span></a>
    <a class="tile" href="/history.html"><span class="hexico" style="--h:var(--pri)">录</span><span><b>往期对局</b><small>战绩与存档</small></span></a>
   </nav>
   <section class="rooms"><h2>最近的房间</h2>${rooms || '<p class="empty">还没有房间。</p>'}</section>
   <footer>非官方的线下辅助工具，需要实体游戏。<br>封面与游戏版权归原出版方。</footer>
  </main>`;
}
const TEACH_MIN = 4;

// ---------- room ----------
function bar() {
  const state = !online ? 'off' : pending ? 'busy' : 'on', label = !online ? '断线，重连中' : pending ? '保存中…' : '已连接';
  return `<header class="bar"><a class="back-nav" href="/">‹ 首页</a><b class="title">新西兰开拓史</b><button type="button" class="code" data-act="share" aria-label="复制邀请链接">${code}<small>邀请</small></button><span class="conn ${state}">${label}</span></header>`;
}
function view() {
  if (!code) return landing();
  if (!S) return `${bar()}<main><p class="empty">${esc(ui.error || '正在进入房间…')}</p></main>`;
  const body = S.stage === 'setup' ? setup() : S.stage === 'play' ? play() : S.stage === 'score' ? score() : result();
  return `${bar()}<div class="subbar"><span>${esc(summary(S.config))}</span><button type="button" class="undo" data-act="undo" ${hostOnly()} ${S.prev ? '' : 'disabled'}>撤销</button></div>
  <main>${isHost() ? '' : '<p class="hint">设置、开局和结算由主持人（建房的手机）来点；清单和分数谁都能填。</p>'}${body}
  <nav class="links"><a href="/ref.html${roomQ}">局中速查</a><a href="/guide.html${roomQ}">新手教程</a><a href="/guide.html${roomQ}#faq">常见问题</a><a href="/history.html${roomQ}">往期对局</a></nav></main>`;
}

// ---------- setup ----------
function setup() {
  const c = S.config, dis = hostOnly(), solo = mode(c) === 'solo', ps = participants(S);
  const items = setupList(S), all = items.flatMap(x => x.items), done = all.filter(x => S.checks[x.id]).length;
  return `${ui.quick ? '<p class="hint">选好人数、填好名字，就能直接去终局计分。</p>' : ''}
  <section class="card"><h2>这局怎么玩</h2>
   <h3>人数</h3>${seg('config', 'n', [[1, '单人', '对手莎拉'], [2, '2 人'], [3, '3 人'], [4, '4 人']], c.n, dis)}
   ${solo ? `<h3>莎拉的难度</h3>${seg('config', 'level', Object.entries(LEVELS), c.level, dis)}<p class="note">难度决定拿掉哪几张莎拉卡、她第一次运送去几号贸易站，开局清单会写明。</p>` : ''}
  </section>
  ${draws(c, dis)}
  <section class="card"><h2>${solo ? '玩家' : '座位'}</h2>
   <p class="note">${solo ? '' : '按顺时针填。'}</p>
   ${ps.map((p, i) => seat(p, i, dis)).join('')}
   ${solo ? '' : `<h3>起始玩家</h3>${seg('config', 'first', ps.map((p, i) => [i, esc(p.name)]), c.first, dis)}<button type="button" class="small" data-act="order" ${dis}>手指轮盘定先后手 ›</button>
   <p class="note">起始玩家拿的钱和牌最少，后面的人依次多 1 元、1 张：</p>`}
   <div class="seats">${seatOrder(S).map((p, i) => `<div>${dot(p.id)}<b>${esc(p.name)}</b><span>${i + 1} 号位：${SEAT[i].money} 元，抽 ${SEAT[i].cards} 张，1 个${SUPPLY.token}</span></div>`).join('')}</div></section>
  <section class="card" id="checklist"><button type="button" class="fold" data-act="fold" aria-expanded="${ui.prepOpen}"><h2>开局清单</h2><span class="count">${done} / ${all.length}</span></button>
   ${ui.prepOpen ? `<p class="note">只列出本局人数用得到的步骤。标红的是老玩家常摆错的地方。勾选会同步给全桌；不勾也能开始。</p>${items.map(sec => `<h3>${sec.title}</h3>${checklist(sec.items, anyone())}`).join('')}` : ''}</section>
  <div class="cta"><button class="primary wide" data-act="begin" ${dis}>摆好了，开始对局</button>
   <button class="linkish" data-act="direct" ${dis}>不看局中提示，直接去终局计分 ›</button></div>`;
}
function draws(c, dis) {
  const nmap = (c.neutral || NEUTRAL).split('');
  const sides = c.sides || 'a'.repeat(10);
  const sets = c.sets.length ? c.sets : null;
  return `<section class="card"><h2>开局要随机的东西</h2>
   <p class="note">可以让手机抽，也可以用实物抽完再点进来。全桌看到的一样。</p>
   <h3>中立建筑 A–H</h3>
   ${seg('neutral', 'neutral', [['first', '首局：按字母放'], ['random', '随机']], c.neutral ? 'random' : 'first', dis)}
   ${c.neutral ? `<div class="map">${NEUTRAL.split('').map((sp, i) => `<span><small>${sp} 格</small><b>${nmap[i]}</b></span>`).join('')}</div>
    <button type="button" class="small" data-act="redraw" data-val="neutral" ${dis}>重抽</button>
    <p class="note">每块都正面朝上（4 块双面的露出带翻面标记的一面）。</p>` : '<p class="note">每块放在印着同一字母的中立格上，正面朝上。</p>'}
   <h3>私有建筑 a / b 面 <small>全桌一样，之后谁都不能翻</small></h3>
   ${seg('sides', 'sides', [['a', '全部 a 面', '头几局'], ['random', '随机 a/b', '熟手']], c.sides ? 'random' : 'a', dis)}
   <div class="map ten">${sides.split('').map((x, i) => `<span><small>${i + 1} 号</small><b>${i + 1}${x}</b></span>`).join('')}</div>
   ${c.sides ? `<button type="button" class="small" data-act="redraw" data-val="sides" ${dis}>重抽</button>` : ''}
   <h3>奖励卡：10 个组合抽 4 个</h3>
   <div class="chips sets" role="group" aria-label="本局的 4 个奖励卡组合">${Array.from({length: 10}, (_, i) => i + 1).map(k => `<button type="button" data-act="set" data-val="${k}" aria-pressed="${c.sets.includes(k)}" ${dis}><b>${k}</b></button>`).join('')}</div>
   <div class="row"><button type="button" class="soft small" data-act="redraw" data-val="sets" ${dis}>手机抽 4 个</button><span class="note">或者用实物抽完，点上面的编号（选满 4 个）。</span></div>
   ${sets ? setsPlaced(sets) : ''}</section>`;
}
// Lowest set under the steering wheel, then barrel, bell, compass (EN p5 step 12).
function setsPlaced(sets) {
  if (sets.length < 4) return `<p class="note warn">还差 ${4 - sets.length} 个组合。</p>`;
  return `<ul class="placed">${sets.map((k, i) => `<li><span class="slot">${SUPPLY.slots[i]}</span><b>组合 ${k}</b><small>${esc(setInfo(k).name)}，这个组合放 ${PER_N[setupN(S.config)].setCards} 张</small></li>`).join('')}</ul>`;
}
function seat(p, i, dis) {
  const d = ui.players[p.id] || p;
  return `<div class="seat" data-k="seat-${p.id}"><span class="seatno" style="--c:${color(p.id)}">${i + 1}</span>
   <input aria-label="座位${i + 1}的名字" data-player="${p.id}" maxlength="16" value="${esc(d.name)}" ${dis}></div>`;
}

// ---------- play: this game's bonus cards and the quick reference ----------
function play() {
  const c = S.config;
  return `<section class="card"><h2>本局的 4 个奖励卡组合</h2>
   ${c.sets.length === 4 ? `<ul class="setlist">${c.sets.map((k, i) => { const x = setInfo(k); return `<li><span class="slot">${SUPPLY.slots[i]} · ${SUPPLY.prices[i]} 金</span><b>组合 ${k} · ${esc(x.name)}</b><p>${x.text}</p>${tag(x)}</li>`; }).join('')}</ul>`
     : '<p class="note">开局时没有登记抽到哪 4 个组合。需要的话，请主持人撤销回准备阶段再选。</p>'}
  </section>
  ${REF.map(r => refCard(r, !!ui.open[r.id])).join('')}
  <section class="card"><h2>终局</h2><p class="note">有人在威灵顿把奖励板块放进市场最后一格，触发终局：他拿走市场标记（5 分），这是他的最后一回合；其他人各再走 1 个回合。每个人的最后一回合都<b>不补牌</b>。</p>
   <button class="primary wide" data-act="end" ${hostOnly()}>最后一回合都打完了，去终局计分</button></section>`;
}

// ---------- score ----------
function draft(u) { return ui.scores[u.id] || S.scores[u.id] || emptyScore(); }
function rowInput(r, i, v) {
  if (r.only) return `<div class="srow"><span>${i + 1}. ${r.name}<small>${r.sub}</small></span>${`<div class="seg mini" role="group">${r.only.map(x => `<button type="button" data-act="only" data-i="${i}" data-val="${x}" aria-pressed="${v === x}">${x} 分</button>`).join('')}</div>`}</div>`;
  const neg = (r.min ?? 0) < 0;
  return `<label class="srow num"><span>${i + 1}. ${r.name}<small>${r.sub}</small></span><span class="sbox">
   <button type="button" data-act="step" data-i="${i}" data-d="-1" aria-label="${r.name}减一">−</button>
   <input name="v${i}" type="number" ${neg ? '' : 'inputmode="numeric"'} min="${r.min ?? 0}" max="${r.max ?? 300}" step="1" value="${v ?? ''}" aria-label="${r.name}">
   <button type="button" data-act="step" data-i="${i}" data-d="1" aria-label="${r.name}加一">＋</button>
   ${neg ? `<button type="button" class="sign" data-act="sign" data-i="${i}" aria-label="${r.name}正负号">±</button>` : ''}</span>
   ${r.k === 'money' && v !== null ? `<em class="conv">= ${Math.floor(v / 5)} 分</em>` : ''}</label>`;
}
function breakdown(u, q) {
  if (!complete(u, q)) {
    const left = rowsFor(u).filter(r => q.v[ROWS.indexOf(r)] === null).length;
    return `<div class="total"><small>目前合计（还有 ${left} 项没填）</small><strong>${total(u, q)}</strong></div>`;
  }
  return `<div class="total"><small>总分</small><strong>${total(u, q)}</strong></div>
   <p class="sum">${rowsFor(u).map(r => [r.name, rowPoints(r, q.v[ROWS.indexOf(r)])]).filter(([, v]) => v).map(([t, v]) => `${t} ${v}`).join(' ＋ ').replace(/＋ -/g, '− ')}</p>`;
}
function score() {
  const us = units(S);
  if (!us.some(u => u.id === ui.mine)) ui.mine = us[0].id;
  const u = us.find(x => x.id === ui.mine), q = draft(u);
  const rows = ROWS.map((r, i) => [r, i]).filter(([r]) => rowsFor(u).includes(r));
  return `<section class="card"><h2>终局计分</h2>
   <p class="label">正在填 <small>每人在自己手机上填，也可以替别人填</small></p>
   <div class="seg wrap" role="group">${us.map(x => `<button type="button" data-act="mine" data-id="${x.id}" aria-pressed="${x.id === u.id}">${dot(x.id)}${esc(x.name)}${S.scores[x.id]?.confirmed ? ' ✓' : ''}</button>`).join('')}</div>
   ${u.bot ? '<p class="hint">Sarah 不计钱、港务长板块和手牌上限格；她的目标卡一律按完成计分（单人规则 p2）。</p>' : ''}
   <form id="score-form" data-k="score-${u.id}">${rows.map(([r, i]) => rowInput(r, i, q.v[i])).join('')}
    <label class="field"><span class="label">备注（可不填）</span><input name="note" maxlength="200" value="${esc(q.note)}"></label>
    <div id="preview">${breakdown(u, q)}</div>
    <div class="cta"><button class="primary wide" value="confirm" ${anyone()}>确认分数</button><button class="linkish" value="draft" ${anyone()}>先存着，稍后确认</button></div>
   </form></section>
  <section class="card"><h2>全桌进度</h2>${us.map(x => { const sq = S.scores[x.id]; return `<div class="prow">${dot(x.id)}<span class="pname">${esc(x.name)}</span><span class="chip ${sq?.confirmed ? 'ok' : ''}">${sq?.confirmed ? '已确认' : '待确认'}</span><b>${sq && complete(x, sq) ? total(x, sq) : '—'}</b></div>`; }).join('')}</section>
  <div class="cta"><button class="primary wide" data-act="finish" ${hostOnly()}>都确认了，结算</button></div>`;
}

// ---------- result ----------
function result() {
  const c = S.config, rows = standings(S), ps = participants(S), stars = ui.review.stars;
  const reviewer = ps.some(p => p.id === ui.review.name) ? ui.review.name : ps.some(p => p.id === ui.mine) ? ui.mine : ps[0].id;
  const tied = rows.some((r, i) => i && r.place === rows[i - 1].place);
  const body = rows.map(r => `<div class="rank ${r.place === 1 ? 'first' : ''}"><span class="place">${r.place}</span><div class="who"><b>${dot(r.id)}${esc(r.name)}</b>
      <small>${rowsFor(r).map(x => [x.name, rowPoints(x, r.q.v[ROWS.indexOf(x)] ?? 0)]).filter(([, v]) => v).map(([t, v]) => `${t} ${v}`).join('，')}${r.q.note ? '。' + esc(r.q.note) : ''}</small></div>
      <strong class="points">${r.total}</strong></div>`).join('');
  return `<section class="card result" id="shot"><div class="rhead"><img src="/img/cover.jpg" alt=""><div><h2>本局结算</h2><p class="note">${esc(summary(c))}，房间 ${code}</p></div></div>
   ${body}${tied ? '<aside>同分的人共享名次（规则书没有平局决胜规则）。</aside>' : ''}
   <footer>大西部开拓者新西兰助手 gwtnz.leisurecat.cloud</footer></section>
  <div class="cta row"><button class="primary" data-act="image">保存长图</button><button data-act="reopen" ${hostOnly()}>修改分数</button><a class="button" href="/history.html${roomQ}">往期对局</a></div>
  <section class="card review"><h2>给新西兰开拓史打个分</h2>
   <p class="label">谁在评价</p>${seg('reviewer', 'reviewer', ps.map(p => [p.id, esc(p.name)]), reviewer)}
   <div class="stars" role="group" aria-label="评分">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-act="star" data-v="${n}" aria-pressed="${n <= stars}" aria-label="${n} 星">★</button>`).join('')}</div>
   <textarea id="review-text" maxlength="500" placeholder="一句话说说这局（可不填）">${esc(ui.review.text)}</textarea>
   <button class="primary wide" data-act="review" ${ui.busy ? 'disabled' : ''}>${ui.review.sent ? '已提交（再提交会覆盖）' : '提交评价'}</button>
   <p class="note">评价会显示在桌游小助手首页，不会出现在长图里。</p></section>`;
}

// ---------- events ----------
function readScore(confirmed = false) {
  const f = $('#score-form'), u = units(S).find(x => x.id === ui.mine), q = {...draft(u), v: draft(u).v.slice(), confirmed};
  ROWS.forEach((r, i) => { const el = f.elements['v' + i]; if (el) q.v[i] = el.value === '' || isNaN(Number(el.value)) ? null : Number(el.value); });
  q.note = f.elements.note.value;
  return q;
}
function setConfig(patch) {
  const c = {...structuredClone(S.config), ...patch};
  if (c.first >= c.n) c.first = 0;
  const e = configError(c);
  if (e) return notify(e);
  send({t: 'config', config: c});
}
const rand = n => crypto.getRandomValues(new Uint32Array(1))[0] % n;
function refreshPreview() { ui.scores[ui.mine] = readScore(); $('#preview').innerHTML = breakdown(units(S).find(u => u.id === ui.mine), ui.scores[ui.mine]); }

$('#app').addEventListener('click', async e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const a = b.dataset.act;
  try {
    if (a === 'create' || a === 'quick') {
      ui.busy = true; render();
      const r = await fetch('/api/room', {method: 'POST'});
      if (!r.ok) throw Error('建房失败，请再试一次');
      location.href = '/?r=' + (await r.json()).code + (a === 'quick' ? '&quick=1' : '');
    }
    else if (a === 'config') { const v = b.dataset.val, k = b.dataset.key; setConfig({[k]: ['n', 'first'].includes(k) ? Number(v) : v}); }
    else if (a === 'neutral') setConfig({neutral: b.dataset.val === 'random' ? drawNeutral(rand) : ''});
    else if (a === 'sides') setConfig({sides: b.dataset.val === 'random' ? drawSides(rand) : ''});
    else if (a === 'redraw') setConfig({[b.dataset.val]: {neutral: drawNeutral, sides: drawSides, sets: drawSets}[b.dataset.val](rand)});
    else if (a === 'set') {
      const k = Number(b.dataset.val), cur = S.config.sets;
      if (!cur.includes(k) && cur.length >= 4) return notify('已经选了 4 个组合。先点掉一个，再选别的。');
      setConfig({sets: (cur.includes(k) ? cur.filter(x => x !== k) : [...cur, k]).sort((x, y) => x - y)});
    }
    else if (a === 'order') location.href = orderUrl(S.config.n);
    else if (a === 'fold') ui.prepOpen = !ui.prepOpen;
    else if (a === 'ref') ui.open[b.dataset.id] = !ui.open[b.dataset.id];
    else if (a === 'mine') { ui.mine = b.dataset.id; store.set('gwtnz-unit', ui.mine); }
    else if (a === 'only') { const q = readScore(); q.v[Number(b.dataset.i)] = Number(b.dataset.val); ui.scores[ui.mine] = q; }
    else if (a === 'step' || a === 'sign') {
      const i = Number(b.dataset.i), input = $('#score-form').elements['v' + i], r = ROWS[i], cur = Number(input.value) || 0;
      const next = a === 'sign' ? -cur : cur + Number(b.dataset.d);
      input.value = Math.min(r.max ?? 300, Math.max(r.min ?? 0, next));
      refreshPreview(); return;
    }
    else if (a === 'reviewer') ui.review.name = b.dataset.val;
    else if (a === 'star') ui.review.stars = Number(b.dataset.v);
    else if (['begin', 'direct', 'end', 'undo', 'finish', 'reopen'].includes(a)) { if (a === 'undo' || a === 'reopen') ui.scores = {}; send({t: a}); }
    else if (a === 'share') { await navigator.clipboard.writeText(location.origin + '/?r=' + code); notify('邀请链接已复制，发给同桌就能加入'); }
    else if (a === 'image') {
      const canvas = await html2canvas($('#shot'), {scale: 2, backgroundColor: '#f3f1ea', useCORS: true}), src = canvas.toDataURL('image/png');
      $('#image-dialog').innerHTML = `<div class="overlay" role="dialog" aria-label="结算长图"><div><button id="close-image">关闭</button><p>长按图片保存到手机</p><img alt="本局结算长图" src="${src}"><a class="button primary" download="gwtnz_${code}.png" href="${src}">下载长图</a></div></div>`;
      $('#close-image').onclick = () => { $('#image-dialog').innerHTML = ''; };
    }
    else if (a === 'review') {
      const ps = participants(S), id = ps.some(p => p.id === ui.review.name) ? ui.review.name : ps.some(p => p.id === ui.mine) ? ui.mine : ps[0].id, p = S.players.find(p => p.id === id);
      ui.busy = true; render();
      const r = await fetch('https://boardgame.leisurecat.cloud/api/reviews', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({game: GAME, name: p.name, room: code, stars: ui.review.stars, text: ui.review.text})});
      if (!r.ok) throw Error('评价没提交上，请再试一次');
      ui.review.sent = true; notify('评价已提交，谢谢');
    }
  } catch (err) { notify(err.message); } finally { ui.busy = false; render(); }
});
$('#app').addEventListener('input', e => {
  const x = e.target;
  if (x.id === 'review-text') ui.review.text = x.value;
  if (x.dataset.player) ui.players[x.dataset.player] = {...(ui.players[x.dataset.player] || S.players.find(p => p.id === x.dataset.player)), name: x.value};
  if (x.closest('#score-form')) refreshPreview();
});
$('#app').addEventListener('change', e => {
  const x = e.target;
  if (x.dataset.player) {
    const p = {...S.players.find(p => p.id === x.dataset.player), ...ui.players[x.dataset.player]};
    send({t: 'player', id: p.id, name: p.name});
    delete ui.players[p.id];
  }
  if (x.dataset.check) send({t: 'check', id: x.dataset.check, value: x.checked});
});
$('#app').addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'join') { const v = $('#joinCode').value.trim().toUpperCase(); if (!/^[A-Z0-9]{4}$/.test(v)) return notify('请输入 4 位房间码'); location.href = '/?r=' + v; }
  if (e.target.id === 'score-form') { const q = readScore(e.submitter?.value === 'confirm'); ui.scores[ui.mine] = q; send({t: 'score', id: ui.mine, score: q}); }
});
async function loadRooms() {
  try { const r = await fetch('/api/rooms'); if (!r.ok) throw Error('房间列表没读到'); ui.rooms = await r.json(); render(); } catch (e) { notify(e.message); }
}
render();
if (code) connect(); else loadRooms();
