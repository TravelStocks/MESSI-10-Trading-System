const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');

async function main() {
  const root = join(__dirname, '..');
  const output = join(root, 'output/playwright/strategy-renumber');
  mkdirSync(output, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true
  });
  const errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [1440, 768, 390]) {
      await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
      await page.goto(pathToFileURL(join(root, 'index.html')).href + '#strategy-9');
      await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
      const cards = await page.$$eval('.hero-entry-actions > .entry-link', nodes => nodes.map(el => {
        const box = el.getBoundingClientRect();
        const textOverflow = [...el.querySelectorAll('strong,em,p,.entry-action')].some(node => {
          const range = document.createRange();
          range.selectNodeContents(node);
          return [...range.getClientRects()].some(r =>
            r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1);
        });
        return { title: el.querySelector('strong').textContent, left: box.left, right: box.right,
          width: el.clientWidth, scroll: el.scrollWidth, textOverflow };
      }));
      assert.deepEqual(cards.map(card => Number(card.title.match(/^战法(\d+)/)[1])), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
      assert.equal(cards[3].title, '战法4：题材发酵主升切换成轮动题材市场情绪高标锚定-抱团情绪龙');
      assert.equal(cards[7].title, '战法8：机构趋势');
      assert.equal(cards[8].title, '战法9：补涨');
      for (const card of cards) {
        assert.ok(card.left >= 0 && card.right <= width + 1, JSON.stringify(card));
        assert.ok(card.scroll <= card.width + 1 && !card.textOverflow, JSON.stringify(card));
      }
      await (await page.$('.hero-entry-actions')).screenshot({ path: join(output, `entries-${width}.png`) });
      await page.click('#strategy-9');
      await page.waitForFunction(() => location.hash === '#strategy-9-model');
      const bounds = await page.$eval('#strategy-9-model', el => {
        const box = el.getBoundingClientRect();
        const textOverflow = [...el.querySelectorAll('h2,h3,p,li,td,dt,dd')].filter(node => {
          const range = document.createRange();
          range.selectNodeContents(node);
          return [...range.getClientRects()].some(r => r.left < box.left - 1 || r.right > box.right + 1);
        }).length;
        return { left: box.left, right: box.right, width: el.clientWidth, scroll: el.scrollWidth,
          height: box.height, textOverflow, rows: el.querySelectorAll('tbody tr').length };
      });
      assert.ok(bounds.left >= 0 && bounds.right <= width + 1, JSON.stringify(bounds));
      assert.ok(bounds.scroll <= bounds.width + 1 && bounds.height > 100);
      assert.equal(bounds.textOverflow, 0);
      assert.equal(bounds.rows, 3);
      await (await page.$('#strategy-9-model')).screenshot({ path: join(output, `detail-${width}.png`) });
      await (await page.$('#jiuyang-notion-model')).screenshot({ path: join(output, `jiuyang-notion-${width}.png`) });
      await page.click('#strategy-9-model a[href="#resources"]');
      await page.waitForFunction(() => location.hash === '#resources');
      console.log(JSON.stringify({ width, passed: true }));
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
