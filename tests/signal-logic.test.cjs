const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const root = join(__dirname, '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
test('signal and logic learning preserves provenance and risk hierarchy', () => {
  const block = html.slice(html.indexOf('id="signal-logic"'), html.indexOf('id="worldview-decision-framework"'));
  for (const phrase of ['有逻辑 + 有信号', '有逻辑 + 没信号', '没逻辑 + 有信号', '没逻辑 + 没信号', '周初权益达到5%', '本周停止新开仓', '新增开仓预算为0', '缺证据标待核', '本次未逐日核验', '不作为《龙头信仰》原文引用', '不是仓位指令']) assert.ok(block.includes(phrase), phrase);
  assert.match(block, /4207af2f574e8012a652f9c7995d41b2/);
  assert.ok(existsSync(join(root, 'assets/images/signal-logic-notion.png')));
  assert.match(html, /href="#signal-logic">补充学习/);
  assert.equal((html.match(/id="signal-logic"/g) || []).length, 1);
});
