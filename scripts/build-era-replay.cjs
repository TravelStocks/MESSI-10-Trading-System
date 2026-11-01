const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const [barsFile, auditRoot] = process.argv.slice(2);
if (!barsFile || !auditRoot) throw new Error('Usage: node scripts/build-era-replay.cjs <600241.json snapshot> <three-table directory>');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const snapshot = read(barsFile);
if (snapshot.code !== '600241') throw new Error('Wrong stock snapshot');
const sector = read(path.join(auditRoot, 'audits/2026-10-12-source-audit.json')).sector.meta['电池'];
if (sector.legend !== '锂电池') throw new Error('Theme identity must be verified');
const strength = new Map(sector.recent.map(([date, value]) => [`2026-${date}`, value]));
const snapshots = new Map();
for (const date of ['2026-09-29', '2026-09-30', '2026-10-09']) {
  const source = read(path.join(auditRoot, `audits/${date}-theme-coverage-snapshot.json`));
  snapshots.set(source.current_groups.date, source.current_groups);
  snapshots.set(source.previous_groups.date, source.previous_groups);
}
snapshots.set('2026-10-12', read(path.join(auditRoot, 'audits/2026-10-12-theme-limitups.json')));
const themeDays = [
  ['2026-09-29', 2, '题材启动', '启动扩散，建立强度观察起点。'],
  ['2026-09-30', 3, '题材分化', '家数收缩，观察前排辨识度与承接。'],
  ['2026-10-08', 4, '分歧后日内回流', '龙头主动放量上板，配合题材回流；本例买点。'],
  ['2026-10-09', 5, '弱分化／个股转强', '题材回流后弱分化，龙头缩量一字聚焦；不是保证可买。'],
  ['2026-10-12', 6, '高位分歧延续', '题材强度转负，家数降至3只；龙头连续封板后炸板为本例卖点。']
].map(([date, board, phase, note]) => {
  const group = snapshots.get(date)?.groups.find((item) => item.name === '锂电池');
  if (!group || group.count !== new Set(group.stocks.map((stock) => stock.code)).size || !strength.has(date)) throw new Error(`Missing or inconsistent theme evidence: ${date}`);
  return { date, board, phase, note, strength: strength.get(date), count: group.count, stocks: group.stocks };
});
const dates = ['2026-10-08', '2026-10-09', '2026-10-12'];
const bars = snapshot.bars.filter((bar) => dates.includes(bar.date));
for (const date of dates) if (bars.filter((bar) => bar.date === date).length !== 48) throw new Error(`Incomplete five-minute day: ${date}`);
for (const [i, bar] of bars.entries()) {
  if (![bar.open, bar.high, bar.low, bar.close, bar.volume].every(Number.isFinite) || bar.low <= 0 || bar.volume < 0 || bar.low > Math.min(bar.open, bar.close) || bar.high < Math.max(bar.open, bar.close) || i && bar.dt <= bars[i - 1].dt) throw new Error(`Invalid bar: ${bar.dt}`);
}
const fills = [
  { dt: '2026-10-08 09:32:32', side: '买', price: 10.69, quantity: 200 },
  { dt: '2026-10-09 09:46:22', side: '买', price: 11.76, quantity: 500 },
  { dt: '2026-10-12 10:01:25', side: '卖', price: 12.94, quantity: 100 },
  { dt: '2026-10-12 10:01:44', side: '卖', price: 12.94, quantity: 100 },
  { dt: '2026-10-12 10:28:20', side: '卖', price: 12.36, quantity: 500 }
];
const output = {
  name: '时代万恒', code: '600241', version: '2026-11-01', interval: '5分钟', timezone: 'Asia/Shanghai', volumeUnit: '股',
  barsSource: snapshot.source, barsRetrievedAt: snapshot.retrievedAt,
  sourceSnapshotSha256: createHash('sha256').update(fs.readFileSync(barsFile)).digest('hex'),
  retainedBarsSha256: createHash('sha256').update(JSON.stringify(bars)).digest('hex'),
  reviewSource: 'https://travelstocks.github.io/weekly-monthly-quarterly-yearly-trading-review/2026-10-26_2026-10-30/#opportunity-era',
  strengthSource: sector.source, strengthCode: sector.code, strengthLegend: sector.legend,
  countSource: 'https://www.duanxianxia.com/api/getFupanByYidong',
  themeEvidence: ['2026-09-29-theme-coverage-snapshot.json', '2026-09-30-theme-coverage-snapshot.json', '2026-10-09-theme-coverage-snapshot.json', '2026-10-12-theme-limitups.json', '2026-10-12-source-audit.json'],
  interpretation: '题材阶段与大小题材节奏同构为本人复盘归纳，强度原值和涨停家数为独立指标；不从家数自动推导阶段，不固定板数或波数。',
  volumeNote: '沿用新浪原始成交量（股），不当作成交额或换手率。',
  timeNote: '时间戳为五分钟区间结束时间；09:35对应09:30—09:35。首段可能包含集合竞价量，源接口未另行拆分；午休和非交易日不补K。',
  events: [
    { id: 'buy', label: '四板上板买', date: '2026-10-08', start: '09:30', end: '09:35', barTime: '09:35', reference: 10.69, referenceBasis: '上板价格；首段五分钟高与收均为10.69。交割证明09:32:32已有成交，不等同于精确首次触板时间。' },
    { id: 'sell', label: '六板炸板卖', date: '2026-10-12', start: '10:25', end: '10:30', barTime: '10:30', reference: 12.68, referenceBasis: '连续封板后离板K线的收盘参考，不是涨停成交承诺。该段最低12.31；实际10:28:20卖出价12.36。早盘首两段也有开板波动，OHLC不能确定逐笔顺序，不宣称这是全天首次炸板。' }
  ],
  themeDays, bars, fills
};
const target = path.join(__dirname, '../assets/data/era-replay.json');
fs.writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Saved ${themeDays.length} theme days, ${bars.length} original bars, ${fills.length} actual fills`);
