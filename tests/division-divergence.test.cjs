const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const detail = fs.readFileSync(path.join(root, '战法2 - 低位接力/A股一进二战法手册网页版/index.html'), 'utf8');
test('separates overnight front-two orders from divergence-day reseals', () => {
  const section = main.match(/<section[^>]*id="division-divergence-entry"[\s\S]*?<\/section>/)[0];
  for (const text of ['分化日', '分歧日', '最强前二', '隔夜单', '不去打一字缩量板', '换手', '回封', '不保证成交', '最大亏损']) assert(section.includes(text), text);
  assert.equal((section.match(/<tr>/g) || []).length, 3);
  assert(main.includes('href="#division-divergence-entry"'));
  assert(detail.includes('id="division-divergence-note"'));
  assert(detail.includes('href="../../index.html#division-divergence-entry"'));
});
test('knowledge addition preserves distinct anchors', () => {
  for (const html of [main, detail]) {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(ids.length, new Set(ids).size);
  }
});
