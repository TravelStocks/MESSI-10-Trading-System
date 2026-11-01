(() => {
  const root = document.querySelector('[data-era-replay]');
  if (!root) return;
  const status = root.querySelector('[data-era-status]');
  const load = async () => {
    const response = await fetch(root.dataset.source);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const themeNode = root.querySelector('[data-era-theme-chart]');
    const stockNode = root.querySelector('[data-era-stock-chart]');
    const actualToggle = root.querySelector('[data-era-actual]');
    const dates = data.bars.map((bar) => bar.dt);
    const limits = { '2026-10-08': 10.69, '2026-10-09': 11.76, '2026-10-12': 12.94 };
    const cell = (tag, text) => { const node = document.createElement(tag); node.textContent = text; return node; };
    const themeBody = root.querySelector('[data-era-theme-rows]');
    data.themeDays.forEach((day) => {
      const row = document.createElement('tr');
      [day.date.slice(5), `${day.board}板`, day.phase, String(day.strength), `${day.count}只`, day.note].forEach((value) => row.append(cell('td', value)));
      themeBody.append(row);
    });
    const fillBody = root.querySelector('[data-era-fill-rows]');
    data.fills.forEach((fill) => {
      const row = document.createElement('tr');
      [fill.dt.slice(5), fill.side, fill.price.toFixed(2), `${fill.quantity}股`].forEach((value) => row.append(cell('td', value)));
      fillBody.append(row);
    });
    root.querySelector('[data-era-snapshot]').textContent = `5分K：新浪原始快照 ${data.barsRetrievedAt}，${data.bars.length}根；成交量单位${data.volumeUnit}。${data.timeNote}`;
    if (!window.echarts) throw new Error('图表资源不可用，仍可查看下方证据表。');
    const theme = window.echarts.init(themeNode);
    const stock = window.echarts.init(stockNode);
    const themeDates = data.themeDays.map((day) => day.date);
    theme.setOption({
      animation: false, aria: { enabled: true },
      grid: { left: 58, right: 42, top: 55, bottom: 42 },
      legend: { top: 0, data: ['锂电池强度原值', '锂电池涨停家数'], textStyle: { fontSize: 11 } },
      tooltip: { trigger: 'axis', confine: true },
      xAxis: { type: 'category', data: themeDates, axisLabel: { formatter: (date) => date.slice(5), fontSize: 11 } },
      yAxis: [{ type: 'value', name: '强度原值', nameTextStyle: { fontSize: 10 }, axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { color: '#e2e6eb' } } }, { type: 'value', name: '涨停家数', min: 0, minInterval: 1, nameTextStyle: { fontSize: 10 }, splitLine: { show: false }, axisLabel: { fontSize: 10 } }],
      series: [
        { name: '锂电池强度原值', type: 'line', symbol: 'circle', symbolSize: 8, data: data.themeDays.map((day) => day.strength), itemStyle: { color: '#25749e' }, lineStyle: { width: 2 }, markLine: { silent: true, symbol: 'none', data: [{ yAxis: 0 }], label: { show: false }, lineStyle: { color: '#99a5ae', type: 'dashed' } } },
        { name: '锂电池涨停家数', type: 'bar', yAxisIndex: 1, barMaxWidth: 22, data: data.themeDays.map((day) => day.count), itemStyle: { color: '#c6a04a', opacity: 0.8 }, label: { show: true, position: 'top', fontSize: 11 } }
      ]
    });
    const fillPoints = data.fills.map((fill) => {
      const bar = data.bars.find((bar) => bar.dt >= fill.dt && bar.date === fill.dt.slice(0, 10));
      return { value: [bar.dt, fill.price], fill, symbol: fill.side === '买' ? 'triangle' : 'diamond', itemStyle: { color: fill.side === '买' ? '#b53445' : '#216ea2' } };
    });
    const markerData = data.events.map((event) => ({
      name: event.label, value: event.id === 'buy' ? 'B 买' : 'S 卖', coord: [`${event.date} ${event.barTime}:00`, event.reference],
      itemStyle: { color: event.id === 'buy' ? '#b53445' : '#216ea2' },
      label: { formatter: `${event.id === 'buy' ? 'B 四板上板买' : 'S 六板炸板卖'}\n${event.date.slice(5)} ${event.start}—${event.end}`, position: event.id === 'buy' ? 'right' : 'left', fontSize: 11, lineHeight: 17, color: '#182934', backgroundColor: 'rgba(255,255,255,0.93)', padding: [3, 5], borderRadius: 3 }
    }));
    stock.setOption({
      animation: false, aria: { enabled: true },
      grid: [{ left: 48, right: 12, top: 22, height: '57%' }, { left: 48, right: 12, top: '70%', height: '15%' }],
      tooltip: { trigger: 'axis', confine: true, axisPointer: { type: 'cross' }, formatter: (items) => {
        const price = items.find((item) => item.seriesIndex === 0);
        const bar = data.bars[price?.dataIndex];
        if (!bar) return '';
        const event = data.events.find((event) => bar.dt === `${event.date} ${event.barTime}:00`);
        const fills = actualToggle.checked ? data.fills.filter((fill) => fillPoints.find((point) => point.fill === fill).value[0] === bar.dt) : [];
        return `${bar.dt}<br>开 ${bar.open.toFixed(2)} · 高 ${bar.high.toFixed(2)}<br>低 ${bar.low.toFixed(2)} · 收 ${bar.close.toFixed(2)}<br>成交量 ${(bar.volume / 10000).toFixed(2)}万股${event ? `<br><b>${event.label}（区间）</b><br>${event.referenceBasis}` : ''}${fills.map((fill) => `<br>交割 ${fill.dt.slice(11)} ${fill.side} ${fill.price.toFixed(2)}`).join('')}`;
      } },
      axisPointer: { link: [{ xAxisIndex: [0, 1] }] },
      xAxis: [0, 1].map((gridIndex) => ({ type: 'category', gridIndex, data: dates, boundaryGap: true, axisLabel: { show: gridIndex === 1, fontSize: 10, hideOverlap: true, formatter: (date) => `${date.slice(5, 10)}\n${date.slice(11, 16)}` }, axisLine: { lineStyle: { color: '#8594a1' } } })),
      yAxis: [{ scale: true, splitNumber: 4, axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { color: '#e4e8ed' } } }, { gridIndex: 1, scale: true, splitNumber: 2, axisLabel: { fontSize: 10, formatter: (value) => `${Math.round(value / 10000)}万` }, splitLine: { show: false } }],
      dataZoom: [{ type: 'inside', xAxisIndex: [0, 1] }, { type: 'slider', xAxisIndex: [0, 1], bottom: 0, height: 22, showDataShadow: false }],
      series: [
        { name: '时代万恒5分K', type: 'candlestick', data: data.bars.map((bar) => [bar.open, bar.close, bar.low, bar.high]), itemStyle: { color: '#c94450', color0: '#168361', borderColor: '#c94450', borderColor0: '#168361' }, markPoint: { symbol: 'pin', symbolSize: 32, data: markerData }, markLine: { silent: true, symbol: 'none', data: ['2026-10-09 09:35:00', '2026-10-12 09:35:00'].map((xAxis) => ({ xAxis })), label: { show: false }, lineStyle: { color: '#b2bdc6', type: 'dotted' } } },
        { name: '成交量（股）', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: data.bars.map((bar) => ({ value: bar.volume, itemStyle: { color: bar.close >= bar.open ? '#c94450' : '#168361' } })) },
        { name: '当日涨停价参考', type: 'line', data: data.bars.map((bar) => limits[bar.date]), symbol: 'none', lineStyle: { color: '#9b9294', type: 'dashed', width: 1 }, silent: true },
        { name: '实际交割', type: 'scatter', data: fillPoints, symbolSize: 10, z: 6 }
      ]
    });
    actualToggle.addEventListener('change', () => stock.setOption({ series: [{}, {}, {}, { data: actualToggle.checked ? fillPoints : [] }] }));
    const buttons = [...root.querySelectorAll('[data-era-range]')];
    const selectRange = (key) => {
      let indices = data.bars.map((_, index) => index);
      if (key !== 'all') indices = indices.filter((index) => data.bars[index].date === (key === 'break' ? '2026-10-12' : key));
      if (key === 'break') indices = indices.filter((index) => data.bars[index].time >= '10:15' && data.bars[index].time <= '10:45');
      stock.dispatchAction({ type: 'dataZoom', startValue: indices[0], endValue: indices[indices.length - 1] });
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.eraRange === key)));
      const day = data.themeDays.find((day) => day.date === key || key === 'break' && day.date === '2026-10-12');
      status.textContent = day ? `${day.date} · ${day.board}板 · ${day.phase} · 题材强度 ${day.strength} · 涨停 ${day.count}只` : '10.08四板 → 10.09五板 → 10.12六板 · B/S为模式事件，三角与菱形为实际交割';
    };
    buttons.forEach((button) => button.addEventListener('click', () => selectRange(button.dataset.eraRange)));
    theme.on('click', (event) => {
      if (event.componentType === 'series') {
        const date = themeDates[event.dataIndex];
        if (data.bars.some((bar) => bar.date === date)) selectRange(date);
        else status.textContent = `${date}为前段题材证据；5分K快照从四板10月8日开始，未补造前段K线。`;
      }
    });
    selectRange('all');
    const resize = () => { theme.resize(); stock.resize(); };
    if (window.ResizeObserver) new ResizeObserver(resize).observe(root);
    else window.addEventListener('resize', resize);
  };
  const begin = () => load().catch((error) => { status.textContent = `复盘图未加载：${error.message}。可打开原始数据或周报核对。`; });
  if (window.IntersectionObserver) {
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); begin(); } }, { rootMargin: '400px' });
    observer.observe(root);
  } else begin();
})();
