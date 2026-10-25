const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const root = join(__dirname, '..');
const detailPath = '战法2 - 低位接力/A股一进二战法手册网页版/index.html';
const main = readFileSync(join(root, 'index.html'), 'utf8');
const detail = readFileSync(join(root, detailPath), 'utf8');
const summary = main.match(/<section[^>]*id="relay-switch"[\s\S]*?<\/section>/)[0];
const supplement = detail.match(/<div[^>]*id="switch-selection"[\s\S]*?<\/div>/)[0];

test('strategy 3 retains its legacy destination and exposes the new switching sequence', () => {
  assert.ok(existsSync(join(root, detailPath)));
  assert.match(main, /战法3：低位接力选次日竞价最强-切换/);
  assert.match(detail, /<title>战法3：低位接力选次日竞价最强-切换/);
  assert.match(detail, /<h1>战法3：低位接力选次日竞价最强-切换<\/h1>/);
  for (const text of [summary, supplement]) {
    for (const phrase of ['题材爆发强度', '次日', '同题材', '同身位', '只选前二', '第一优先', '第二备选']) {
      assert.ok(text.includes(phrase), phrase);
    }
    assert.match(text, /最强无法参与，且次强也符合计划条件/);
    assert.match(text, /没有合格强票就等待/);
    assert.match(text, /仓位仍由天时/);
    const sequence = text.match(/<ol\b[^>]*>([\s\S]*?)<\/ol>/)[1];
    assert.ok(sequence.indexOf('首日') < sequence.indexOf('次日'));
  }
  assert.doesNotMatch(main, /竞价强度前三/);
});

test('switching, mature leaders, catch-up and inferred third-party evidence stay distinct', () => {
  assert.match(summary, /不放宽成熟龙头的唯一核心要求/);
  assert.match(supplement, /不是必须两只都买/);
  assert.match(supplement, /2进3成功后准备次日隔夜排单/);
  assert.match(supplement, /第三方学习案例/);
  assert.match(supplement, /可能.*不是董事长本人确认的买入依据/);
  assert.match(supplement, /未取得其交割/);
  assert.match(supplement, /不保证延续或收益/);
});

test('new anchors are unique and handbook cross-links resolve', () => {
  for (const page of [main, detail]) {
    const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size);
  }
  assert.ok(summary.includes(`${detailPath}#switch-selection`));
  assert.match(supplement, /href="\.\.\/\.\.\/index.html#relay-switch"/);
  assert.match(detail, /href="#switch-selection"/);
});

test('switching exit separates theme persistence, intraday failure and waiting limits', () => {
  for (const page of [detail]) {
    for (const phrase of ['id="switching-entry-exit"', '不是必须等满两天', '前排抗跌领涨', '换手回封', 'T+1', '分化次日按实际状态判断']) {
      assert.ok(page.includes(phrase), phrase);
    }
  }
  assert.ok(detail.includes('“宝龙科技”是名称待核的观察票'));
  assert.ok(detail.includes('原口述“吉大振华”按交割中的吉大正元整理'));
  assert.ok(detail.includes('不取消分化日排前二一字的独立分支'));
});

test('full switching-exit lesson lives in strategy 3 handbook, not a standalone home panel', () => {
  assert.ok(summary.includes('id="switching-entry-exit"'));
  assert.ok(summary.includes(`${detailPath}#switching-entry-exit`));
  assert.doesNotMatch(main, /<section[^>]*id="switching-entry-exit"/);
  assert.ok(detail.includes('切换失败及时退出：题材助攻与核心承接一起看'));
  assert.ok(detail.includes('买入看最强方向能否续强，持有看梯队是否延续'));
});
