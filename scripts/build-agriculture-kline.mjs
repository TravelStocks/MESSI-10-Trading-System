import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const target = new URL("../assets/data/agriculture-kline.js", import.meta.url);
const stocks = [];
for (const [code, name, role] of [["600127", "金健米业", "整个周期总龙"], ["600371", "万向德农", "第一补涨周期龙头"], ["600108", "亚盛集团", "第二补涨周期龙头"]]) {
  const query = new URLSearchParams({ secid: `1.${code}`, klt: "101", fqt: "0", beg: "20260810", end: "20260923", fields1: "f1,f2,f3,f4,f5,f6", fields2: "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61" });
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?${query}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { Referer: "https://quote.eastmoney.com/" } });
  if (!response.ok) throw new Error(`${code}: HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.data?.name !== name || !payload.data?.klines?.length) throw new Error(`${code}: missing or mismatched data`);
  const days = payload.data.klines.map((line) => {
    const [date, ...fields] = line.split(",");
    const [open, close, high, low, volume, amount, amplitude, pct, change, turnover] = fields.map(Number);
    if (fields.length !== 10 || fields.some((field) => !Number.isFinite(Number(field))) || low > Math.min(open, close) || high < Math.max(open, close) || low <= 0 || volume < 0) throw new Error(`${code}: invalid ${date}`);
    return { date, open, close, high, low, volume, amount, amplitude, pct, change, turnover };
  });
  if (days.some((day, index) => index > 0 && day.date <= days[index - 1].date)) throw new Error(`${code}: dates not strictly increasing`);
  stocks.push({ code, name, role, url, days });
}
const data = { retrievedAt: new Date().toISOString(), provider: "东方财富日K接口", adjustment: "不复权（fqt=0）", interval: "日K", volumeUnit: "手", stocks };
await mkdir(new URL("../assets/data/", import.meta.url), { recursive: true });
await writeFile(target, `window.M10_AGRICULTURE_KLINE = ${JSON.stringify(data, null, 2)};\n`, "utf8");
console.log(`Saved ${stocks.length} stocks to ${fileURLToPath(target)} (${stocks.map((stock) => stock.days.length).join("/")} days)`);
