const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const read = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const html = read('index.html');
const script = read('assets/js/preorder-check.js');
const check = html.slice(html.indexOf('id="preorder-check"'), html.indexOf('<div class="handbook-intro">'));

test('the four-question buy check is the first main module, above the ten-step title', () => {
  assert.match(html, /<main class="content" id="main-content">\s*<section class="preorder-check"/);
  assert.ok(html.indexOf('id="preorder-check"') < html.indexOf('id="handbook-order"'));
  assert.ok(html.indexOf('id="preorder-check"') < html.indexOf('id="mode-focus-priority"'));
  assert.equal((check.match(/type="checkbox"/g) || []).length, 4);
  for (const word of ['监管函首日第一次反核上板确认', '三板已确认补涨龙地位', '胜负未分', '大单开始回封', '条件不符，就观望', '核对完成不等于买点成立']) assert.ok(check.includes(word), word);
  assert.doesNotMatch(check, /<details|<summary|type="submit"|允许下单|可以买入/);
  assert.match(html, /class="topbar-archive" href="#preorder-check">买前四问/);
  assert.equal((html.match(/class="toc-link" href="#preorder-check"/g) || []).length, 2);
  assert.match(html, /下周盘前四问已置顶/);
  assert.equal((html.match(/等的是监管函首日第一次反核上板确认，还是错过最后买点后再博反弹/g) || []).length, 1);
});

test('checklist keeps accessible controls, responsive emphasis and valid detailed-rule links', () => {
  assert.match(check, /aria-live="polite"/);
  assert.match(check, /autocomplete="off"/);
  assert.match(check, /type="reset">重新核对/);
  assert.equal((check.match(/aria-label="已核对/g) || []).length, 4);
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
  for (const [, id] of check.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(id), id);
  const css = read('assets/css/preorder-check.css');
  assert.match(css, /border-block: 4px solid/);
  assert.match(css, /repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /grid-template-columns: 1fr/);
  assert.match(css, /focus-visible/);
  assert.match(html, /preorder-check.js\?v=20261107/);
});

test('check progress updates, resets and clears restored state without granting trade permission', () => {
  const checks = Array.from({ length: 4 }, () => ({ checked: true }));
  const status = { textContent: '' };
  const formEvents = {};
  const windowEvents = {};
  const form = { querySelectorAll: () => checks, querySelector: () => status, addEventListener: (event, callback) => { formEvents[event] = callback; } };
  vm.runInNewContext(script, { document: { querySelector: () => form }, window: { addEventListener: (event, callback) => { windowEvents[event] = callback; } }, requestAnimationFrame: (callback) => callback() });
  assert.ok(checks.every((item) => !item.checked));
  assert.equal(status.textContent, '本次核对 0 / 4');
  checks[0].checked = true;
  formEvents.change();
  assert.equal(status.textContent, '本次核对 1 / 4');
  checks.forEach((item) => { item.checked = true; });
  formEvents.change();
  assert.equal(status.textContent, '本次核对 4 / 4');
  formEvents.reset();
  assert.ok(checks.every((item) => !item.checked));
  assert.equal(status.textContent, '本次核对 0 / 4');
  checks[2].checked = true;
  windowEvents.pageshow();
  assert.ok(checks.every((item) => !item.checked));
  let prevented = false;
  formEvents.submit({ preventDefault() { prevented = true; } });
  assert.ok(prevented);
  assert.doesNotMatch(script, /localStorage|sessionStorage|fetch\(|允许下单/);
});

test('the checklist script does nothing on views without its form', () => {
  assert.doesNotThrow(() => vm.runInNewContext(script, { document: { querySelector: () => null } }));
});
