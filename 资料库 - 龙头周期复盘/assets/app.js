(function () {
  const archive = window.LEADER_CYCLE_ARCHIVE || { cycles: [] };
  const dailyLimitUps = window.LEADER_CYCLE_DAILY_LIMIT_UPS || { cycles: {} };
  const leaderVolume = window.LEADER_CYCLE_VOLUME_ANALYSIS || { cycles: {}, findings: [], stats: {} };
  const cycles = getChronologicalCycles(archive.cycles || []);

  const els = {
    cycleCount: document.getElementById("cycle-count"),
    dayCount: document.getElementById("day-count"),
    latestRange: document.getElementById("latest-range"),
    cycleList: document.getElementById("cycle-list"),
    search: document.getElementById("cycle-search"),
    status: document.getElementById("cycle-status"),
    range: document.getElementById("cycle-range"),
    sector: document.getElementById("cycle-sector"),
    title: document.getElementById("cycle-title"),
    focus: document.querySelector(".cycle-focus"),
    agricultureMode: document.getElementById("agriculture-mode-check"),
    oneLine: document.getElementById("cycle-one-line"),
    metrics: document.getElementById("metric-strip"),
    phaseLine: document.getElementById("phase-line"),
    limitSummary: document.getElementById("limit-summary"),
    limitSource: document.getElementById("limit-source"),
    limitTape: document.getElementById("limit-tape"),
    dayGrid: document.getElementById("day-grid"),
    copy: document.getElementById("copy-markdown"),
    sourceNote: document.getElementById("source-note"),
    patternThesis: document.getElementById("pattern-thesis"),
    ruleGrid: document.getElementById("rule-grid"),
    strengthSystem: document.getElementById("strength-system"),
    volumeStats: document.getElementById("volume-stats"),
    volumeFindings: document.getElementById("volume-findings"),
    volumeTableBody: document.getElementById("volume-table-body"),
    volumeMethod: document.getElementById("volume-method"),
    boardVolumeStats: document.getElementById("board-volume-stats"),
    boardVolumeFindings: document.getElementById("board-volume-findings"),
    boardVolumeRules: document.getElementById("board-volume-rules"),
    boardVolumeCombinations: document.getElementById("board-volume-combinations"),
    boardVolumeCycleList: document.getElementById("board-volume-cycle-list"),
    boardVolumeMethod: document.getElementById("board-volume-method"),
    expandBoardVolume: document.getElementById("expand-board-volume"),
    collapseBoardVolume: document.getElementById("collapse-board-volume"),
    tradeStats: document.getElementById("trade-stats"),
    tradeLogic: document.getElementById("trade-logic"),
    tradeTableBody: document.getElementById("trade-table-body"),
    cycleMapTitle: document.getElementById("cycle-map-title"),
    cycleMapMeta: document.getElementById("cycle-map-meta"),
    cycleMapCards: document.getElementById("cycle-map-cards"),
    cycleMapRhythm: document.getElementById("cycle-map-rhythm"),
    cycleMapBars: document.getElementById("cycle-map-bars")
  };

  const state = {
    selectedId: getInitialCycleId(),
    query: "",
    view: "expanded"
  };

  function parseDateValue(value, fallbackYear = 2026) {
    const text = String(value || "");
    const full = text.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (full) {
      return new Date(Number(full[1]), Number(full[2]) - 1, Number(full[3])).getTime();
    }

    const short = text.match(/(\d{1,2})[/-](\d{1,2})/);
    if (short) {
      return new Date(fallbackYear, Number(short[1]) - 1, Number(short[2])).getTime();
    }

    return Number.MAX_SAFE_INTEGER;
  }

  function getCycleYear(cycle) {
    const text = cycle.dateRange || cycle.records?.[0]?.date || "";
    const match = String(text).match(/(\d{4})/);
    return match ? Number(match[1]) : 2026;
  }

  function getChronologicalCycles(sourceCycles) {
    return sourceCycles
      .map((cycle) => {
        const year = getCycleYear(cycle);
        return {
          ...cycle,
          records: [...(cycle.records || [])].sort((a, b) => parseDateValue(a.date, year) - parseDateValue(b.date, year)),
          phaseLine: [...(cycle.phaseLine || [])].sort((a, b) => parseDateValue(a.date, year) - parseDateValue(b.date, year)),
          limitBoard: cycle.limitBoard
            ? {
                ...cycle.limitBoard,
                items: [...(cycle.limitBoard.items || [])].sort(
                  (a, b) => parseDateValue(a.date, year) - parseDateValue(b.date, year)
                )
              }
            : cycle.limitBoard
        };
      })
      .sort((a, b) => {
        const aStart = parseDateValue(a.dateRange || a.records?.[0]?.date, getCycleYear(a));
        const bStart = parseDateValue(b.dateRange || b.records?.[0]?.date, getCycleYear(b));
        return aStart - bStart;
      });
  }

  function getInitialCycleId() {
    const hashId = decodeURIComponent(window.location.hash.replace("#", ""));
    if (cycles.some((cycle) => cycle.id === hashId)) return hashId;
    return cycles[0] ? cycles[0].id : "";
  }

  function getSelectedCycle() {
    return cycles.find((cycle) => cycle.id === state.selectedId) || cycles[0] || null;
  }

  function getCycleCombination(cycle) {
    return (leaderVolume.boardVolumeCombinations || []).find((item) =>
      (item.cycles || []).some((sample) => sample.id === cycle.id)
    );
  }

  function getCycleCombinationSample(cycle) {
    const combination = getCycleCombination(cycle);
    return (combination?.cycles || []).find((sample) => sample.id === cycle.id) || null;
  }

  function setText(node, value) {
    if (node) node.textContent = value || "";
  }

  function createElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function getFilteredCycles() {
    const query = state.query.trim().toLowerCase();
    if (!query) return cycles;
    return cycles.filter((cycle) => {
      const haystack = [
        cycle.name,
        cycle.leader,
        cycle.code,
        cycle.sector,
        cycle.theme,
        cycle.dateRange,
        cycle.rhythm,
        ...(cycle.tags || []),
        ...(leaderVolume.cycles?.[cycle.id]?.events || []).map(
          (event) => `${event.displayDate} ${event.kind} ${event.phase} ${event.board} ${event.amountYi}亿 ${event.turnover}% ${event.note}`
        ),
        ...Object.values(leaderVolume.cycles?.[cycle.id]?.tradePlan || {})
          .flatMap((signal) => {
            if (!signal) return [];
            if (signal.watch || signal.delayedSell) return [signal.watch, signal.delayedSell].filter(Boolean);
            return [signal];
          })
          .map((signal) => `${signal.displayDate || ""} ${signal.title || ""} ${signal.note || ""}`),
        ...getCycleDailyLimitUps(cycle).flatMap((daily) => [
          daily.plate,
          daily.catalyst,
          ...(daily.stocks || []).map((stock) =>
            `${stock.name} ${stock.code} ${stock.board} ${stock.type} ${stock.firstSeal} ${stock.lastSeal} ${stock.reason}`
          )
        ])
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  function renderOverview() {
    const selected = getSelectedCycle();
    const totalDays = cycles.reduce((sum, cycle) => sum + (cycle.tradingDays || cycle.records?.length || 0), 0);
    setText(els.cycleCount, String(cycles.length));
    setText(els.dayCount, String(totalDays));
    setText(els.latestRange, selected ? selected.dateRange : "");

    const source = selected?.source || archive.source;
    if (source && els.sourceNote) {
      setText(els.sourceNote, `${source.file} / ${source.sheet}!${source.range}`);
    }
  }

  function renderCycleList() {
    if (!els.cycleList) return;
    els.cycleList.innerHTML = "";

    const filtered = getFilteredCycles();
    if (!filtered.length) {
      els.cycleList.appendChild(createElement("div", "empty-state", "没有匹配的周期。"));
      return;
    }

    filtered.forEach((cycle) => {
      const button = createElement("button", "cycle-item");
      button.type = "button";
      button.dataset.id = cycle.id;
      button.setAttribute("aria-pressed", String(cycle.id === state.selectedId));
      if (cycle.id === state.selectedId) button.classList.add("is-active");

      const title = createElement("strong", "", cycle.name);
      const detail = createElement("span", "", `${cycle.dateRange} / ${cycle.sector}`);
      const combination = getCycleCombination(cycle);
      if (combination) {
        button.append(title, detail, createElement("em", "cycle-item-combo", `${combination.code} · ${combination.name}`));
      } else {
        button.append(title, detail);
      }
      button.addEventListener("click", () => {
        state.selectedId = cycle.id;
        history.replaceState(null, "", `#${encodeURIComponent(cycle.id)}`);
        render();
      });

      els.cycleList.appendChild(button);
    });
  }

  function renderCycleFocus(cycle) {
    if (!cycle) return;
    if (els.focus) els.focus.id = cycle.id;
    const isAgriculture = cycle.id === "wanxiang-agri-2026-09";
    if (els.agricultureMode) els.agricultureMode.hidden = !isAgriculture;
    setText(els.status, cycle.status);
    setText(els.range, cycle.dateRange);
    setText(els.sector, `${cycle.sector} / ${cycle.theme}`);
    setText(els.title, cycle.name);
    setText(els.oneLine, cycle.oneLine);

    const analysis = leaderVolume.cycles?.[cycle.id] || {};
    const combination = getCycleCombination(cycle);
    const plan = analysis.tradePlan || {};
    const metrics = [
      ["龙头", `${cycle.leader}${cycle.code ? ` ${cycle.code}` : ""}`],
      ["时间周期", cycle.dateRange],
      ["量能类型", combination ? `${combination.code} · ${combination.name}` : "待归类"],
      ["标准买点", plan.standardBuy ? `${plan.standardBuy.displayDate} ${plan.standardBuy.title}` : "待复核"],
      [isAgriculture ? "全周期风险卖点" : "风险卖点", plan.standardSell ? `${plan.standardSell.displayDate} ${plan.standardSell.title}` : "待复核"]
    ];

    els.metrics.innerHTML = "";
    metrics.forEach(([label, value]) => {
      const item = createElement("div", "metric");
      item.append(createElement("b", "", label), createElement("span", "", value));
      els.metrics.appendChild(item);
    });
  }

  function renderCycleMap(cycle) {
    if (!els.cycleMapCards) return;
    const analysis = leaderVolume.cycles?.[cycle.id] || {};
    const combination = getCycleCombination(cycle);
    const sample = getCycleCombinationSample(cycle);
    const boardVolume = analysis.boardVolume;
    const firstEvent = (analysis.events || []).find((event) => event.firstExchange) || (analysis.events || [])[0];
    const plan = analysis.tradePlan || {};

    setText(els.cycleMapTitle, cycle.name);
    setText(els.cycleMapMeta, `${cycle.leader}${cycle.code ? ` ${cycle.code}` : ""} / ${cycle.sector} / ${cycle.dateRange}`);
    setText(els.cycleMapRhythm, cycle.rhythm);

    els.cycleMapCards.innerHTML = "";
    [
      {
        label: "量能类型",
        title: combination ? `${combination.code} · ${combination.name}` : "待归类",
        text: sample?.note || combination?.sequence || "等待更多周期样本。"
      },
      {
        label: "关键爆量",
        title: firstEvent ? `${firstEvent.displayDate} ${firstEvent.kind}` : "待复核",
        text: firstEvent ? `${firstEvent.board} / 成交 ${firstEvent.amountYi} 亿 / 换手 ${firstEvent.turnover}%` : "暂无关键爆量节点。"
      },
      {
        label: "标准买点",
        title: plan.standardBuy ? `${plan.standardBuy.displayDate} ${plan.standardBuy.title}` : "待复核",
        text: plan.standardBuy?.note || "等待缩量转强与题材回流共振。"
      },
      {
        label: "风险卖点",
        title: plan.standardSell ? `${plan.standardSell.displayDate} ${plan.standardSell.title}` : "待复核",
        text: plan.standardSell?.note || "重点看高位炸板爆量和监管红线。"
      }
    ].forEach((item) => {
      const card = createElement("section", "cycle-map-card");
      card.append(
        createElement("span", "", item.label),
        createElement("strong", "", item.title),
        createElement("p", "", item.text)
      );
      els.cycleMapCards.appendChild(card);
    });

    els.cycleMapBars.innerHTML = "";
    if (boardVolume?.days?.length) {
      els.cycleMapBars.appendChild(makeBoardVolumeBars(boardVolume));
    }
  }

  function renderPhaseLine(cycle) {
    els.phaseLine.innerHTML = "";
    cycle.phaseLine.forEach((phase, index) => {
      const item = createElement("li", "phase");
      item.dataset.step = String(index + 1).padStart(2, "0");
      item.dataset.tone = phase.tone || "neutral";
      item.append(
        createElement("time", "", phase.date),
        createElement("h4", "", phase.title),
        createElement("p", "", phase.note)
      );
      els.phaseLine.appendChild(item);
    });
  }

  function renderLimitBoard(cycle) {
    if (!els.limitTape) return;
    const data = cycle.limitBoard;
    els.limitTape.innerHTML = "";

    if (!data || !data.items?.length) {
      setText(els.limitSummary, "暂无短线侠连板数据。");
      setText(els.limitSource, "");
      els.limitTape.appendChild(createElement("div", "empty-state", "后续补入短线侠天梯或涨停池记录。"));
      return;
    }

    setText(els.limitSummary, data.summary || "");
    els.limitSource.innerHTML = "";
    const sourceText = `${data.sourceName || "短线侠连板天梯"} / ${data.range || cycle.dateRange}`;
    if (data.sourceUrl) {
      const link = createElement("a", "", sourceText);
      link.href = data.sourceUrl;
      link.target = "_blank";
      link.rel = "noreferrer";
      els.limitSource.appendChild(link);
    } else {
      els.limitSource.appendChild(createElement("span", "", sourceText));
    }
    if (data.sourceNote) {
      els.limitSource.appendChild(createElement("span", "", data.sourceNote));
    }

    data.items.forEach((item, index) => {
      const chip = createElement("article", "limit-chip");
      chip.dataset.status = item.statusTone || item.tone || "neutral";
      chip.dataset.step = String(index + 1).padStart(2, "0");
      chip.append(
        createElement("time", "", item.date),
        createElement("strong", "", item.board),
        createElement("span", "limit-status", item.status || ""),
        createElement("p", "", item.note || "")
      );
      els.limitTape.appendChild(chip);
    });
  }

  function renderPatterns() {
    if (!els.ruleGrid) return;
    const patterns = archive.patterns || {};
    setText(els.patternThesis, patterns.thesis || "");
    els.ruleGrid.innerHTML = "";
    (patterns.rules || []).forEach((rule) => {
      const card = createElement("article", "rule-card");
      card.append(createElement("b", "", rule.title), createElement("p", "", rule.text));
      els.ruleGrid.appendChild(card);
    });

    if (!els.strengthSystem) return;
    els.strengthSystem.innerHTML = "";
    if (!patterns.strengthSystem && !(patterns.strengthCombos || []).length) return;

    const header = createElement("div", "strength-system-head");
    header.append(
      createElement("h3", "", patterns.strengthSystem?.title || "题材强度排列组合"),
      createElement("p", "", patterns.strengthSystem?.summary || "")
    );

    const levels = createElement("div", "strength-levels");
    (patterns.strengthSystem?.levels || []).forEach((level) => {
      const item = createElement("article", "strength-level");
      item.append(
        createElement("b", "", level.name),
        createElement("span", "", level.signal),
        createElement("p", "", level.meaning)
      );
      levels.appendChild(item);
    });

    const combos = createElement("div", "strength-combos");
    (patterns.strengthCombos || []).forEach((combo) => {
      const item = createElement("article", "strength-combo");
      item.dataset.code = combo.code || "";
      item.append(
        createElement("span", "strength-combo-code", combo.code || ""),
        createElement("h4", "", combo.title),
        createElement("p", "strength-combo-sequence", combo.sequence),
        createElement("p", "strength-combo-conclusion", combo.conclusion),
        createElement("p", "strength-combo-watch", combo.watch),
        createElement("small", "", `案例：${combo.examples}`)
      );
      combos.appendChild(item);
    });

    const longCombos = createElement("section", "strength-long");
    if ((patterns.strengthLongCombos || []).length) {
      const longHead = createElement("div", "strength-long-head");
      longHead.append(
        createElement("h3", "", "长周期强度路径"),
        createElement("p", "", "每条路径至少 6 个连续节点，用来看一个题材从启动、确认、分歧、回流到尾部的完整走法。")
      );

      const longList = createElement("div", "strength-long-list");
      (patterns.strengthLongCombos || []).forEach((combo) => {
        const item = createElement("article", "strength-long-combo");
        const chain = createElement("ol", "strength-long-chain");
        (combo.sequence || []).forEach((step, index) => {
          const node = document.createElement("li");
          node.append(
            createElement("span", "", String(index + 1).padStart(2, "0")),
            createElement("b", "", step)
          );
          chain.appendChild(node);
        });

        const caseTracks = createElement("div", "strength-case-tracks");
        const caseCaption = createElement("div", "strength-case-caption");
        caseCaption.append(
          createElement("b", "", "案例对应"),
          createElement("span", "", "龙头板位 × 题材阶段 × 涨停家数")
        );
        caseTracks.appendChild(caseCaption);

        String(combo.examples || "")
          .split(/[，,、]/)
          .map((name) => name.trim())
          .filter(Boolean)
          .forEach((leaderName) => {
            const cycle = cycles.find((sample) => sample.leader === leaderName);
            if (!cycle) return;

            const caseCycle = createElement("section", "strength-case-cycle");
            const caseHead = createElement("header", "strength-case-head");
            caseHead.append(
              createElement("strong", "", cycle.leader),
              createElement("span", "", `${cycle.sector} · ${cycle.dateRange}`)
            );

            const caseChain = createElement("ol", "strength-case-chain");
            (cycle.records || []).forEach((record, index) => {
              const boardRecord = (cycle.limitBoard?.items || []).find((item) => item.date === record.date);
              const dailyLimitUp = dailyLimitUps.cycles?.[cycle.id]?.records?.[record.date];
              const board = boardRecord?.board || record.board || "—";
              const rhythm =
                record.intensity && !String(record.phase || "").includes(record.intensity)
                  ? `${record.phase} - ${record.intensity}`
                  : record.phase || record.intensity || "待确认";
              const node = document.createElement("li");
              node.dataset.direction = record.direction || "neutral";
              node.append(
                createElement("span", "strength-case-index", String(index + 1).padStart(2, "0")),
                createElement("b", "", `${cycle.leader} ${board}`)
              );

              const context = createElement("small", "strength-case-context");
              context.append(
                createElement("em", "", cycle.sector),
                createElement("span", "", rhythm)
              );
              if (Number.isFinite(dailyLimitUp?.count)) {
                context.append(
                  createElement("span", "strength-case-limit-count", `涨停 ${dailyLimitUp.count}家`)
                );
              }
              node.appendChild(context);
              caseChain.appendChild(node);
            });

            caseCycle.append(caseHead, caseChain);
            caseTracks.appendChild(caseCycle);
          });

        item.append(
          createElement("span", "strength-long-code", combo.code || ""),
          createElement("h4", "", combo.title),
          chain,
          createElement("p", "strength-long-conclusion", combo.conclusion),
          createElement("p", "strength-long-use", combo.use),
          caseTracks
        );
        longList.appendChild(item);
      });

      longCombos.append(longHead, longList);
    }

    els.strengthSystem.append(header, levels, combos);
    if (longCombos.childElementCount) els.strengthSystem.appendChild(longCombos);
  }

  function renderVolumeStudy() {
    if (!els.volumeTableBody) return;
    const stats = leaderVolume.stats || {};
    const statItems = [
      [String(stats.cycleCount || cycles.length), "周期样本"],
      [`${stats.contractionCount || 0}/${stats.cycleCount || cycles.length}`, "首爆后缩量"],
      [`${stats.terminalLastTwoCount || 0}/${stats.completedCount || 0}`, "终局在末两日"]
    ];

    els.volumeStats.innerHTML = "";
    statItems.forEach(([value, label]) => {
      const item = createElement("div", "volume-stat");
      item.append(createElement("strong", "", value), createElement("span", "", label));
      els.volumeStats.appendChild(item);
    });

    els.volumeFindings.innerHTML = "";
    (leaderVolume.findings || []).forEach((finding, index) => {
      const item = createElement("article", "volume-finding");
      item.dataset.step = String(index + 1).padStart(2, "0");
      item.append(createElement("strong", "", finding.title), createElement("p", "", finding.text));
      els.volumeFindings.appendChild(item);
    });

    els.volumeTableBody.innerHTML = "";
    cycles.forEach((cycle) => {
      const analysis = leaderVolume.cycles?.[cycle.id];
      if (!analysis) return;
      const row = document.createElement("tr");
      const identity = document.createElement("th");
      identity.scope = "row";
      identity.append(
        createElement("strong", "volume-cycle-name", cycle.name),
        createElement("span", "volume-cycle-meta", `${cycle.sector} / ${cycle.dateRange}`)
      );

      const eventsCell = document.createElement("td");
      eventsCell.dataset.label = "关键爆量时间点";
      const eventList = createElement("div", "volume-event-list");
      (analysis.events || []).forEach((event) => eventList.appendChild(makeVolumeEvent(event)));
      eventsCell.appendChild(eventList);

      const postCell = document.createElement("td");
      postCell.dataset.label = "窗口后验证";
      postCell.appendChild(makePostWindow(analysis.postWindow));
      row.append(identity, eventsCell, postCell);
      els.volumeTableBody.appendChild(row);
    });

    els.volumeMethod.innerHTML = "";
    els.volumeMethod.append(document.createTextNode(`${leaderVolume.method || ""} 数据源：`));
    const marketLink = createElement("a", "", leaderVolume.source?.marketName || "东方财富历史日K");
    marketLink.href = leaderVolume.source?.marketUrl || "https://quote.eastmoney.com/center/";
    marketLink.target = "_blank";
    marketLink.rel = "noreferrer";
    const shortxLink = createElement("a", "", leaderVolume.source?.shortxName || "短线侠每日复盘");
    shortxLink.href = leaderVolume.source?.shortxUrl || "http://duanxianxia.cn/web/fupan/";
    shortxLink.target = "_blank";
    shortxLink.rel = "noreferrer";
    els.volumeMethod.append(marketLink, document.createTextNode("、"), shortxLink, document.createTextNode("。"));
  }

  function makeVolumeEvent(event) {
    const item = createElement("article", "volume-event");
    if (event.firstExchange) item.dataset.role = "first";
    if (event.terminal) item.dataset.role = "terminal";
    if (event.relation !== "周期内") item.dataset.relation = event.relation;

    const head = createElement("div", "volume-event-head");
    head.append(
      createElement("time", "", event.displayDate),
      createElement("span", "volume-event-kind", event.kind),
      createElement("span", "volume-event-board", event.board || "-")
    );
    const metrics = createElement("p", "volume-event-metrics");
    metrics.textContent = `成交 ${event.amountYi} 亿 / 换手 ${event.turnover}% / 较前日 ${event.previousRatio}x`;
    const context = createElement("p", "volume-event-context");
    const seal = event.firstSeal && event.firstSeal !== "-"
      ? ` / 封板 ${event.firstSeal}-${event.lastSeal}${event.openCount !== "-" ? ` / 开板 ${event.openCount}次` : ""}`
      : " / 当日未封板";
    context.textContent = `${event.phase} / ${event.type}${seal}`;
    item.append(head, metrics, context, createElement("p", "volume-event-note", event.note));
    return item;
  }

  function makePostWindow(postWindow) {
    if (!postWindow) return createElement("span", "empty-state compact-empty", "暂无窗口后数据");
    const item = createElement("div", "volume-post");
    item.dataset.tone = postWindow.pct >= 9.5 ? "up" : postWindow.pct <= -9.5 ? "down" : "neutral";
    item.append(
      createElement("time", "", postWindow.displayDate),
      createElement("strong", "", `${postWindow.pct > 0 ? "+" : ""}${postWindow.pct}%`),
      createElement("span", "", `${postWindow.amountYi} 亿 / 换手 ${postWindow.turnover}%`)
    );
    return item;
  }

  function getVolumeStateKey(state) {
    return {
      "缩量": "shrink",
      "起量": "rising",
      "半放量": "half",
      "全放量": "full"
    }[state] || "neutral";
  }

  function renderBoardVolumeStudy() {
    if (!els.boardVolumeCycleList) return;
    const stats = leaderVolume.boardVolumeStats || {};
    const statItems = [
      [String(stats.boardDayCount || 0), "成功连板日"],
      [`${stats.averageTwoFullVolumeCount || 0}/${stats.cycleCount || cycles.length}`, "均量两次全放"],
      [`${stats.averageFirstFullResetCount || 0}/${stats.cycleCount || cycles.length}`, "首放后量能重置"],
      [`${stats.terminalAverageMultiple || 0}x`, "终结日均量倍数"]
    ];

    els.boardVolumeStats.innerHTML = "";
    statItems.forEach(([value, label]) => {
      const item = createElement("div", "board-volume-stat");
      item.append(createElement("strong", "", value), createElement("span", "", label));
      els.boardVolumeStats.appendChild(item);
    });

    renderBoardVolumePlaybook();

    els.boardVolumeFindings.innerHTML = "";
    (leaderVolume.boardVolumeFindings || []).forEach((finding, index) => {
      const item = createElement("article", "board-volume-finding");
      item.dataset.step = String(index + 1).padStart(2, "0");
      item.append(createElement("strong", "", finding.title), createElement("p", "", finding.text));
      els.boardVolumeFindings.appendChild(item);
    });

    els.boardVolumeCycleList.innerHTML = "";
    cycles.forEach((cycle, index) => {
      const boardVolume = leaderVolume.cycles?.[cycle.id]?.boardVolume;
      if (!boardVolume?.days?.length) return;
      els.boardVolumeCycleList.appendChild(makeBoardVolumeCycle(cycle, boardVolume, index === 0));
    });
    els.boardVolumeMethod.innerHTML = "";
    els.boardVolumeMethod.append(document.createTextNode(`${leaderVolume.boardVolumeMethod || ""} 成交额与换手率取自`));
    const marketLink = createElement("a", "", leaderVolume.source?.marketName || "东方财富历史日K");
    marketLink.href = leaderVolume.source?.marketUrl || "https://quote.eastmoney.com/center/";
    marketLink.target = "_blank";
    marketLink.rel = "noreferrer";
    const shortxLink = createElement("a", "", leaderVolume.source?.shortxName || "短线侠每日复盘");
    shortxLink.href = leaderVolume.source?.shortxUrl || "http://duanxianxia.cn/web/fupan/";
    shortxLink.target = "_blank";
    shortxLink.rel = "noreferrer";
    els.boardVolumeMethod.append(
      marketLink,
      document.createTextNode("，连板、首封、末封与开板次数取自"),
      shortxLink,
      document.createTextNode("。")
    );
  }

  function renderBoardVolumePlaybook() {
    if (!els.boardVolumeRules || !els.boardVolumeCombinations) return;
    els.boardVolumeRules.innerHTML = "";
    (leaderVolume.boardVolumeRules || []).forEach((rule, index) => {
      const item = createElement("article", "board-volume-rule");
      item.dataset.step = String(index + 1).padStart(2, "0");
      item.append(createElement("strong", "", rule.title), createElement("p", "", rule.text));
      els.boardVolumeRules.appendChild(item);
    });

    els.boardVolumeCombinations.innerHTML = "";
    (leaderVolume.boardVolumeCombinations || []).forEach((combination) => {
      const item = createElement("article", "board-volume-combination");
      const head = createElement("div", "board-volume-combination-head");
      head.append(
        createElement("span", "board-volume-combination-code", `组合 ${combination.code}`),
        createElement("span", "board-volume-combination-rule", combination.rule)
      );
      item.append(
        head,
        createElement("strong", "board-volume-combination-name", combination.name),
        createElement("p", "board-volume-combination-sequence", combination.sequence)
      );
      const samples = createElement("ul", "board-volume-combination-samples");
      (combination.cycles || []).forEach((sample) => {
        const cycle = cycles.find((candidate) => candidate.id === sample.id);
        const row = document.createElement("li");
        row.append(
          createElement("b", "", cycle?.name || sample.name || sample.id),
          createElement("span", "", sample.note)
        );
        samples.appendChild(row);
      });
      item.appendChild(samples);
      els.boardVolumeCombinations.appendChild(item);
    });
  }

  function makeBoardVolumeCycle(cycle, boardVolume, initiallyOpen) {
    const details = createElement("details", "board-volume-cycle");
    details.open = initiallyOpen;
    const summary = document.createElement("summary");
    const identity = createElement("div", "board-volume-identity");
    const combination = getCycleCombination(cycle);
    identity.append(
      createElement("strong", "", cycle.name),
      createElement("span", "", `${cycle.sector} / ${cycle.dateRange}`)
    );
    if (combination) {
      identity.appendChild(createElement("em", "board-volume-combination-tag", `${combination.code} · ${combination.name}`));
    }
    const metrics = createElement("dl", "board-volume-average");
    [
      ["连板均量", `${boardVolume.averageAmountYi} 亿`],
      ["首板成交", `${boardVolume.firstBoardAmountYi} 亿`],
      ["样本", `${boardVolume.boardDayCount} 日`]
    ].forEach(([label, value]) => {
      const group = document.createElement("div");
      group.append(createElement("dt", "", label), createElement("dd", "", value));
      metrics.appendChild(group);
    });
    summary.append(identity, metrics, makeBoardVolumeBars(boardVolume));

    const wrap = createElement("div", "board-volume-table-wrap");
    wrap.tabIndex = 0;
    const table = createElement("table", "board-volume-table");
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["日期", "连板情况", "题材阶段", "成交额 / 换手", "均量判断", "首板倍数", "封板情况"].forEach((label) => {
      headRow.appendChild(createElement("th", "", label));
    });
    head.appendChild(headRow);
    const body = document.createElement("tbody");
    (boardVolume.days || []).forEach((day) => body.appendChild(makeBoardVolumeDay(day)));
    table.append(head, body);
    wrap.appendChild(table);
    details.append(summary, wrap);
    return details;
  }

  function makeBoardVolumeBars(boardVolume) {
    const chart = createElement("div", "board-volume-bars");
    chart.setAttribute("aria-label", "逐日成交量柱，柱高按连板均量倍数绘制");
    (boardVolume.days || []).forEach((day) => {
      const item = createElement("div", "board-volume-bar-item");
      item.dataset.state = getVolumeStateKey(day.averageVolumeState);
      if (day.isTerminal) item.dataset.terminal = "true";
      item.title = `${day.displayDate} ${day.board}：成交 ${day.amountYi} 亿 / 均量 ${day.averageRatio}x ${day.averageVolumeState} / 首板 ${day.firstBoardRatio}x`;
      const value = createElement("span", "board-volume-bar-value", `${day.averageRatio}x`);
      const track = createElement("span", "board-volume-bar-track");
      const fill = createElement("i", "");
      fill.style.height = `${Math.max(5, Math.min((day.averageRatio / 5) * 100, 100))}%`;
      track.appendChild(fill);
      const board = createElement("b", "", day.isTerminal ? "断板" : day.board);
      const first = createElement("small", "", `首${day.firstBoardRatio}x`);
      item.append(value, track, board, first);
      chart.appendChild(item);
    });
    return chart;
  }

  function makeBoardVolumeDay(day) {
    const row = document.createElement("tr");
    row.dataset.state = getVolumeStateKey(day.averageVolumeState);
    if (day.isTerminal) row.dataset.terminal = "true";
    const dateCell = document.createElement("th");
    dateCell.scope = "row";
    dateCell.appendChild(createElement("time", "", day.displayDate));
    if (day.relation !== "周期内") dateCell.appendChild(createElement("span", "board-volume-relation", day.relation));

    const boardCell = document.createElement("td");
    boardCell.dataset.label = "连板情况";
    boardCell.append(createElement("strong", "board-volume-board", day.board), createElement("span", "", `${day.boardDetail} / ${day.type}`));
    const phaseCell = makeBoardVolumeCell("题材阶段", day.phase);
    const amountCell = document.createElement("td");
    amountCell.dataset.label = "成交额 / 换手";
    amountCell.append(createElement("strong", "", `${day.amountYi} 亿`), createElement("span", "", `换手 ${day.turnover}%`));

    const averageCell = makeBoardVolumeComparison("均量判断", day.averageRatio, day.averageVolumeState, 5);
    const firstBoardCell = makeFirstBoardRatio(day.firstBoardRatio);

    const seal = day.firstSeal && day.firstSeal !== "-"
      ? `${day.firstSeal}-${day.lastSeal}${day.openCount !== "-" ? ` / 开${day.openCount}次` : ""}`
      : "未封板";
    const sealCell = makeBoardVolumeCell("封板情况", seal);
    row.append(dateCell, boardCell, phaseCell, amountCell, averageCell, firstBoardCell, sealCell);
    return row;
  }

  function makeFirstBoardRatio(ratio) {
    const cell = document.createElement("td");
    cell.className = "board-volume-first-ratio";
    cell.dataset.label = "首板倍数";
    cell.append(createElement("strong", "", `${ratio}x`), createElement("span", "", "首板 = 1.00x"));
    return cell;
  }

  function makeBoardVolumeComparison(label, ratio, volumeState, scaleMax) {
    const cell = document.createElement("td");
    cell.className = "board-volume-comparison";
    cell.dataset.label = label;
    cell.dataset.state = getVolumeStateKey(volumeState);
    const ratioHead = createElement("div", "board-volume-ratio-head");
    ratioHead.append(createElement("strong", "", `${ratio}x`), createElement("span", "", `${Math.round(ratio * 100)}%`));
    const meter = createElement("span", "board-volume-meter");
    const meterFill = createElement("i", "");
    meterFill.style.width = `${Math.min((ratio / scaleMax) * 100, 100)}%`;
    meter.appendChild(meterFill);
    const state = createElement("span", "board-volume-state", volumeState);
    state.dataset.state = getVolumeStateKey(volumeState);
    cell.append(ratioHead, meter, state);
    return cell;
  }

  function makeBoardVolumeCell(label, text) {
    const cell = document.createElement("td");
    cell.dataset.label = label;
    cell.textContent = text || "-";
    return cell;
  }

  function renderTradeStudy() {
    if (!els.tradeTableBody) return;
    const stats = leaderVolume.tradeStats || {};
    const statItems = [
      [`${stats.confirmedBuyCount || 0}/${stats.cycleCount || cycles.length}`, "缩量确认成立"],
      [`${stats.executableConfirmCount || 0}/${stats.cycleCount || cycles.length}`, "标准买点可执行"],
      [String(stats.regulationCount || 0), "红线观察样本"],
      [String(stats.postWindowSellCount || 0), "卖点在窗口后"]
    ];
    els.tradeStats.innerHTML = "";
    statItems.forEach(([value, label]) => {
      const item = createElement("div", "trade-stat");
      item.append(createElement("strong", "", value), createElement("span", "", label));
      els.tradeStats.appendChild(item);
    });

    els.tradeLogic.innerHTML = "";
    (leaderVolume.tradeLogic || []).forEach((logic, index) => {
      const item = createElement("li", "trade-logic-item");
      item.dataset.step = String(index + 1).padStart(2, "0");
      item.textContent = logic;
      els.tradeLogic.appendChild(item);
    });

    els.tradeTableBody.innerHTML = "";
    cycles.forEach((cycle) => {
      const plan = leaderVolume.cycles?.[cycle.id]?.tradePlan;
      if (!plan) return;
      const row = document.createElement("tr");
      const identity = document.createElement("th");
      identity.scope = "row";
      identity.append(
        createElement("strong", "trade-cycle-name", cycle.name),
        createElement("span", "trade-cycle-meta", cycle.dateRange)
      );

      const preBuyCell = makeTradeCell("前置买点", makeTradeSignal(plan.preBuy, "prebuy"));
      const standardBuyCell = makeTradeCell("标准买点", makeTradeSignal(plan.standardBuy, "buy"));
      const standardSellCell = makeTradeCell("标准卖点", makeTradeSignal(plan.standardSell, "sell"));
      const regulationCell = makeTradeCell("监管后置", makeRegulationSignal(plan.regulation));
      row.append(identity, preBuyCell, standardBuyCell, standardSellCell, regulationCell);
      els.tradeTableBody.appendChild(row);
    });
  }

  function makeTradeCell(label, child) {
    const cell = document.createElement("td");
    cell.dataset.label = label;
    cell.appendChild(child || createElement("span", "empty-state compact-empty", "暂无信号"));
    return cell;
  }

  function makeTradeSignal(signal, tone) {
    if (!signal) return null;
    const item = createElement("article", "trade-signal");
    item.dataset.tone = tone;
    if (signal.relation !== "周期内") item.dataset.relation = signal.relation;
    const head = createElement("div", "trade-signal-head");
    head.append(createElement("time", "", signal.displayDate), createElement("strong", "", signal.title));
    const metrics = createElement("p", "trade-signal-metrics");
    metrics.textContent = `成交 ${signal.amountYi} 亿 / 换手 ${signal.turnover}% / 较前日 ${signal.previousRatio}x`;
    const state = createElement("p", "trade-signal-state");
    const seal = signal.firstSeal && signal.firstSeal !== "-"
      ? ` / ${signal.firstSeal}-${signal.lastSeal}`
      : " / 未封板";
    state.textContent = `${signal.board} / ${signal.type}${seal}`;
    item.append(head, metrics, state, createElement("p", "trade-signal-note", signal.note));
    return item;
  }

  function makeRegulationSignal(regulation) {
    const item = createElement("div", "regulation-signal");
    if (!regulation?.watch) {
      item.dataset.status = "clear";
      item.append(
        createElement("strong", "", regulation?.status || "未进入红线观察"),
        createElement("p", "", regulation?.note || "按标准卖点执行。")
      );
      return item;
    }

    item.dataset.status = "watch";
    const route = createElement("div", "regulation-route");
    route.append(
      createElement("span", "", `${regulation.watch.displayDate} 红线观察`),
      createElement("b", "", "→"),
      createElement("span", "", `${regulation.delayedSell.displayDate} 后置卖点`)
    );
    item.append(route, createElement("p", "", regulation.note));
    return item;
  }

  function renderDayGrid(cycle) {
    els.dayGrid.innerHTML = "";
    cycle.records.forEach((record, index) => {
      const article = createElement("article", "day-card");
      article.dataset.direction = record.direction;
      article.dataset.step = String(index + 1).padStart(2, "0");

      const head = createElement("div", "day-head");
      const dateGroup = createElement("div");
      dateGroup.append(
        createElement("span", "day-date", record.date),
        createElement("span", "weekday", record.weekday)
      );
      const tone = createElement("span", "tone-chip", `${record.phase} / ${record.intensity}`);
      tone.dataset.direction = record.direction;
      head.append(dateGroup, tone);

      const tagRow = createElement("div", "day-phase");
      [record.board, record.leaderMove, record.core].filter(Boolean).forEach((text) => {
        tagRow.appendChild(createElement("span", "tag", text));
      });

      const body = createElement("div", "day-body");
      body.append(
        makeRecordBlock("关键触发", makeSignalList(record.keySignals)),
        makeRecordBlock("梯队结构", createElement("span", "", record.ladder)),
        makeRecordBlock("风险记录", createElement("span", "", record.risk))
      );

      const summary = createElement("div", "day-summary");
      summary.append(tagRow, body);
      const limitBlock = makeRecordBlock("涨停个股", makeDailyLimitUpList(cycle, record));
      limitBlock.classList.add("limitup-record-block");

      const raw = createElement("p", "raw-text", record.raw);
      article.append(head, summary, limitBlock, raw);
      els.dayGrid.appendChild(article);
    });
  }

  function makeRecordBlock(label, child) {
    const block = createElement("div", "record-block");
    block.appendChild(createElement("b", "", label));
    block.appendChild(child);
    return block;
  }

  function makeSignalList(signals) {
    const list = createElement("ul", "signal-list");
    (signals || []).forEach((signal) => list.appendChild(createElement("li", "", signal)));
    return list;
  }

  function getDailyLimitUp(cycle, record) {
    return record.limitUps || dailyLimitUps.cycles?.[cycle.id]?.records?.[record.date] || null;
  }

  function getCycleDailyLimitUps(cycle) {
    return Object.values(dailyLimitUps.cycles?.[cycle.id]?.records || {});
  }

  function makeDailyLimitUpList(cycle, record) {
    const detail = getDailyLimitUp(cycle, record);
    const wrap = createElement("div", "daily-limitups");

    if (!detail || !detail.stocks?.length) {
      wrap.appendChild(createElement("span", "empty-state compact-empty", "短线侠当日没有匹配到该题材涨停明细。"));
      return wrap;
    }

    const summary = createElement("div", "limitups-head");
    summary.append(
      createElement("span", "limitups-plate", `${detail.plate} / ${detail.count} 涨停`),
      createElement("span", "limitups-date", detail.sourceDate || record.date)
    );
    if (detail.matchNote) {
      summary.appendChild(createElement("span", "limitups-note", detail.matchNote));
    }
    wrap.appendChild(summary);

    if (detail.catalyst) {
      wrap.appendChild(createElement("p", "limitups-catalyst", detail.catalyst));
    }

    const list = createElement("div", "stock-limit-list");
    detail.stocks.forEach((stock) => {
      const row = createElement("article", "stock-limit-row");
      const title = createElement("div", "stock-name-line");
      title.append(
        createElement("strong", "", stock.name),
        createElement("code", "", stock.code),
        createElement("span", "stock-board", stock.board || `${stock.streak || "-"}板`)
      );

      const times = createElement("div", "seal-times");
      times.append(
        createElement("span", "", `首封 ${stock.firstSeal || "-"}`),
        createElement("span", "", `末封 ${stock.lastSeal || "-"}`),
        createElement("span", "", stock.type || "")
      );

      row.append(title, times);
      if (stock.reason) {
        row.appendChild(createElement("p", "stock-reason", stock.reason));
      }
      list.appendChild(row);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function buildMarkdown(cycle) {
    const dates = cycle.records.map((record) => record.date);
    const separator = dates.map(() => "---");
    const cells = cycle.records.map((record) => record.raw.replace(/\n/g, "<br>"));
    const lines = [
      `## ${cycle.name}（${cycle.dateRange}）`,
      "",
      `| ${dates.join(" | ")} |`,
      `| ${separator.join(" | ")} |`,
      `| ${cells.join(" | ")} |`
    ];

    if (cycle.limitBoard?.items?.length) {
      lines.push("", "### 短线侠连板数据");
      cycle.limitBoard.items.forEach((item) => {
        lines.push(`- ${item.date}：${item.board} / ${item.status || ""} / ${item.note || ""}`);
      });
    }

    const volumeEvents = leaderVolume.cycles?.[cycle.id]?.events || [];
    if (volumeEvents.length) {
      lines.push("", "### 龙头关键爆量节点");
      volumeEvents.forEach((event) => {
        lines.push(
          `- ${event.displayDate} ${event.kind}：${event.board} / 成交 ${event.amountYi} 亿 / 换手 ${event.turnover}% / 较前日 ${event.previousRatio}x / ${event.note}`
        );
      });
    }

    const boardVolume = leaderVolume.cycles?.[cycle.id]?.boardVolume;
    if (boardVolume?.days?.length) {
      lines.push(
        "",
        "### 龙头连板量能统计",
        `- 双锚点：连板均量 ${boardVolume.averageAmountYi} 亿 = 1.00x / 首板 ${boardVolume.firstBoardAmountYi} 亿 = 1.00x / ${boardVolume.boardDayCount} 个成功连板日`
      );
      boardVolume.days.forEach((day) => {
        lines.push(
          `- ${day.displayDate}：${day.board} / ${day.phase} / 成交 ${day.amountYi} 亿 / 均量 ${day.averageRatio}x ${day.averageVolumeState} / 首板 ${day.firstBoardRatio}x / ${day.firstSeal !== "-" ? `${day.firstSeal}-${day.lastSeal}` : "未封板"}`
        );
      });
    }

    const tradePlan = leaderVolume.cycles?.[cycle.id]?.tradePlan;
    if (tradePlan?.preBuy && tradePlan?.standardBuy && tradePlan?.standardSell) {
      lines.push("", "### 董事长逻辑买卖点推演");
      [
        ["前置买点", tradePlan.preBuy],
        ["标准买点", tradePlan.standardBuy],
        ["标准卖点", tradePlan.standardSell]
      ].forEach(([label, signal]) => {
        lines.push(
          `- ${label} ${signal.displayDate}：${signal.title} / 成交 ${signal.amountYi} 亿 / 换手 ${signal.turnover}% / ${signal.note}`
        );
      });
      if (tradePlan.regulation?.watch) {
        lines.push(
          `- 监管后置：${tradePlan.regulation.watch.displayDate} 红线观察 -> ${tradePlan.regulation.delayedSell.displayDate} 后置卖点 / ${tradePlan.regulation.note}`
        );
      } else {
        lines.push(`- 监管后置：${tradePlan.regulation?.note || "未进入红线观察。"}`);
      }
    }

    const dailyRecords = cycle.records
      .map((record) => ({ record, detail: getDailyLimitUp(cycle, record) }))
      .filter(({ detail }) => detail?.stocks?.length);

    if (dailyRecords.length) {
      lines.push("", "### 短线侠每日复盘涨停明细（按概念）");
      dailyRecords.forEach(({ record, detail }) => {
        lines.push("", `#### ${record.date} ${detail.plate}（${detail.count} 涨停）`);
        if (detail.catalyst) lines.push(`催化：${detail.catalyst}`);
        detail.stocks.forEach((stock) => {
          lines.push(
            `- ${stock.name}（${stock.code}）：${stock.board || ""} / ${stock.type || ""} / 首封 ${stock.firstSeal || "-"} / 末封 ${stock.lastSeal || "-"} / ${stock.reason || ""}`
          );
        });
      });
    }

    return lines.join("\n");
  }

  async function copyMarkdown() {
    const cycle = getSelectedCycle();
    if (!cycle) return;
    const markdown = buildMarkdown(cycle);
    const original = els.copy.querySelector("span").textContent;

    try {
      await navigator.clipboard.writeText(markdown);
      setText(els.copy.querySelector("span"), "已复制");
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = markdown;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setText(els.copy.querySelector("span"), "已复制");
    }

    window.setTimeout(() => {
      setText(els.copy.querySelector("span"), original);
    }, 1200);
  }

  function bindControls() {
    if (els.search) {
      els.search.addEventListener("input", (event) => {
        state.query = event.target.value || "";
        renderCycleList();
      });
    }

    if (els.copy) {
      els.copy.addEventListener("click", copyMarkdown);
    }

    document.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        state.view = button.dataset.view;
        document.body.classList.toggle("compact", state.view === "compact");
        document.querySelectorAll("[data-view]").forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });
      });
    });

    window.addEventListener("hashchange", () => {
      const hashId = decodeURIComponent(window.location.hash.replace("#", ""));
      if (cycles.some((cycle) => cycle.id === hashId) && hashId !== state.selectedId) {
        state.selectedId = hashId;
        render();
        els.focus?.scrollIntoView({ block: "start" });
      }
    });

    els.expandBoardVolume?.addEventListener("click", () => {
      els.boardVolumeCycleList?.querySelectorAll("details").forEach((item) => {
        item.open = true;
      });
    });

    els.collapseBoardVolume?.addEventListener("click", () => {
      els.boardVolumeCycleList?.querySelectorAll("details").forEach((item) => {
        item.open = false;
      });
    });
  }

  function arrangeSections() {
    const main = document.getElementById("main");
    const systemMap = document.getElementById("system-map");
    const workspace = document.getElementById("cycles");
    const agriculture = document.getElementById("agriculture-replay");
    if (main && systemMap && workspace && systemMap.nextElementSibling !== workspace) {
      main.insertBefore(workspace, systemMap.nextElementSibling);
    }
    if (main && workspace && agriculture && workspace.nextElementSibling !== agriculture) {
      main.insertBefore(agriculture, workspace.nextElementSibling);
    }
  }

  function render() {
    const cycle = getSelectedCycle();
    renderOverview();
    renderCycleList();
    if (!cycle) return;
    renderCycleMap(cycle);
    renderCycleFocus(cycle);
    renderPhaseLine(cycle);
    renderLimitBoard(cycle);
    renderDayGrid(cycle);
    renderPatterns();
    renderVolumeStudy();
    renderBoardVolumeStudy();
    renderTradeStudy();
  }

  arrangeSections();
  bindControls();
  render();
  window.addEventListener("load", () => {
    const hashId = decodeURIComponent(window.location.hash.replace("#", ""));
    if (cycles.some((cycle) => cycle.id === hashId)) els.focus?.scrollIntoView({ block: "start" });
  }, { once: true });
})();
