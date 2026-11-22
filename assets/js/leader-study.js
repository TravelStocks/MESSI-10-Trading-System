(() => {
  const section = document.getElementById('leader-study');
  if (!section) return;
  const boxes = [...section.querySelectorAll('input[type="checkbox"]')];
  const key = 'messi10:leader-faith:study:v1';
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) boxes.forEach(box => { box.checked = saved.includes(box.value); });
  } catch { /* The list also works without browser storage. */ }
  function update(persist) {
    const done = boxes.filter(box => box.checked).map(box => box.value);
    section.querySelector('output').textContent = '已完成 ' + done.length + ' / ' + boxes.length;
    if (persist) {
      try { localStorage.setItem(key, JSON.stringify(done)); } catch { /* Session-only progress. */ }
    }
  }
  section.addEventListener('change', () => update(true));
  update(false);
})();
