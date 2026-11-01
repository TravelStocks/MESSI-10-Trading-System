const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const test = require('node:test');
const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const data = JSON.parse(read('assets/data/era-replay.json'));
const html = read('index.html');
const model = html.slice(html.indexOf('id="era-leader-rhythm"'), html.indexOf('id="case-jinyao-crossing" data-crossing-case'));

test('era replay retains three complete real 5-minute days without synthetic earlier bars', () => {
  assert.equal(data.code, '600241');
  assert.equal(data.interval, '5分钟');
  assert.equal(data.bars.length, 144);
  assert.match(data.barsSource, /symbol=sh600241.*scale=5/);
  assert.equal(data.barsRetrievedAt, '2026-10-30T09:20:48.380Z');
  assert.equal(data.retainedBarsSha256, '092c0492a2d0dd07f9112266ad8af6da7d454eb7729b9ef7c5bc7d516c40533d');
  assert.equal(createHash('sha256').update(JSON.stringify(data.bars)).digest('hex'), data.retainedBarsSha256);
  for (const date of ['2026-10-08', '2026-10-09', '2026-10-12']) {
    const bars = data.bars.filter((bar) => bar.date === date);
    assert.equal(bars.length, 48);
    assert.equal(bars[0].time, '09:35');
    assert.equal(bars[47].time, '15:00');
    assert.equal(new Set(bars.map((bar) => bar.time)).size, 48);
    for (const bar of bars) {
      assert.ok(bar.low > 0 && bar.low <= Math.min(bar.open, bar.close));
      assert.ok(bar.high >= Math.max(bar.open, bar.close));
      assert.ok(Number.isFinite(bar.volume) && bar.volume >= 0);
      assert.ok(bar.time <= '11:30' || bar.time >= '13:05');
    }
  }
  assert.match(data.timeNote, /区间结束时间/);
});

test('theme strength and breadth use the same five dates but remain separate indicators', () => {
  assert.equal(data.strengthLegend, '锂电池');
  assert.deepEqual(data.themeDays.map((day) => day.board), [2, 3, 4, 5, 6]);
  assert.deepEqual(data.themeDays.map((day) => day.strength), [7341, 2850, 6792, 5338, -4976]);
  assert.deepEqual(data.themeDays.map((day) => day.count), [12, 6, 9, 7, 3]);
  assert.equal(data.themeDays[4].date, '2026-10-12');
  for (const day of data.themeDays) assert.equal(new Set(day.stocks.map((stock) => stock.code)).size, day.count);
  assert.match(data.interpretation, /不从家数自动推导阶段/);
  assert.match(data.strengthSource, /getPlateDayChart/);
  assert.match(data.countSource, /getFupanByYidong/);
});

test('the fourth-board entry and sixth-board break have verified intervals, not guaranteed fills', () => {
  const [buy, sell] = data.events;
  assert.equal(buy.label, '四板上板买');
  assert.equal(buy.reference, 10.69);
  assert.equal(buy.start, '09:30');
  assert.equal(buy.end, '09:35');
  assert.equal(sell.label, '六板炸板卖');
  assert.equal(sell.start, '10:25');
  assert.equal(sell.end, '10:30');
  const i = data.bars.findIndex((bar) => bar.dt === '2026-10-12 10:30:00');
  assert.ok(data.bars.slice(i - 8, i).every((bar) => [bar.open, bar.close, bar.high, bar.low].every((value) => value === 12.94)));
  assert.equal(data.bars[i].open, 12.94);
  assert.equal(data.bars[i].low, 12.31);
  assert.equal(data.bars[i].close, sell.reference);
  assert.match(sell.referenceBasis, /不.*涨停成交承诺/);
  assert.match(sell.referenceBasis, /不宣称.*全天首次炸板/);
});

test('actual fills stay inside their own bars and separate from strategy signal references', () => {
  assert.equal(data.fills.length, 5);
  assert.equal(data.fills[0].dt, '2026-10-08 09:32:32');
  assert.equal(data.fills[4].dt, '2026-10-12 10:28:20');
  assert.equal(data.fills[4].price, 12.36);
  assert.notEqual(data.events[1].reference, data.fills[4].price);
  for (const fill of data.fills) {
    const bar = data.bars.find((bar) => bar.date === fill.dt.slice(0, 10) && bar.dt >= fill.dt);
    assert.ok(bar && fill.price >= bar.low && fill.price <= bar.high, fill.dt);
  }
});

test('standard small-theme case is direct, linked, and does not impose fixed large-theme board counts', () => {
  for (const phrase of ['超重点', '小题材标准', '四板上板是买点', '六板炸板是卖点', '大题材通常强度更大', '波数更多', '核心节奏基本同构', '不机械复制固定', '不是可保证成交价']) assert.ok(model.includes(phrase), phrase);
  assert.doesNotMatch(model, /<details|<summary/);
  assert.equal((model.match(/data-era-range=/g) || []).length, 5);
  assert.match(model, /data-era-actual checked/);
  assert.match(model, /data-era-theme-chart/);
  assert.match(model, /data-era-stock-chart/);
  assert.match(model, /data-era-theme-rows/);
  assert.match(model, /不代表买卖时刻已经知道当日最终数值/);
  assert.match(model, /data-era-fill-rows/);
  assert.match(html, /case-directory"><a href="#era-leader-rhythm"/);
  assert.match(read('assets/js/era-replay.js'), /type: 'candlestick'/);
  assert.match(read('assets/js/era-replay.js'), /type: 'dataZoom'/);
  assert.match(read('assets/css/era-replay.css'), /@media \(max-width: 640px\)/);
});
