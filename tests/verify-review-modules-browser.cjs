const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');

async function main() {
  const root = path.resolve(__dirname, '..');
  const output = path.join(root, 'output/review-modules');
  fs.mkdirSync(output, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const width of [1440, 768, 390]) {
      await page.setViewport({ width, height: 1000 });
      await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
      await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
      for (const id of ['recurring-errors', 'weekly-errors-20261023', 'lessons-learned', 'crowd-weekly-lessons']) {
        await page.$eval(`#${id}`, e => e.scrollIntoView({ behavior: 'instant', block: 'start' }));
        const state = await page.$eval(`#${id}`, el => {
          const b = el.getBoundingClientRect();
          return { overflow: el.scrollWidth > el.clientWidth + 1, left: b.left, right: b.right,
            missingLinks: [...el.querySelectorAll('a[href^="#"]')].map(a => a.hash.slice(1)).filter(id => !document.getElementById(id)),
            textOverflow: [...el.querySelectorAll('p,h2,h3,h4,dt,dd')].some(n => {
              const r = document.createRange(); r.selectNodeContents(n);
              return [...r.getClientRects()].some(x => x.left < b.left - 1 || x.right > b.right + 1);
            }) };
        });
        assert(!state.overflow && !state.textOverflow && state.left >= 0 && state.right <= width + 1, JSON.stringify({ id, width, ...state }));
        assert.deepEqual(state.missingLinks, []);
        await page.screenshot({ path: path.join(output, `${id}-${width}.png`) });
      }
      assert.equal(await page.$$eval('#lessons-learned .review-note-list > li', x => x.length), 11);
      assert.equal(await page.$$eval('#weekly-errors-20261023 .review-note-list > li', x => x.length), 5);
      await page.click('#crowd-weekly-lessons a[href="#lessons-learned"]');
      await page.waitForFunction(() => location.hash === '#lessons-learned');
      await page.click('#lessons-learned a[href="#recurring-errors"]');
      await page.waitForFunction(() => location.hash === '#recurring-errors');
      console.log(JSON.stringify({ width, passed: true }));
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
