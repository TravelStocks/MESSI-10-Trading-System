const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const test = require('node:test');
const read = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const html = read('index.html');
const moduleText = html.slice(html.indexOf('id="healthy-turnover"'), html.indexOf('id="theme-volume-models"'));

test('healthy turnover is integrated after volume mechanics with all six source observations', () => {
  assert.ok(html.indexOf('id="volume-window"') < html.indexOf('id="healthy-turnover"'));
  assert.ok(html.indexOf('id="healthy-turnover"') < html.indexOf('id="theme-volume-models"'));
  assert.equal((moduleText.match(/<h4><span>0[1-6]<\/span>/g) || []).length, 6);
  for (const phrase of ['筹码在哪里', '浮盈背景', '有承接的区间', '不坚定筹码', '必要量能补够', '成本区域', '兑现压力', '过早上板', '先来的人有利润，后来的人有预期']) assert.ok(moduleText.includes(phrase), phrase);
  assert.doesNotMatch(moduleText, /<details|<summary/);
  assert.match(moduleText, /Notion《怎样的换手才是好换手》/);
  assert.match(moduleText, /4127af2f574e80c886b2e23cb45c6a1d/);
});

test('chip explanations stay hypotheses, support is layered and no strategy limits are changed', () => {
  for (const phrase of ['题材支撑 · 地利', '地位支撑 · 人和', '市场支撑 · 天时', '不改变十步判断顺序', '不能证明卖方身份', '不能保证之后没有便宜筹码或抛压', 'T字形态都不单独构成买点', '现行模式限制不变', '按既有计划处理']) assert.ok(moduleText.includes(phrase), phrase);
  assert.match(moduleText, /清洗浮筹.*取消退出/);
  assert.match(moduleText, /不把既有排单专项0.8倍条件推广/);
  assert.match(moduleText, /没有新增买卖价格、止损幅度、仓位或固定补量阈值/);
});

test('original image remains unmodified and its caption does not infer yesterday or the full day', () => {
  const image = fs.readFileSync(path.join(__dirname, '../assets/images/hayao-healthy-turnover-notion.png'));
  assert.equal(createHash('sha256').update(image).digest('hex'), '6c156a7019cc114bea76a195deb4e5a1a4715fb4902f95ffa8a605866b70c679');
  assert.equal(image.readUInt32BE(16), 861);
  assert.equal(image.readUInt32BE(20), 1023);
  assert.match(moduleText, /width="861" height="1023" loading="lazy"/);
  assert.match(moduleText, /2026-08-07、开盘6.65、最新6.54/);
  assert.match(moduleText, /未给出昨日最高价、昨日日K或全天走势/);
  assert.match(moduleText, /不作为本人买卖或成交证据/);
  assert.doesNotMatch(moduleText, /X-Amz-|notion-file-block:|space_id=/);
});

test('related knowledge links resolve and the first pre-order module stays in place', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, id] of moduleText.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), id);
  assert.match(read('framework-model/index.html'), /href="\.\.\/index.html#healthy-turnover"/);
  for (const id of ['queue-execution-20261106', 'expectation-check-20261106']) {
    const source = html.slice(html.indexOf(`id="${id}"`), html.indexOf(`id="${id}"`) + 800);
    assert.match(source, /href="#healthy-turnover"/);
  }
  assert.match(html, /<main class="content" id="main-content">\s*<section class="preorder-check"/);
  assert.match(read('assets/css/healthy-turnover.css'), /@media \(max-width: 640px\)/);
});
