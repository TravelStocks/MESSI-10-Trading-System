const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const root = path.join(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('index.html');
const section = (id, end) => html.slice(html.indexOf(`id="${id}"`), html.indexOf(`id="${end}"`));
const weekly = section('weekly-lessons-20261106', 'execution-upgrade');
const queue = section('queue-execution-20261106', 'mode-entry-windows');
const budget = section('mode-budget-limits', 'handbook-entry-position');
const catchup = section('strategy-7', 'strategy-57-execution');
const study = section('profit-effect-20261106', 'weekly-review-checks');
const source = 'https://travelstocks.github.io/weekly-monthly-quarterly-yearly-trading-review/2026-11-02_2026-11-06/';

test('weekly verdict takes precedence over earlier HuGong assumptions without inventing fills or PnL', () => {
  for (const word of ['大业', '沪工', '文投', '闽发', '未成交', '周五仍空仓', '地天板', '新增确认']) assert.ok(weekly.includes(word), word);
  assert.match(weekly, /补涨阶段不等于补涨龙/);
  assert.match(weekly, /早先.*假设/);
  assert.match(weekly, /后来浙文.*事后结果/);
  assert.match(weekly, /早排也不保证买到/);
  assert.match(weekly, /假如没有上一笔亏损/);
  assert.match(weekly, /不新增成交、账户收益/);
  assert.match(weekly, /下周盘前四问.*没定龙不抢，定龙后符合预案不等/);
});

test('account tiers replace fixed first-entry fractions and preserve the undecided-PK ban', () => {
  assert.match(budget, /50%.*100%.*账户总资产/);
  assert.match(budget, /PK未决不参与优先于可能唯一档位/);
  assert.match(budget, /固定首笔已被确认分档替代/);
  assert.match(budget, /第一波、主升二、题材连板龙/);
  assert.match(budget, /天时为主、地利为辅/);
  assert.match(budget, /最大亏损.*失效条件/);
  const context = { window: {} };
  vm.runInNewContext(read('assets/data/october-lessons.js'), context);
  const data = context.window.M10_OCTOBER_LESSONS;
  assert.equal(data.version, '2026-11-06');
  assert.match(data.entryAllocation.status, /历史版本.*替代/);
  assert.deepEqual(Array.from(data.currentAllocation.tiers, (tier) => tier.value), ['≤50%', '≤100%']);
  const renderer = read('assets/js/october-lessons.js');
  assert.match(renderer, /data.currentAllocation.tiers/);
  assert.doesNotMatch(renderer, /data.entryAllocation.(strong|weak)/);
  assert.doesNotMatch(html, /最新首笔：强天时用该票计划仓位的80%/);
  assert.doesNotMatch(html, /主升3是冲击200%的异动阶段/);
});

test('non-main modes share 20 percent while first regulatory-letter confirmation is a nonadditive exception', () => {
  assert.match(budget, /非主模式.*合计≤20%/);
  assert.match(budget, /共用额度，不是每只各20%/);
  assert.match(budget, /监管函首日.*50%/);
  assert.match(budget, /第一次反核上板确认/);
  assert.match(budget, /次日马上退出/);
  assert.match(budget, /不能与其他额度机械相加/);
  assert.match(budget, /严重异动/);
  const regulatory = read('strategy-2-regulated-leader/index.html');
  assert.match(regulatory, /首日确认≤50%，次日退出/);
  assert.match(regulatory, /历史原述.*不授权确认前竞价抢入/);
  assert.match(regulatory, /函件类型、发布日期与对应交易尚未逐项核实/);
  assert.match(regulatory, /可能阻碍退出/);
});

test('catch-up entries require confirmed status on board three and remove the old fourth-board exception', () => {
  assert.match(catchup, /四板及以上不再新开仓/);
  assert.match(catchup, /次日已是四板时不再补买/);
  assert.match(catchup, /PK未决不参与/);
  assert.match(catchup, /共用非主模式额度/);
  assert.doesNotMatch(catchup, /3进4仅在更强|3进4需更强/);
  const allocation = section('strategy-57-execution', 'case-agriculture-2026');
  assert.match(allocation, /共用非主模式账户20%额度/);
  assert.match(allocation, /撤销旧/);
});

test('queue preparation, entry trigger and holding checks use different numerators, times and denominators', () => {
  for (const value of ['0.8', '1/4', '1/10', '2.00亿元×1.3', '2.60亿元', '2.54亿元', '600万元', '3473万元', '7655万元', '2.1亿元', '1029万元']) assert.ok(queue.includes(value), value);
  assert.match(queue, /不套加速缩量板/);
  assert.match(queue, /1\/4，只进入准备/);
  assert.match(queue, /连续进攻成交超过当时剩余卖压、回封开始/);
  assert.match(queue, /1\/10是持仓观察，不是买点/);
  assert.match(queue, /盘中漏单优先退出，不等真的炸板/);
  assert.match(queue, /预计.*5000万元.*不是已成交/);
  assert.match(queue, /确认晚、执行慢、及时排但未成交/);
  assert.match(queue, /尚无统一统计时段/);
  assert.match(queue, /盘口不能证实卖方身份/);
});

test('buy gates and scenario planning do not exempt a candidate just because it can be bought', () => {
  const gate = section('buy-preflight-20261106', 'queue-execution-20261106');
  assert.equal((gate.match(/<h4>0[1-4]/g) || []).length, 4);
  assert.match(gate, /有预案.*买前四问/);
  assert.match(gate, /前排一字买不到/);
  assert.match(gate, /临近下单/);
  assert.match(gate, /新信息使前提失效/);
});

test('expectation and profitability studies keep observed gaps separate from opening returns and unverified edge claims', () => {
  for (const phrase of ['严格高于昨日最高价', '+3%', '+2%', '+6%～+9.9%', '相对昨收', '不自动加仓', '已有仓', '看不清', '不是三笔成交']) assert.ok(study.includes(phrase), phrase);
  assert.match(study, /五板后断板仍有溢价.*待验证假设/);
  assert.match(study, /成功与失败样本/);
  assert.match(study, /不写必有溢价、胜率/);
  assert.match(study, /整体情绪、题材板块、核心个股/);
  assert.match(study, /判断错误、证据出现太晚、执行偏离/);
  assert.match(study, /不计入实盘或账户收益/);
  assert.match(study, /不是取消止损/);
});

test('small-theme support and second-wave notes do not overwrite verified charts or existing strict windows', () => {
  const small = section('small-theme-support-20261106', 'case-jinyao-crossing');
  for (const phrase of ['低一身位', '不是低位首板', '永贞股份', '紫竹高科', '符合预期，不写成超预期', '六至七板', '不是必达高度', '传智教育', '哈药股份与百花医药', '立新能源', '大业股份与襄阳轴承', '华电辽能']) assert.ok(small.includes(phrase), phrase);
  assert.match(small, /不把它覆盖到已核验的时代5分K日期/);
  const wave = section('second-wave-notes-20261106', 'strategy-7');
  assert.match(wave, /突破新高、跳空高开/);
  assert.match(wave, /不继续创新高、爆量未涨停/);
  assert.match(wave, /联合窗口仍保留/);
  assert.match(wave, /未统一.*不新增机械下单指令/);
});

test('all new modules are visible, sourced, internally linked and shared views use the fresh version', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const id of ['weekly-lessons-20261106', 'buy-preflight-20261106', 'queue-execution-20261106', 'profit-effect-20261106', 'expectation-check-20261106', 'small-theme-support-20261106']) assert.ok(ids.includes(id));
  for (const module of [weekly, queue, budget, study]) {
    assert.ok(module.includes(source));
    assert.doesNotMatch(module, /<details|<summary/);
    for (const [, id] of module.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), id);
  }
  for (const name of ['index.html', 'framework-model/index.html', '资料库 - 龙头周期复盘/index.html']) {
    assert.match(read(name), /data\/october-lessons.js\?v=20261106/);
    assert.match(read(name), /js\/october-lessons.js\?v=20261106/);
  }
});
