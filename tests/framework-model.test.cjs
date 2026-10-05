const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync, existsSync } = require('node:fs');
const { join, resolve } = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { searchFramework } = require('../framework-model/framework.js');

const dir = join(__dirname, '../framework-model');
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const context = { window: {} };
vm.runInNewContext(readFileSync(join(dir, 'source-data.js'), 'utf8'), context);
const data = JSON.parse(JSON.stringify(context.window.FRAMEWORK_SOURCE));
function flatten(nodes) { return nodes.flatMap(node => [node, ...flatten(node.children)]); }
const nodes = flatten(data.roots);

test('the full source archive, 272 unique topics, and old wording are retained', () => {
  assert.equal(nodes.length, data.nodeCount);
  assert.equal(nodes.length, 272);
  assert.equal(new Set(nodes.map(node => node.id)).size, nodes.length);
  assert.equal(createHash('sha256').update(readFileSync(join(dir, 'trading-system.xmind'))).digest('hex'), data.sourceSha256);
  const titles = new Set(nodes.map(node => node.title));
  for (const title of ['天时', '地利', '人和', '战法模式', '交易', '天时决定了交易选择', '指导原则', '地利和人和决定了交易标的', '快进快出吃点小肉就跑', '竞价就要买', '第三个放量板', '反核当天']) assert.ok(titles.has(title), title);
});

test('search retains ancestors, covers every branch, and handles no matches', () => {
  const all = searchFramework(data.roots, '');
  assert.equal(all.visible.size, 271);
  const result = searchFramework(data.roots, '反核');
  const leaf = nodes.find(node => node.title === '反核当天');
  assert.ok(result.matches.has(leaf.id));
  assert.ok(result.visible.has(nodes.find(node => node.title === '战法模式').id));
  const weather = nodes.find(node => node.title === '天时');
  const filtered = searchFramework(data.roots, '', weather.id);
  assert.ok(filtered.visible.has(weather.id));
  assert.equal(filtered.visible.size, flatten([weather]).length);
  assert.equal(searchFramework(data.roots, 'NOT_A_TOPIC').visible.size, 0);
  assert.ok(searchFramework(data.roots, '唯一性 身位').matches.size > 0);
});

test('the model page uses the latest chain, separates supplements and versions, and links resolve', () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  const chain = html.match(/<ol class="chain"[\s\S]*?<\/ol>/)[0];
  assert.equal((chain.match(/<li>/g) || []).length, 10);
  assert.ok(chain.indexOf('个股') < chain.indexOf('地位'));
  assert.ok(chain.indexOf('地位') < chain.indexOf('模式'));
  assert.match(html, /天时不好慢进快出，/);
  assert.match(html, /执行补充/);
  assert.match(html, /两个总仓范围的适用分界待本人确认/);
  assert.match(html, /当日相对昨收涨幅达到5%/);
  assert.match(html, /不等次日追/);
  for (const item of ['各身位晋级率', '断板率', '炸板率', '腾落数', '进攻属性', '防御属性', '伴生龙', '补涨首板', '埋伏', '第一笔仓位就可以推到80%', '100%监管红线高度附近']) assert.ok(html.includes(item), item);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (href.startsWith('#')) assert.ok(ids.includes(href.slice(1)), href);
    else assert.ok(existsSync(resolve(dir, href.split(/[?#]/)[0])), href);
  }
});
