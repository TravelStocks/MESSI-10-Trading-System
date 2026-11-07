(() => {
  const form = document.querySelector('[data-preorder-check]');
  if (!form) return;
  const checks = [...form.querySelectorAll('input[type="checkbox"]')];
  const status = form.querySelector('[data-preorder-status]');
  const update = () => {
    const count = checks.filter((check) => check.checked).length;
    status.textContent = `本次核对 ${count} / ${checks.length}`;
  };
  const clear = () => { checks.forEach((check) => { check.checked = false; }); update(); };
  form.addEventListener('change', update);
  form.addEventListener('reset', () => requestAnimationFrame(clear));
  form.addEventListener('submit', (event) => event.preventDefault());
  window.addEventListener('pageshow', clear);
  clear();
})();
