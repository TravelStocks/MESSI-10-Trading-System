const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const read = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const html = read('index.html');
const rules = html.slice(html.indexOf('id="leader-rules"'), html.indexOf('id="handbook-october-lessons"'));
const lines = ['启动日无法定龙', '加强日龙头高开一字领涨', '分化日龙头一字聚焦市场', '分歧日龙头开板放量抗跌', '回流日龙头率先上板主动'];

test('leader rules preserve the exact five user lines in order within the rhythm chapter', () => {
  const pairs = [...rules.matchAll(/<div><dt>(.*?)<\/dt><dd>(.*?)<\/dd><\/div>/g)].map((match) => match[1] + match[2]);
  assert.deepEqual(pairs, lines);
  assert.match(rules, /龙头规律/);
  assert.ok(html.indexOf('id="theme-volume-models"') < html.indexOf('id="leader-rules"'));
  assert.doesNotMatch(rules, /<details|<summary/);
  assert.match(rules, /不机械对应固定天数/);
  assert.match(rules, /href="#preorder-check"/);
});

test('framework summary mirrors all five lines without changing the raw framework archive', () => {
  const framework = read('framework-model/index.html');
  for (const line of lines) assert.ok(framework.includes(line), line);
  assert.match(framework, /href="\.\.\/index.html#leader-rules"/);
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.match(html, /<main class="content" id="main-content">\s*<section class="preorder-check"/);
  assert.match(read('assets/css/weekly-lessons.css'), /\.leader-rules-list > div[^}]*minmax\(0,1fr\)/);
});

test('first-wave phase proportions preserve both additions without turning them into day or board counts', () => {
  for (const text of [rules, read('framework-model/index.html')]) {
    assert.match(text, /前3\/4阶段/);
    assert.match(text, /龙头最猛、最有主动性、最有聚焦性/);
    assert.match(text, /后1\/4阶段/);
    assert.match(text, /龙头需要小弟助攻，需要题材板块助攻/);
    assert.match(text, /第一波主升/);
    assert.match(text, /固定天数或连板数/);
    assert.match(text, /不凭比例单独认定已进入后段/);
    assert.ok(text.indexOf('前3/4阶段') < text.indexOf('后1/4阶段'));
  }
});
