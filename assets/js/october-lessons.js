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
    root.append(element("p", `${data.version} / ${data.source}`, "lesson-source"));
    const rhythms = element("div", "", "lesson-rhythms");
    data.rhythms.forEach((rhythm) => {
      const row = element("article", "", "lesson-rhythm");
      row.append(element("p", rhythm.label, "lesson-label"), element("h3", rhythm.path.join(" → ")), element("p", rhythm.note));
      rhythms.append(row);
    });
    root.append(element("h3", "题材运行：三种主节奏 + 一直不弱"), rhythms);
    data.sections.forEach((section) => {
      const fold = element("details", "", "lesson-fold");
      fold.id = `${root.id || "october"}-${section.id}`;
      fold.open = Boolean(section.open);
      fold.append(element("summary", section.title));
      const points = element("dl", "", "lesson-points");
      section.points.forEach(([title, text]) => {
        const row = element("div");
        row.append(element("dt", title), element("dd", text));
        points.append(row);
      });
      fold.append(points);
      root.append(fold);
    });
  });
})();
