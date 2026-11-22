const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');

test('risk reminder, three questions and three lists precede the old buy checks', () => {
  const ids = ['risk-lifeline', 'risk-three-questions', 'trading-discipline-lists', 'preorder-check'];
  for (let i = 1; i < ids.length; i++) assert.ok(html.indexOf(`id="${ids[i - 1]}"`) < html.indexOf(`id="${ids[i]}"`));
  const block = html.slice(html.indexOf('id="trading-discipline"'), html.indexOf('id="preorder-check"'));
  for (const phrase of ['风控才是股市存活的生命线', '不是周内高点回撤', '第一问触线', '本周停止新开仓', '禁忌清单', '少做清单', '主做清单', '同身位PK', '低身位卡高身位PK', '补涨三板龙', '反包板', '金额 × 1/4', '缺证据标待核']) assert.ok(block.includes(phrase), phrase);
  assert.equal((block.match(/class="trading-list trading-list-/g) || []).length, 3);
  const stops = block.match(/<ol class="discipline-four-stops">([\s\S]*?)<\/ol>/)[1];
  assert.deepEqual([...stops.matchAll(/<li>(.*?)<\/li>/g)].map(m => m[1]), ['不抢未定龙', '不做被动跟风', '不在弱天时左侧重仓', '不为回本放宽纪律']);
  const priority = block.match(/<ol class="primary-mode-priority">([\s\S]*?)<\/ol>/)[1];
  assert.deepEqual([...priority.matchAll(/<b>(.*?)<\/b>/g)].map(m => m[1]), ['80%', '12%', '6%', '2%']);
  assert.deepEqual([...priority.matchAll(/<strong>(.*?)<\/strong>/g)].map(m => m[1]), ['题材第一波主升二阶段连板龙', '龙头二波：突破平台或反包板', '抱团龙：反包或突破平台，须为主动核心', '补涨三板龙：确认地位，不延伸为四板盲接']);
  assert.match(block, /不是单笔仓位比例或开仓指令/);
});

test('worldview uses the canonical list and obsolete risk allowances are removed', () => {
  assert.match(html, /id="worldview-trading-lists"[\s\S]*?data-trading-lists-copy/);
  const js = readFileSync(join(__dirname, '..', 'assets/js/trading-lists.js'), 'utf8');
  assert.match(js, /getElementById\('trading-discipline-lists'\)/);
  assert.match(js, /removeAttribute\('id'\)/);
  assert.doesNotMatch(html, /切换旧10%现修订为最高20%|监管函首日 · 专门≤50%|或合格切换，最高共用两成/);
  assert.match(html, /切换旧10%、20%及半成试错均已失效/);
});
