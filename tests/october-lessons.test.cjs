const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const test = require('node:test');
const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const context = { window: {} };
vm.runInNewContext(read('assets/data/october-lessons.js'), context);
vm.runInNewContext(read('assets/data/agriculture-kline.js'), context);
const lessons = context.window.M10_OCTOBER_LESSONS;
const data = context.window.M10_AGRICULTURE_KLINE;
const handbook = read('index.html');

test('all three views consume the same lessons and retain the main rhythms plus risk comparison', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(lessons.rhythms.map((rhythm) => rhythm.path))), [
    ['强', '弱', '强'], ['强', '强', '弱', '强'], ['强', '弱', '弱', '强'], ['一直不弱']
  ]);
  assert.match(lessons.rhythms[1].note, /第4个节奏节点.*不是第3天/);
  const text = JSON.stringify(lessons);
  for (const term of ['弱 → 强 → 弱 → 强', '第三个放量板', '五板之前', '昨日爆量弱转强', '第二天续强日', '量能起算日', '恒尚节能', '新华传媒', '西陇科学', '昊华科技', '津药药业', '万向德农', '华电辽能']) assert.ok(text.includes(term), term);
  for (const file of ['index.html', 'framework-model/index.html', '资料库 - 龙头周期复盘/index.html']) {
    const html = read(file);
    assert.match(html, /data-october-lessons/);
    assert.match(html, /assets\/data\/october-lessons.js\?v=20261010-jinyao/);
    assert.match(html, /assets\/js\/october-lessons.js\?v=20261010-jinyao/);
    assert.match(html, /assets\/css\/october-lessons.css\?v=20261010-jinyao/);
  }
});

test('80/50 is a fraction of planned stock allocation, with caps and the same-day wave window retained', () => {
  const text = JSON.stringify(lessons.sections.find((section) => section.id === 'positions'));
  assert.match(text, /该票计划仓位的80%.*该票计划仓位的50%/);
  assert.equal(0.4 * 0.5, 0.2);
  assert.ok(Math.abs(0.8 * 0.8 - 0.64) < 1e-12);
  assert.match(text, /账户20%/);
  assert.match(text, /账户64%/);
  assert.match(text, /同题材总风险/);
  assert.match(text, /具体.*比例|固定比例/);
  assert.match(text, /当天尾盘确认后买/);
  assert.match(handbook, /70%–80%/);
  assert.match(handbook, /30%–40%/);
  assert.doesNotMatch(handbook, /第一笔一般控制在5成仓以下|第一笔一般5成仓以下|先参与总龙二波，预留另一半仓位/);
});

test('mode-specific exits, no one-price queuing and unresolved hypotheses stay distinct', () => {
  const text = JSON.stringify(lessons);
  assert.match(text, /四板的板上卖点，快进快出/);
  assert.match(text, /不是承诺一定有四板/);
  assert.match(text, /不是全市场100%亏损统计/);
  assert.match(text, /竞价加单.*未统一/);
  assert.match(text, /不是已完成验证的统一买点/);
  assert.match(text, /不是已确认地位或预测结论/);
  assert.match(text, /原有|既有边界/);
  assert.match(text, /晋级率只按相邻交易日同一批股票匹配/);
  assert.match(text, /日K不能证明尾盘或板上真实可成交/);
});

test('agriculture snapshot has three aligned unadjusted price/volume series with traceable source', () => {
  assert.equal(data.stocks.length, 3);
  assert.equal(data.adjustment, '不复权（fqt=0）');
  assert.equal(data.volumeUnit, '手');
  const dates = JSON.stringify(data.stocks[0].days.map((day) => day.date));
  for (const stock of data.stocks) {
    assert.equal(stock.days.length, 33);
    assert.equal(JSON.stringify(stock.days.map((day) => day.date)), dates);
    assert.match(stock.url, /^https:\/\/push2his\.eastmoney\.com\/.*fqt=0/);
    const seen = new Set();
    for (const day of stock.days) {
      assert.ok(!seen.has(day.date));
      seen.add(day.date);
      assert.ok(day.low > 0 && day.low <= Math.min(day.open, day.close));
      assert.ok(day.high >= Math.max(day.open, day.close));
      assert.ok(day.volume >= 0 && day.amount >= 0);
    }
  }
  const jin = data.stocks[0];
  const peak = Math.max(...jin.days.filter((day) => day.date >= '2026-08-17' && day.date <= '2026-08-21').map((day) => day.high));
  assert.equal(peak, 9.45);
  const candidate = jin.days.find((day) => day.date === '2026-08-26');
  assert.ok(candidate.close > peak && candidate.pct >= 5);
  const locked = data.stocks[2].days.find((day) => day.date === '2026-09-07');
  assert.equal(locked.open, locked.close);
  assert.equal(locked.high, locked.low);
  assert.match(read('assets/js/agriculture-replay.js'), /不代表实际交易记录|不代表实际交易/);
});

test('all 28 agriculture diary days retain their 56 original source paragraphs', () => {
  const original = [...handbook.matchAll(/<p class="agriculture-original"[\s\S]*?<\/p>/g)].map((match) => match[0].replace(/\r\n/g, '\n'));
  assert.equal(original.length, 56);
  assert.equal(createHash('sha256').update(original.join('\n')).digest('hex'), '18a34d2eb3f39aa6de5c5b5c041d187604fafa8d2456d8c7fcf321ebcc7470ba');
  for (const page of ['index.html', '资料库 - 龙头周期复盘/index.html']) {
    const html = read(page);
    assert.match(html, /data-agriculture-replay/);
    const dir = path.dirname(path.join(root, page));
    for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^\.{1,2}\/assets\//.test(href)) assert.ok(fs.existsSync(path.resolve(dir, href.split(/[?#]/)[0])), href);
    }
  }
});

class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.attrs = {}; this.listeners = {}; this.classList = { add() {} }; }
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key] ?? null; }
  hasAttribute(key) { return Object.hasOwn(this.attrs, key); }
  addEventListener(type, callback) { this.listeners[type] = callback; }
}

const descendants = (node) => [node, ...node.children.flatMap(descendants)];

test('integrated chapters retain every lesson exactly once without a second update heading', () => {
  const expected = JSON.parse(JSON.stringify(lessons.sections.flatMap((section) => section.points.map((_, index) => `${section.id}:${index}`)).sort()));
  for (const file of ['index.html', 'framework-model/index.html', '资料库 - 龙头周期复盘/index.html']) {
    const html = read(file);
    const roots = [...html.matchAll(/<div\b[^>]*\bdata-october-lessons\b[^>]*>/g)].map(([tag]) => {
      const node = new Element('div');
      for (const [, key, value] of tag.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) {
        if (key.startsWith('data-')) node.setAttribute(key, value ?? '');
        if (key === 'id') node.id = value;
      }
      return node;
    });
    const browser = { window: context.window, document: { createElement: (tag) => new Element(tag), querySelectorAll: (selector) => selector === '[data-october-lessons]' ? roots : [] } };
    vm.runInNewContext(read('assets/js/october-lessons.js'), browser);
    const nodes = roots.flatMap(descendants);
    const points = nodes.filter((node) => node.hasAttribute('data-lesson-point')).map((node) => node.getAttribute('data-lesson-point')).sort();
    assert.deepEqual(points, expected, file);
    assert.equal(nodes.filter((node) => node.className === 'lesson-rhythm').length, 4, file);
    assert.equal(nodes.filter((node) => node.className === 'lesson-allocation').length, 1, file);
    assert.equal(nodes.filter((node) => ['details', 'summary'].includes(node.tag)).length, 0, file);
    for (const node of nodes.filter((node) => node.hasAttribute('data-lesson-point'))) {
      assert.equal(node.tag, 'article');
      assert.ok(node.hasAttribute('data-kind'));
      assert.ok(node.children.some((child) => child.tag === 'ul' && child.children.length >= 3));
    }
    assert.doesNotMatch(html, /10月更新 · 题材节奏、仓位与交易纪律|最新节奏与交易纪律/);
  }
});

test('scoped handbook content belongs to its corresponding logic and legacy links survive', () => {
  const placement = [
    ['theme-volume-models', 'handbook-october-lessons'],
    ['strategy-5', 'handbook-second-wave-lessons'],
    ['strategy-7', 'handbook-supplement-exit'],
    ['environment-position-plan', 'handbook-entry-position'],
    ['appendix', 'handbook-research-boundaries']
  ];
  for (const [chapter, content] of placement) {
    const chapterIndex = handbook.indexOf(`id="${chapter}"`);
    const contentIndex = handbook.indexOf(`id="${content}"`);
    assert.ok(chapterIndex >= 0 && contentIndex > chapterIndex, `${chapter}: ${content}`);
  }
  assert.match(handbook, /id="october-update" class="lesson-anchor"/);
  const casePage = read('资料库 - 龙头周期复盘/index.html');
  const caseApp = read('资料库 - 龙头周期复盘/assets/app.js');
  assert.match(casePage, /id="cycle-latest-lessons" class="lesson-anchor"/);
  assert.match(casePage, /<section class="rule-section cycle-history-models">/);
  assert.match(casePage, /08.27 → 08.28 \/ 万向德农/);
  assert.match(casePage, /09.07 → 09.08 \/ 亚盛集团/);
  assert.match(casePage, /不假设能买到/);
  assert.match(casePage, /全周期风险卖点.*历史推演口径/);
  assert.match(caseApp, /els.focus.id = cycle.id/);
  assert.match(caseApp, /els.agricultureMode.hidden = !isAgriculture/);
  assert.match(caseApp, /main.insertBefore\(agriculture, workspace.nextElementSibling\)/);
  assert.match(caseApp, /scrollIntoView\(\{ block: "start" \}\)/);
});

test('shared renderer makes six lessons and linked K/volume charts with functioning range controls', () => {
  const lessonsRoot = new Element('div');
  lessonsRoot.id = 'test-lessons';
  const replayRoot = new Element('div');
  const charts = [];
  const browser = {
    window: { ...context.window, addEventListener() {}, echarts: {
      init() { const chart = { setOption(option) { this.option = option; }, on() {}, dispatchAction(action) { this.action = action; }, resize() {} }; charts.push(chart); return chart; },
      connect(items) { assert.equal(items.length, 3); }
    } },
    document: { createElement: (tag) => new Element(tag), querySelectorAll: (selector) => selector === '[data-october-lessons]' ? [lessonsRoot] : selector === '[data-agriculture-replay]' ? [replayRoot] : [] }
  };
  vm.runInNewContext(read('assets/js/october-lessons.js'), browser);
  vm.runInNewContext(read('assets/js/agriculture-replay.js'), browser);
  assert.equal(lessonsRoot.children.filter((child) => child.tag === 'section').length, 6);
  assert.equal(charts.length, 3);
  charts.forEach((chart) => {
    assert.equal(chart.option.series[0].type, 'candlestick');
    assert.equal(chart.option.series[1].type, 'bar');
    assert.equal(chart.option.series[0].data.length, 33);
    assert.equal(chart.option.series[1].data.length, 33);
  });
  const buttons = replayRoot.children.find((child) => child.attrs.role === 'group');
  buttons.children[2].listeners.click();
  assert.equal(buttons.children[2].attrs['aria-pressed'], 'true');
  assert.equal(charts[0].action.startValue, data.stocks[0].days.findIndex((day) => day.date === '2026-08-24'));
  assert.equal(charts[0].action.endValue, data.stocks[0].days.findIndex((day) => day.date === '2026-09-03'));
});

test('two execution models expose buy, sell, allocation and invalidation modules side by side', () => {
  for (const id of ['strategy-5', 'strategy-7']) {
    const start = handbook.indexOf(`<article class="cycle-method" id="${id}"`);
    const end = handbook.indexOf('<p class="cycle-source-note">', start);
    const model = handbook.slice(start, end);
    assert.ok(model.includes('strategy-execution-grid'), id);
    assert.ok(model.includes('买点 ·'), id);
    assert.ok(model.includes('卖点 ·'), id);
    assert.ok(model.includes('仓位 ·'), id);
    assert.ok(model.includes('失效与禁区'), id);
    assert.doesNotMatch(model, /<details|<summary|data-lesson-open/);
  }
  assert.match(handbook, /卖点 · 四板板上兑现/);
  assert.match(handbook, /买点 · 当天尾盘确认/);
});

test('only source archives and mobile navigation retain collapse controls in the handbook', () => {
  for (const [tag] of handbook.matchAll(/<details\b[^>]*>/g)) {
    assert.match(tag, /mobile-contents|redline-evidence|source-collection|raw-record|agriculture-day|agriculture-daily-records/, tag);
  }
  assert.doesNotMatch(handbook, /id="readingToggle"/);
  assert.doesNotMatch(handbook, /展开阅读|各节可展开查看/);
  assert.doesNotMatch(read('assets/js/main.js'), /readingToggle|updateReadingToggle/);
  assert.equal(Object.keys(lessons.structuredPoints).length, 22);
});

test('Jinyao crossing case is visible structured content shared by handbook and cycle review', () => {
  const sample = lessons.crossingCase;
  assert.equal(sample.id, 'jinyao-medicine-2026-04');
  assert.equal(sample.steps.length, 4);
  assert.equal(sample.checks.length, 3);
  assert.match(sample.title, /穿越活口.*身位.*题材二次爆发.*主升/);
  const text = JSON.stringify(sample);
  for (const term of ['03.31', '三板', '04.01', '04.02', '04.08', '没有个股穿越', '不等于医药所有其他模式', '活口不是自动买点', '金健米业', '仍待验证']) assert.ok(text.includes(term), term);
  for (const heading of ['4', '3']) {
    const node = new Element('section');
    node.setAttribute('data-case-heading', heading);
    node.setAttribute('data-case-link', '#jinyao-medicine-2026-04');
    node.setAttribute('data-case-link-label', '津药药业完整周期');
    vm.runInNewContext(read('assets/js/october-lessons.js'), {
      window: context.window,
      document: { createElement: (tag) => new Element(tag), querySelectorAll: (selector) => selector === '[data-crossing-case]' ? [node] : [] }
    });
    const nodes = descendants(node);
    assert.equal(nodes.filter((item) => item.tag === 'ol').length, 1);
    assert.equal(nodes.filter((item) => item.tag === 'li').length, 13);
    assert.equal(nodes.filter((item) => item.tag === `h${heading}`).length, 1);
    assert.equal(nodes.filter((item) => ['details', 'summary'].includes(item.tag)).length, 0);
  }
  assert.match(handbook, /id="case-jinyao-crossing" data-crossing-case/);
  assert.match(handbook, /case-directory"><a href="#case-jinyao-crossing"/);
  assert.match(read('资料库 - 龙头周期复盘/index.html'), /id="jinyao-case-check" data-crossing-case[^>]*hidden/);
  assert.match(read('资料库 - 龙头周期复盘/assets/app.js'), /els\.jinyaoCase\.hidden = cycle\.id !== "jinyao-medicine-2026-04"/);
});

test('Jinyao priority does not overwrite original dated cycle evidence or ending', () => {
  const browser = { window: {} };
  vm.runInNewContext(read('资料库 - 龙头周期复盘/data/cycles.js'), browser);
  vm.runInNewContext(read('资料库 - 龙头周期复盘/data/cycle-updates.js'), browser);
  const cycle = browser.window.LEADER_CYCLE_ARCHIVE.cycles.find((item) => item.id === lessons.crossingCase.id);
  assert.equal(cycle.reviewPriority, '重点经典 · 穿越活口主升');
  assert.match(cycle.oneLine, /穿越成为活口.*三板取得身位.*题材二次爆发.*4\/8.*结束/);
  assert.equal(cycle.records.length, 8);
  assert.match(cycle.records.find((item) => item.date === '2026/3/31').raw, /板块活口：津药药业换手三板/);
  assert.match(cycle.records.find((item) => item.date === '2026/4/8').raw, /抗监管失败/);
});
