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
      const fold = element("details", "", "lesson-fold");
      fold.id = `${root.id || "october"}-${section.id}`;
      fold.open = root.getAttribute("data-lesson-open") === "true" || (!scope && Boolean(section.open));
      fold.append(element("summary", root.getAttribute("data-lesson-title") || section.title));
      if (section.id === "positions" && (!pointIds || pointIds.includes(0))) {
        const allocation = element("div", "", "lesson-allocation");
        [["强天时 · 首笔", data.entryAllocation.strong], ["弱天时 · 首笔", data.entryAllocation.weak]].forEach(([label, value]) => {
          const column = element("div");
          column.append(element("span", label), element("strong", `${value}%`), element("small", data.entryAllocation.basis));
          allocation.append(column);
        });
        fold.append(allocation);
      }
      const points = element("dl", "", "lesson-points");
      section.points.forEach(([title, text], index) => {
        if (pointIds && !pointIds.includes(index)) return;
        const row = element("div");
        row.setAttribute("data-lesson-point", `${section.id}:${index}`);
        row.append(element("dt", title), element("dd", text));
        points.append(row);
      });
      fold.append(points);
      root.append(fold);
    });
    if (!scope || root.hasAttribute("data-lesson-source")) {
      root.append(element("p", `规则口径：本人复盘，${data.version}；经验窗口与待验证假设分开，不构成收益保证。`, "lesson-source"));
    }
  });
})();
