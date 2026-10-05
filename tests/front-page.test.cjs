const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
const steps = ['天时', '地利', '题材', '阶段', '个股', '地位', '模式', '仓位（强天时还是弱天时）', '买点（择日和分时）', '卖点（择日和分时）'];
const section = html.match(/<section\b[^>]*id="recurring-errors"[\s\S]*?<\/section>/)[0];

test('the annotated ten-step order is the first headline and precedes the error guards', () => {
  const headline = html.match(/<h1 id="handbook-order">([\s\S]*?)<\/h1>/)[1];
  const labels = [...headline.matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/g)]
    .map((match) => match[1].replace(/<i[^>]*>[\s\S]*?<\/i>/g, '').replace(/<[^>]*>/g, '').trim());
  assert.deepEqual(labels, steps);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(html.indexOf('id="handbook-order"') < html.indexOf('id="recurring-errors"'));
  assert.ok(html.indexOf('id="recurring-errors"') < html.indexOf('id="execution-upgrade"'));
});

test('the detailed order includes status and both day and intraday exit timing', () => {
  const chain = html.match(/<ol class="execution-chain"[\s\S]*?<\/ol>/)[0];
  assert.equal((chain.match(/<li>/g) || []).length, 10);
  assert.ok(chain.indexOf('06 / 地位') < chain.indexOf('07 / 模式'));
  assert.match(chain, /08 \/ 仓位[\s\S]*?强天时还是弱天时/);
  assert.match(chain, /09 \/ 买点[\s\S]*?择日：[\s\S]*?分时：/);
  assert.match(chain, /10 \/ 卖点[\s\S]*?择日：[\s\S]*?分时：/);
  assert.doesNotMatch(html, /九步/);
});

test('each of the five errors has a stop rule, alternative action, and dated evidence', () => {
  const errors = [...section.matchAll(/<li id="(redline-[^"]+)">([\s\S]*?)<\/li>/g)];
  assert.deepEqual(errors.map((match) => match[1]), [
    'redline-stage', 'redline-averaging', 'redline-technology', 'redline-exit', 'redline-window'
  ]);
  for (const [, , body] of errors) {
    assert.match(body, /class="redline-stop"/);
    assert.match(body, /class="redline-action"/);
    assert.match(body, /<details class="redline-evidence">/);
    assert.deepEqual([...body.matchAll(/<dt>(.*?)<\/dt>/g)].map((match) => match[1]), ['6月基线', '7月', '8月', '9月']);
  }
  assert.match(section, /不是精确交易次数/);
  assert.match(section, /不把桂林的自动回补标记升级为本人未确认的违规/);
  assert.match(section, /为摊低成本追加次数必须为0/);
});

test('new anchors resolve and do not duplicate existing ids', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, hash] of section.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(hash), hash);
  assert.ok(html.includes('href="#recurring-errors"'));
});
