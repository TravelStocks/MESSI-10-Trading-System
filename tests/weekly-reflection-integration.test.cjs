const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const section = id => html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?<\\/section>`))[0];

test('errors and lessons are two dated modules without discarding history', () => {
  const errors = section('recurring-errors');
  const lessons = section('lessons-learned');
  assert(errors.includes('<h2 id="recurring-errors-title">过往错误清单</h2>'));
  assert(lessons.includes('<h2 id="lessons-learned-title">经验吸取</h2>'));
  assert(!html.includes('红线再犯 / 每次开仓与加仓前检查'));
  assert(errors.includes('id="weekly-errors-20261023"'));
  assert(errors.includes('docs/2026-10-05-redline-checks.md'));
  assert(errors.includes('2026年6—9月'));
  assert.equal((errors.match(/<li id="redline-/g) || []).length, 5);
  for (const [block, prefix, count] of [[errors, 'error-', 5], [lessons, 'lesson-', 11]]) {
    const rows = [...block.matchAll(new RegExp(`<li id="(${prefix}[^"]+)">([\\s\\S]*?)<\\/li>`, 'g'))];
    assert.equal(rows.length, count);
    for (const [, id, body] of rows) {
      assert(body.includes('<time datetime="2026-10-25">'), id);
      assert(body.includes('2026-10-19_2026-10-23/#'), id);
      assert(body.includes('review-source'), id);
    }
  }
});

test('crowd model integrates this week while preserving strategy boundaries', () => {
  const model = section('strategy-9-model');
  assert(model.includes('id="crowd-weekly-lessons"'));
  for (const text of ['href="#recurring-errors"', 'href="#lessons-learned"', '放量分歧后横住', '资金拉升顺序', '不是碰线即买', '不是硬门槛']) {
    if (text === '不是碰线即买') assert(html.includes('不是碰线即买') || html.includes('不能碰线即买'));
    else if (text === '资金拉升顺序') assert(html.includes(text));
    else assert(model.includes(text), text);
  }
  assert(model.includes('切换、补涨的买点不直接套到抱团上'));
  assert(model.includes('不新增仓位与止损数值'));
  assert(html.includes('未经其本人') || html.includes('不当作其已证实的动机'));
});

test('weekly source anchors and internal links are traceable', () => {
  const anchors = new Set(['reflection', 'reflection-1', 'reflection-2', 'rotation-wave-comparison', 'two-day-strength', 'emotion-transmission', 'emotion-sector-index-resonance', 'reflection-6', 'division-divergence-entry', 'crowding-crossing-first-move', 'leader-failure-crowding-repair', 'reduce-weak-theme-switching', 'mode-priorities', 'switching-entry-exit', 'ticket-review']);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  for (const id of ['recurring-errors', 'lessons-learned']) {
    const block = section(id);
    for (const [, hash] of block.matchAll(/href="#([^"]+)"/g)) assert(ids.has(hash), hash);
    for (const [, hash] of block.matchAll(/2026-10-19_2026-10-23\/#([^"]+)"/g)) assert(anchors.has(hash), hash);
  }
});
