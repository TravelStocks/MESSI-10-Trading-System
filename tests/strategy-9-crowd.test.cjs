const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
const section = html.match(/<section\b[^>]*id="strategy-9-model"[\s\S]*?<\/section>/)?.[0];

test('renumbered strategy 4 keeps its legacy anchor and same-cycle prerequisite', () => {
  assert.ok(section);
  assert.match(section, /战法4 \/ 轮动题材与情绪抱团/);
  assert.match(section, /<h2 id="strategy-9-title">题材发酵主升切换成轮动题材市场情绪高标锚定-抱团情绪龙<\/h2>/);
  assert.match(section, /相关概念在同一个周期内确实发酵/);
  assert.match(section, /可以先后轮动，不要求同一天一起爆发/);
  assert.match(section, /长期沉寂的概念标签不算支撑/);
  assert.match(section, /低价、低市值.*?不是单独的买入理由/);
  assert.match(section, /身位与辨识度/);
});

test('case roles remain attributed observations, not identical trajectories', () => {
  assert.match(section, /时代万恒[\s\S]*?经典题材龙头/);
  assert.match(section, /九阳股份<\/td>[\s\S]*?多概念混合的辨识度抱团/);
  assert.match(section, /圣阳股份<\/td>[\s\S]*?历史类比/);
  assert.match(section, /不把两只股票视为完全相同的走势/);
  assert.match(section, /个人复盘判断/);
  assert.match(section, /不作为已验证的资金流向或收益保证/);
});

test('strategy 4 does not invent trade triggers or borrow unrelated strategy rules', () => {
  assert.match(section, /不自动等于战法6的龙头二波/);
  assert.match(section, /不直接套用战法3的次日竞价前二买点/);
  assert.match(section, /独立买卖触发条件、仓位与失效阈值/);
  assert.match(section, /数值边界尚未提供，暂不补造/);
  assert.doesNotMatch(section, /<details\b|\d+%|无脑|必涨|稳赚/);
  assert.match(section, /href="#resources"/);
});

test('crossing first-move notes retain timing, attribution and unresolved speech', () => {
  assert.match(section, /id="crowding-crossing-first-move"/);
  for (const phrase of ['择日争取先手', '分时看承接', '新华传媒', '九阳股份', '零轴是两个不同参照', '不适合后手追入', '该日期的月份', '不新增或改写交割收益', '不把低吸变成无条件摊低成本']) {
    assert.ok(section.includes(phrase), phrase);
  }
});

test('Notion Jiuyang model preserves stages, source and feedback direction', () => {
  for (const phrase of ['id="jiuyang-notion-model"', '3fc7af2f574e806dad8cf571c7acc23d', '第一段 / 连板主动领涨', '第二段 / 放量横盘与轮动', '第三段 / 补涨反向助攻', '不写成固定拉升顺序', '不新增机械阈值', '不自动等同战法6']) assert.ok(section.includes(phrase), phrase);
});
