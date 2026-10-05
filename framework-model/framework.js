function searchFramework(roots, query, branchId = '') {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const visible = new Set();
  const matches = new Set();
  function visit(node) {
    const ownMatch = words.length > 0 && words.every(word => node.title.toLocaleLowerCase().includes(word));
    const childMatches = node.children.map(visit).some(Boolean);
    if (!words.length || ownMatch || childMatches) visible.add(node.id);
    if (ownMatch) matches.add(node.id);
    return ownMatch || childMatches;
  }
  for (const root of roots) {
    for (const branch of root.children) if (!branchId || branch.id === branchId) visit(branch);
  }
  return { visible, matches };
}

if (typeof module !== 'undefined') module.exports = { searchFramework };

if (typeof document !== 'undefined') {
  const data = window.FRAMEWORK_SOURCE;
  const tree = document.getElementById('source-tree');
  const search = document.getElementById('source-search');
  const branchSelect = document.getElementById('source-branch');
  const status = document.getElementById('search-status');
  const rendered = new Map();
  let beforeSearch;
  function renderNode(node, branch = false) {
    const container = document.createElement(branch ? 'div' : 'li');
    let label;
    let details;
    if (node.children.length) {
      details = document.createElement('details');
      if (branch) details.className = 'tree-branch';
      label = document.createElement('summary');
      label.textContent = node.title;
      details.append(label);
      const children = document.createElement('ul');
      node.children.forEach(child => children.append(renderNode(child)));
      details.append(children);
      container.append(details);
    } else {
      label = document.createElement('div');
      label.className = 'tree-leaf';
      label.textContent = node.title;
      container.append(label);
    }
    container.dataset.sourceNode = node.id;
    rendered.set(node.id, { container, label, details });
    return container;
  }
  data.roots.forEach(root => root.children.forEach(branch => {
    const option = document.createElement('option');
    option.value = branch.id;
    option.textContent = branch.title;
    branchSelect.append(option);
    tree.append(renderNode(branch, true));
  }));
  document.getElementById('source-count').textContent = `${data.nodeCount} 个节点 · 原始层级保留`;
  function filter() {
    const query = search.value;
    const searching = query.trim().length > 0;
    if (searching && !beforeSearch) beforeSearch = new Map([...rendered].map(([id, row]) => [id, row.details?.open]));
    const result = searchFramework(data.roots, query, branchSelect.value);
    for (const [id, row] of rendered) {
      row.container.hidden = !result.visible.has(id);
      row.label.classList.toggle('tree-match', result.matches.has(id));
      if (row.details) {
        if (searching && result.visible.has(id)) row.details.open = true;
        else if (!searching && beforeSearch) row.details.open = beforeSearch.get(id) || false;
      }
    }
    if (!searching) beforeSearch = undefined;
    status.textContent = searching
      ? (result.matches.size ? `${result.matches.size} 个原文节点匹配` : '没有匹配的原文节点')
      : `${result.visible.size} 个分支节点 · 根节点：${data.roots.map(root => root.title).join('、')}`;
  }
  search.addEventListener('input', filter);
  branchSelect.addEventListener('change', filter);
  for (const [id, open] of [['expand-all', true], ['collapse-all', false]]) {
    document.getElementById(id).addEventListener('click', () => {
      for (const row of rendered.values()) if (row.details && !row.container.hidden) row.details.open = open;
    });
  }
  filter();
}
