const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const html = read('index.html');
const between = (start, end) => html.slice(html.indexOf(`id="${start}"`), html.indexOf(`id="${end}"`));
const source = 'https://travelstocks.github.io/weekly-monthly-quarterly-yearly-trading-review/2026-10-26_2026-10-30/';
const priority = between('mode-focus-priority', 'framework-entry');
const budgets = between('mode-budget-limits', 'handbook-entry-position');
const opportunities = between('october-entry-cases', 'mode-entry-windows');
const waves = between('wave-support-model', 'case-jinyao-crossing');
const review = between('weekly-review-checks', 'handbook-expectation-study');

test('super-priority mode discipline is the first module after the ten-step headline', () => {
  assert.ok(html.indexOf('id="handbook-order"') < html.indexOf('id="mode-focus-priority"'));
  assert.ok(html.indexOf('id="mode-focus-priority"') < html.indexOf('id="framework-entry"'));
  assert.match(priority, /超重点.*2026\.11\.06/);
  assert.match(priority, /少才是根本点.*题材龙/);
  assert.equal((priority.match(/weekly-budget/g) || []).length, 3);
  assert.match(priority, /合计≤20%/);
  assert.match(priority, /≤20%/);
  assert.match(priority, /首次上板确认.*次日退出/);
  assert.ok((html.match(/class="toc-link" href="#mode-focus-priority"/g) || []).length === 2);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});

test('new mode caps do not multiply across stocks or turn planned entry into account allocation', () => {
  assert.match(budgets, /账户总资产/);
  assert.match(budgets, /共用额度，不是每只各20%/);
  assert.match(budgets, /该票计划仓位为分母/);
  assert.match(budgets, /固定首笔已被确认分档替代/);
  assert.match(budgets, /已有利润、强度延续/);
  assert.match(budgets, /取更低风险上限/);
  assert.match(priority, /不等于账户满仓/);
  const browser = { window: {} };
  vm.runInNewContext(read('assets/data/october-lessons.js'), browser);
  const lessons = browser.window.M10_OCTOBER_LESSONS;
  assert.equal(lessons.entryAllocation.basis, '该票计划仓位');
  assert.equal(lessons.entryAllocation.strong, 80);
  assert.equal(lessons.entryAllocation.weak, 50);
  assert.match(JSON.stringify(lessons.structuredPoints['positions:0']), /非主模式合计≤20%/);
  assert.match(lessons.entryAllocation.status, /历史版本/);
  assert.match(JSON.stringify(lessons.structuredPoints['positions:1']), /已有利润、强度延续/);
  for (const file of ['index.html', 'framework-model/index.html', '资料库 - 龙头周期复盘/index.html']) {
    assert.match(read(file), /data\/october-lessons.js\?v=20261106/);
  }
  assert.match(read('framework-model/index.html'), /超重点.*2026\.11\.06/);
  assert.match(read('战法2 - 低位接力/A股一进二战法手册网页版/index.html'), /合格切换最高账户20%/);
  assert.match(html, /id="weekly-lessons-20261030"/);
});

test('five opportunity cases separate intraday triggers, exits and actual records', () => {
  for (const id of ['era', 'jiuyang', 'daye-first', 'xiangyang', 'daye-second']) assert.ok(opportunities.includes(`id="weekly-case-${id}"`), id);
  assert.equal((opportunities.match(/<h5>买点与仓位<\/h5>/g) || []).length, 5);
  assert.equal((opportunities.match(/<h5>卖点与失效<\/h5>/g) || []).length, 5);
  assert.match(opportunities, /17\.79.*09:40.*19\.57/);
  assert.match(opportunities, /旧“半仓”.*最多二成/);
  assert.match(opportunities, /09:35.*不能倒推09:32/);
  assert.match(opportunities, /19\.37板上卖出/);
  assert.match(opportunities, /买回.*新仓/);
  assert.match(opportunities, /17\.88.*17\.92/);
  assert.match(opportunities, /13:00—13:05，不是早盘/);
  assert.match(opportunities, /不凭“二波”名称认定符合战法6/);
  assert.match(opportunities, /T\+1/);
  assert.match(opportunities, /不等于可成交、已实现或账户收益/);
});

test('wave and leader lessons retain support checks, hypothesis and exit boundaries', () => {
  for (const term of ['起浪', '分歧', '接浪', '孤浪', '浪退', '广度', '梯队', '带动', '质量']) assert.ok(waves.includes(term), term);
  assert.match(waves, /不机械.*第三天必买/);
  assert.match(waves, /本人假说/);
  assert.match(waves, /不能.*绕过.*非主模式共用20%/);
  assert.match(waves, /市场属性是待检验解释/);
  assert.match(waves, /五板不必然.*新龙出现前也可能下跌/);
  assert.match(waves, /后续回封不证明此前减仓错误/);
  assert.match(waves, /农业末尾孤立穿越不做/);
  assert.match(waves, /未作独立逐项核验/);
});

test('personal observations stay distinct from statistics, missed profits and actual trades', () => {
  assert.match(review, /超过2%.*超过1%/);
  assert.match(review, /口径未定，不作已验证统计/);
  assert.match(review, /价格空间不能直接相加成账户40%—55%/);
  assert.match(review, /KISS.*不代写/);
  assert.match(review, /九阳.*盈利不改写成亏损/);
  assert.match(review, /未核验书中原句与页码/);
  assert.match(review, /不改写交易事实、不增加实盘记录/);
});

test('new rules are always visible with valid section and source links', () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  for (const module of [priority, budgets, opportunities, waves, review]) {
    assert.doesNotMatch(module, /<details|<summary/);
    assert.ok(module.includes(source) || module.includes('2026-11-02_2026-11-06/'));
    for (const [, hash] of module.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(hash), hash);
  }
  assert.match(read('assets/css/weekly-lessons.css'), /@media \(max-width: 640px\)/);
  assert.match(read('assets/css/weekly-lessons.css'), /grid-template-columns: 1fr/);
  assert.match(read('assets/css/weekly-lessons.css'), /\.content > \.section\.weekly-focus[^}]*border-radius: 0/);
});
