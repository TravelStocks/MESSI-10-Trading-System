const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
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

test('the eight strategy entries are ordered and retain their existing destinations', () => {
  const entries = html.match(/<div class="hero-entry-actions">([\s\S]*?)<\/div>/)[1];
  const labels = [...entries.matchAll(/<strong>(.*?)<\/strong>/g)].map((match) => match[1].replace(/<[^>]*>/g, ''));
  assert.deepEqual(labels, [
    '战法1：唯一性中高位连扳龙-龙头主升2',
    '战法2：进监管后反核龙头继续连扳-龙头主升3',
    '战法3：低位接力-切换',
    '战法4：机构趋势',
    '战法5：补涨',
    '战法6：连板龙转趋势龙-龙头二波',
    '战法7：龙头反抽以及监管套利',
    '战法8：总龙趋势下补涨连板龙-补涨龙中位3板'
  ]);
  const destinations = [...entries.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(destinations, [
    './战法1 - 龙头信仰/龙头信仰-阅读版.html',
    './strategy-2-regulated-leader/index.html',
    './战法2 - 低位接力/A股一进二战法手册网页版/index.html',
    './战法3 - 机构趋势/index.html',
    '#strategy-5',
    './strategy-6-rebound/index.html',
    '#strategy-7'
  ]);
  for (const href of destinations) {
    if (href.startsWith('#')) assert.ok(html.includes(`id="${href.slice(1)}"`), href);
    else assert.ok(existsSync(join(__dirname, '..', href)), href);
  }
  assert.match(entries, /entry-pending[\s\S]*?战法5：补涨[\s\S]*?内容待补充/);
  assert.match(entries, /<span class="strategy-stage">-龙头主升3<\/span>/);
  assert.match(entries, /<span class="strategy-stage">-补涨龙中位3板<\/span>/);
});

test('strategy references use the new numbers without breaking legacy anchors', () => {
  assert.match(html, /id="strategy-5"[\s\S]*?战法6 \/ 总龙二波/);
  assert.match(html, /id="strategy-7"[\s\S]*?战法8 \/ 补涨中位/);
  assert.match(html, /id="strategy-57-execution"/);
  assert.doesNotMatch(html, /战法5[、与].*?战法7|战法5、7|战法5 \/ 总龙二波|战法7 \/ 补涨中位/);
  const trend = readFileSync(join(__dirname, '..', '战法3 - 机构趋势/index.html'), 'utf8');
  assert.match(trend, /<title>机构趋势｜战法4<\/title>/);
  assert.match(trend, /Strategy 04 \/ Swing Trend/);
  assert.match(trend, /战法3 低位接力/);
  const rebound = readFileSync(join(__dirname, '..', 'strategy-6-rebound/index.html'), 'utf8');
  assert.match(rebound, /<title>战法7：龙头反抽以及监管套利｜MESSI-10<\/title>/);
});

test('the new regulated-leader strategy separates its stage and preserves the first-day rule', () => {
  const page = readFileSync(join(__dirname, '..', 'strategy-2-regulated-leader/index.html'), 'utf8');
  assert.match(page, /进监管后反核龙头继续连扳-龙头主升3/);
  assert.match(page, /第一天没拿先手就不要参与主升3/);
  assert.match(page, /具体买卖与仓位细则待补充/);
  assert.match(page, /战法7.*?首次调整/);
  assert.match(page, /href="\.\.\/index.html#resources"/);
  const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, href] of page.matchAll(/href="([^"]+)"/g)) {
    if (href.startsWith('#')) assert.ok(ids.includes(href.slice(1)), href);
    else if (!href.includes('#') && href.startsWith('../')) {
      assert.ok(existsSync(join(__dirname, '..', 'strategy-2-regulated-leader', href.split('?')[0])), href);
    }
  }
});
