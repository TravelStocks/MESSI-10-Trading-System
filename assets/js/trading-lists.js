'use strict';

// Keep the worldview entry and the front-page checklist on one source of truth.
const tradingListsSource = document.getElementById('trading-discipline-lists');
for (const target of document.querySelectorAll('[data-trading-lists-copy]')) {
  if (!tradingListsSource) continue;
  const copy = tradingListsSource.cloneNode(true);
  for (const node of [copy, ...copy.querySelectorAll('[id], [aria-labelledby]')]) {
    node.removeAttribute('id');
    node.removeAttribute('aria-labelledby');
  }
  target.replaceChildren(copy);
}
