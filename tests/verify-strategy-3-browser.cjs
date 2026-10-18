const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');

async function main() {
  const root = join(__dirname, '..');
  const output = join(root, 'output/strategy-3-switch');
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
      await page.goto(pathToFileURL(join(root, 'index.html')).href + '#relay-switch');
      await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
      await page.waitForSelector('#relay-switch');
      const detailUrl = await page.$eval('#relay-switch a', el => el.href);
      for (const [name, selector] of [['main', '#relay-switch'], ['detail', '#switch-selection']]) {
        if (name === 'detail') {
          await page.goto(detailUrl);
          await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
        }
        await page.$eval(selector, el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
        const result = await page.$eval(selector, el => {
          const box = el.getBoundingClientRect();
          const textOverflow = [...el.querySelectorAll('h3,h4,p,li')].filter(node => {
            const range = document.createRange(); range.selectNodeContents(node);
            return [...range.getClientRects()].some(r => r.left < box.left - 1 || r.right > box.right + 1);
          }).length;
          return { left: box.left, right: box.right, width: el.clientWidth, scroll: el.scrollWidth,
            height: box.height, textOverflow, text: el.textContent,
            links: [...el.querySelectorAll('a')].map(a => a.href) };
        });
        assert.ok(result.left >= 0 && result.right <= width + 1, JSON.stringify(result));
        assert.ok(result.height > 100 && result.scroll <= result.width + 1);
        assert.equal(result.textOverflow, 0);
        assert.ok(result.text.includes('只选前二') && result.text.includes('第一优先'));
        await (await page.$(selector)).screenshot({ path: join(output, `${name}-${width}.png`) });
        if (name === 'detail') {
          await page.click('#switch-selection a');
          await page.waitForFunction(() => location.hash === '#relay-switch');
          assert.ok(await page.$('#relay-switch'));
        }
        console.log(JSON.stringify({ width, name, passed: true }));
      }
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
