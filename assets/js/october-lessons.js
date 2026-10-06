(() => {
  const data = window.M10_OCTOBER_LESSONS;
  if (!data) return;
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  document.querySelectorAll("[data-october-lessons]").forEach((root) => {
    root.classList.add("october-lessons");
    const scope = root.getAttribute("data-lesson-sections");
    const sectionIds = scope ? scope.split(",") : data.sections.map((section) => section.id);
    const pointScope = root.getAttribute("data-lesson-points");
    const pointIds = pointScope ? pointScope.split(",").map(Number) : null;
    const heading = root.getAttribute("data-lesson-heading") === "4" ? "h4" : "h3";
    const inline = root.getAttribute("data-lesson-layout") === "inline";
    if (inline) root.classList.add("lesson-inline");

    if (!scope || root.hasAttribute("data-lesson-rhythms")) {
      const rhythms = element("div", "", "lesson-rhythms");
      const labels = ["分歧后回流", "续强后回流", "连续弱后修复", "持续强分支"];
      data.rhythms.forEach((rhythm, index) => {
        const row = element("article", "", "lesson-rhythm");
        const identity = element("div", "", "lesson-rhythm-identity");
        identity.append(element("span", index < 3 ? `0${index + 1}` : "+", "lesson-index"));
        const flow = element("div");
        flow.append(element("p", labels[index], "lesson-label"));
        const path = element(heading, "", "lesson-rhythm-path");
        rhythm.path.forEach((step, stepIndex) => {
          if (stepIndex) path.append(element("span", "→", "lesson-arrow"));
          const state = element("span", step, "lesson-state");
          state.setAttribute("data-tone", step === "弱" ? "weak" : "strong");
          path.append(state);
        });
        flow.append(path);
        identity.append(flow);
        row.append(identity, element("p", rhythm.note, "lesson-rhythm-note"));
        rhythms.append(row);
      });
      root.append(rhythms);
    }

    data.sections.filter((section) => sectionIds.includes(section.id)).forEach((section) => {
      const group = inline ? root : element("section", "", "lesson-group");
      if (!inline) {
        group.id = `${root.id || "october"}-${section.id}`;
        group.append(element(heading, root.getAttribute("data-lesson-title") || section.title, "lesson-group-title"));
      }
      const points = inline ? root : element("div", "", "lesson-point-grid");
      section.points.forEach(([title, text], index) => {
        if (pointIds && !pointIds.includes(index)) return;
        const row = element("article", "", "lesson-point");
        row.setAttribute("data-lesson-point", `${section.id}:${index}`);
        const kind = section.id === "positions" ? (index === 3 ? "buy" : "position") : section.id === "discipline" ? (index === 0 ? "sell" : "risk") : ["crossing", "speculative", "questions"].includes(section.id) ? "research" : "check";
        row.setAttribute("data-kind", kind);
        row.append(element(inline || heading === "h4" ? "h5" : "h4", root.getAttribute("data-lesson-point-title") || title));
        if (section.id === "positions" && index === 0) {
          const allocation = element("div", "", "lesson-allocation");
          [["强天时 · 首笔", data.entryAllocation.strong], ["弱天时 · 首笔", data.entryAllocation.weak]].forEach(([label, value]) => {
            const column = element("div");
            column.append(element("span", label), element("strong", `${value}%`), element("small", data.entryAllocation.basis));
            allocation.append(column);
          });
          row.append(allocation);
        }
        const list = element("ul", "", "rule-bullets");
        (data.structuredPoints[`${section.id}:${index}`] || [text]).forEach((item) => list.append(element("li", item)));
        row.append(list);
        points.append(row);
      });
      if (!inline) { group.append(points); root.append(group); }
    });
    if (!scope || root.hasAttribute("data-lesson-source")) {
      root.append(element("p", `规则口径：本人复盘，${data.version}；经验窗口与待验证假设分开，不构成收益保证。`, "lesson-source"));
    }
  });
})();
