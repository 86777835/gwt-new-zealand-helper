// Back buttons, no horizontal overflow at 320px, guide search, quick reference, room code kept on sub pages.
import assert from 'node:assert/strict';
import {BASE, browser, phone, act, room, shot} from './helpers.mjs';
const b = await browser();
try {
  const c = await phone(b), p = await c.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  async function check(label) {
    await p.evaluate(() => scrollTo(0, 0));
    const bad = await p.locator('.back-nav:not(.rate-nav)').evaluate(nav => {
      const a = nav.getBoundingClientRect(), out = [];
      if (a.height < 36 || a.top < 0) out.push('back button not visible');
      if (document.documentElement.scrollWidth > innerWidth) out.push('horizontal overflow');
      for (const el of document.querySelectorAll('a,button,input,select,h1,.conn')) {
        if (el === nav || el.contains(nav) || el.closest('.cpanel')) continue;
        const r = el.getBoundingClientRect();
        if (r.width && r.height && a.left < r.right && a.right > r.left && a.top < r.bottom && a.bottom > r.top) out.push('overlap ' + el.textContent.slice(0, 10));
      }
      return out;
    });
    assert.deepEqual(bad, [], label); console.log('PASS layout', label);
  }
  await p.goto(BASE);
  assert.equal(await p.locator('.back-nav:not(.rate-nav)').textContent(), '‹ 全部游戏');
  assert.equal(await p.locator('.back-nav:not(.rate-nav)').getAttribute('href'), 'https://boardgame.leisurecat.cloud');
  await check('landing'); await shot(p, 'landing');
  const code = await room(p); assert.equal(await p.locator('.back-nav:not(.rate-nav)').textContent(), '‹ 首页'); await check('setup');
  await act(p, 'begin'); await check('play'); await shot(p, 'play');
  for (const page of ['guide', 'ref', 'history']) {
    await p.goto(new URL(`${page}.html?r=${code}`, BASE).href);
    assert.equal(await p.locator('.back-nav:not(.rate-nav)').textContent(), '‹ 返回');
    assert.equal(await p.locator('.back-nav:not(.rate-nav)').getAttribute('href'), '/?r=' + code);
    await check(page); await shot(p, page);
    await p.setViewportSize({width: 320, height: 700}); await check(page + ' 320px'); await p.setViewportSize({width: 390, height: 844});
  }
  // Guide: lessons render, FAQ anchor, FAQ search understands player nicknames.
  await p.goto(new URL('guide.html', BASE).href); await p.waitForSelector('#wellington');
  await p.fill('#search', '惠灵顿'); assert(await p.locator('.faq-item:not([hidden])').count() > 0);
  await p.fill('#search', '剪毛'); assert(await p.locator('.faq-item:not([hidden])').count() > 0);
  await p.fill('#search', '完全不存在的词'); assert(await p.locator('#no-faq').isVisible());
  // Quick reference: every card open, table of contents anchors.
  await p.goto(new URL('ref.html#market', BASE).href);
  assert.equal(await p.locator('.refcard').count(), 11);
  assert.match(await p.locator('#market').innerText(), /市场标记所在那一行的奖励板块不能买/);
  await shot(p, 'ref');
  await p.goto(BASE); await p.setViewportSize({width: 320, height: 700}); await check('landing 320px');
  assert.deepEqual(errors, []);
  console.log('ALL PASS navigation, layout, guide search, quick reference');
} finally { await b.close(); }
