(() => {
  const data = window.M10_AGRICULTURE_KLINE;
  if (!data) return;
  const phases = [
    ["全部", "2026-08-10", "2026-09-23"],
    ["首轮铺垫", "2026-08-17", "2026-08-21"],
    ["第一补涨", "2026-08-24", "2026-09-03"],
    ["第二补涨", "2026-09-04", "2026-09-11"],
    ["末尾穿越 · 只观察", "2026-09-14", "2026-09-23"]
  ];
  const notes = [
    ["2026-08-24", "修复观察", "首轮断板后先核验承接；修复不自动等于二波买点。"],
    ["2026-08-25", "总龙修复／万向首板", "金健收盘尚未突破首轮最高价，不能只凭涨停确认二波。"],
    ["2026-08-26", "二波候选／万向二板", "金健日K价格条件可作事后筛查；题材原记仍偏弱，尾盘、量能、补涨反馈与监管空间须另外核验。"],
    ["2026-08-27", "万向三板观察", "万向三板缩量确认是补涨模式观察日；金健反包与题材回暖同看，不把事后收盘当实际成交。"],
    ["2026-08-28", "万向四板／农业回流", "按最新补涨三板模式，四板板上是主要退出窗口。万向低量一字表现不能作为排队买入理由。"],
    ["2026-08-31", "万向五板", "补涨三板→四板计划与历史持有到更高板的推演分开，不用后续上涨改写前一天卖点。"],
    ["2026-09-01", "总龙与补涨强回流", "核对两者同步与后排反馈；不是错过二波尾盘窗口后的自动补买日。"],
    ["2026-09-02", "大分歧／爆量", "金健收盘跌幅超过5%；按既有总龙退出规则复核。万向爆量与板块负反馈一起看。"],
    ["2026-09-04", "亚盛二板", "第二补涨候选出现，重新看总龙趋势与板块再发酵，而非机械复用第一轮买点。"],
    ["2026-09-07", "亚盛三板／总龙反包", "亚盛日K为一字，不能据日K假定三板有可成交买点；没机会不强制切仓。"],
    ["2026-09-08", "亚盛四板", "若此前确有合规三板成交，按四板板上兑现预案；没有持仓不改为排一字。"],
    ["2026-09-10", "后排深水", "板块结束信号与总龙趋势共同核验；不只盯一个高标。"],
    ["2026-09-11", "原记板块效应结束", "总龙退出、补涨也退出；准备进入只观察的末尾孤立穿越。"]
  ];
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const price = (day) => day ? `${day.close.toFixed(2)} / ${day.pct >= 0 ? "+" : ""}${day.pct.toFixed(2)}%` : "缺数据";
  const peak = Math.max(...data.stocks[0].days.filter((day) => day.date >= "2026-08-17" && day.date <= "2026-08-21").map((day) => day.high));

  document.querySelectorAll("[data-agriculture-replay]").forEach((root) => {
    root.classList.add("agri-replay");
    root.append(element("h3", "农业联动复盘：金健米业 × 万向德农 × 亚盛集团"));
    root.append(element("p", "总龙二波、第一补涨、第二补涨按同一交易日对照。下方日K是不复权价格，量柱为成交量（手）；角色和阶段来自本人复盘，不代表实际交易记录。", "agri-source"));
    const range = element("div", "", "agri-range");
    range.setAttribute("role", "group");
    range.setAttribute("aria-label", "农业复盘日期范围");
    const selections = [];
    const charts = [];
    const dates = data.stocks[0].days.map((day) => day.date);
    let activePhase = phases[0];

    const updateSelection = (date) => {
      data.stocks.forEach((stock, index) => {
        const day = stock.days.find((item) => item.date === date);
        selections[index].textContent = day ? `${date}　收盘 ${price(day)}　成交额 ${(day.amount / 1e8).toFixed(2)}亿　换手 ${day.turnover.toFixed(2)}%` : `${date} 缺数据`;
      });
    };
    const setRange = (phase) => {
      activePhase = phase;
      const start = dates.indexOf(phase[1]);
      const end = dates.indexOf(phase[2]);
      charts.forEach((chart) => chart.dispatchAction({ type: "dataZoom", startValue: start, endValue: end }));
      [...range.children].forEach((button, index) => button.setAttribute("aria-pressed", String(phases[index] === phase)));
    };
    phases.forEach((phase, index) => {
      const button = element("button", phase[0]);
      button.type = "button";
      button.setAttribute("aria-pressed", String(index === 0));
      button.addEventListener("click", () => setRange(phase));
      range.append(button);
    });
    root.append(range);
    const chartNodes = data.stocks.map((stock, index) => {
      const section = element("section", "", "agri-stock");
      section.append(element("h4", `${stock.name} ${stock.code} · ${stock.role}`));
      const selection = element("p", "", "agri-selection");
      selection.setAttribute("role", "status");
      selections.push(selection);
      const canvas = element("div", "", "agri-chart");
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", `${stock.name} 2026年8月10日至9月23日不复权日K与成交量，数据另见下方日期表`);
      section.append(selection, canvas);
      root.append(section);
      return canvas;
    });
    updateSelection("2026-08-27");

    const initCharts = () => {
      if (!window.echarts) {
        chartNodes.forEach((node) => { node.textContent = "图表资源未加载，仍可查看下方日K数据对照。"; });
        return;
      }
      data.stocks.forEach((stock, index) => {
        const chart = window.echarts.init(chartNodes[index]);
        const byDate = new Map(stock.days.map((day) => [day.date, day]));
        chart.setOption({
          animation: false,
          aria: { enabled: true },
          grid: [{ left: 52, right: 18, top: 10, height: 155 }, { left: 52, right: 18, top: 185, height: 52 }],
          tooltip: { trigger: "axis", axisPointer: { type: "cross" }, confine: true },
          axisPointer: { link: [{ xAxisIndex: "all" }] },
          xAxis: [0, 1].map((gridIndex) => ({ type: "category", data: dates, gridIndex, boundaryGap: true, axisLabel: { show: gridIndex === 1, formatter: (date) => date.slice(5) }, axisLine: { lineStyle: { color: "#8b9dab" } } })),
          yAxis: [{ scale: true, splitLine: { lineStyle: { color: "#e3e9ef" } } }, { gridIndex: 1, scale: true, splitNumber: 2, axisLabel: { formatter: (value) => `${(value / 10000).toFixed(0)}万` }, splitLine: { show: false } }],
          dataZoom: [{ type: "inside", xAxisIndex: [0, 1] }, { type: "slider", xAxisIndex: [0, 1], bottom: 3, height: 20, borderColor: "#d9e1e7", showDataShadow: false }],
          series: [
            { name: "价格（开、收、低、高）", type: "candlestick", data: dates.map((date) => { const day = byDate.get(date); return day ? [day.open, day.close, day.low, day.high] : ["-", "-", "-", "-"]; }), itemStyle: { color: "#d84450", color0: "#16825f", borderColor: "#d84450", borderColor0: "#16825f" } },
            { name: "成交量（手）", type: "bar", xAxisIndex: 1, yAxisIndex: 1, data: dates.map((date) => { const day = byDate.get(date); return day ? { value: day.volume, itemStyle: { color: day.close >= day.open ? "#d84450" : "#16825f" } } : "-"; }) }
          ]
        });
        chart.on("updateAxisPointer", (event) => {
          const date = dates[event.axesInfo?.[0]?.value];
          if (date) updateSelection(date);
        });
        charts.push(chart);
      });
      window.echarts.connect(charts);
      setRange(activePhase);
      const resize = () => charts.forEach((chart) => chart.resize());
      if (window.ResizeObserver) new ResizeObserver(resize).observe(root);
      else window.addEventListener("resize", resize);
    };
    if (window.IntersectionObserver) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); initCharts(); }
      }, { rootMargin: "300px" });
      observer.observe(root);
    } else initCharts();

    const wrap = element("div", "", "agri-table-wrap");
    wrap.tabIndex = 0;
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "农业关键日期对照表");
    const table = element("table", "", "agri-table");
    table.append(element("caption", "关键日期：日K事实与模式复核分开"));
    const head = element("thead");
    const headings = element("tr");
    ["日期／原记阶段", "金健收盘／涨幅", "万向收盘／涨幅", "亚盛收盘／涨幅", "按最新规则复核"].forEach((title) => { const th = element("th", title); th.scope = "col"; headings.append(th); });
    head.append(headings);
    const body = element("tbody");
    notes.forEach(([date, label, note]) => {
      const row = element("tr");
      row.append(element("td", `${date.slice(5)} · ${label}`));
      data.stocks.forEach((stock) => row.append(element("td", price(stock.days.find((day) => day.date === date)))));
      row.append(element("td", note));
      body.append(row);
    });
    table.append(head, body);
    wrap.append(table);
    root.append(wrap);
    root.append(element("p", `日K复核：首轮8/17—8/21金健最高价为${peak.toFixed(2)}元。8/26收盘9.80元、相对昨收+5.26%，满足日K事后价格筛查；这不能证明最后三分钟仍满足联合触发、量能及监管前提，也不能据此确认真实可成交买点。8/27万向三板→8/28四板是最新模式的观察与兑现配对；9/7亚盛三板为一字，不能假定可以买到。`, "agri-evidence"));
    root.append(element("p", "角色、强弱节奏与板数来自本人原记；行情为独立接口快照。原记与日K不一致时保留差异，不回改历史，不把本表当实际交易或完整回测。现有周期库全周期标准卖点与补涨三板→四板的专项计划不同，按模式分别看。", "agri-source"));
    const source = element("p", `${data.provider} · ${data.adjustment} · 获取时间 ${data.retrievedAt} · `, "agri-source");
    data.stocks.forEach((stock) => { const link = element("a", `${stock.name}数据 `); link.href = stock.url; link.target = "_blank"; link.rel = "noopener"; source.append(link); });
    root.append(source);
  });
})();
