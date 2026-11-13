// Chat page handles a streamed answer with a mid-stream reset to another model, without showing which model answered.
import assert from 'node:assert/strict';
import {BASE, browser, phone} from './helpers.mjs';
const b = await browser();
try {
  const c = await phone(b), p = await c.newPage();
  await p.route('**/api/chat', r => r.fulfill({contentType: 'text/event-stream', body: 'data: {"choices":[{"delta":{"content":"旧片段"}}]}\n\ndata: {"reset":"Qwen3.8 27B (Cloudflare)"}\n\ndata: {"response":"不用，没亮出的重复羊留在手里。（规则书 p9）"}\n\ndata: [DONE]\n\n'}));
  await p.goto(BASE); await p.click('.cfab'); await p.click('.csug button');
  await p.waitForFunction(() => document.querySelector('.clog').textContent.includes('规则书 p9'));
  assert.doesNotMatch(await p.locator('.clog').innerText(), /旧片段|Qwen|DeepSeek|Flash|Pro/);
  console.log('PASS chat UI: stream format, mid-stream reset, no model name');
} finally { await b.close(); }
