const progress = document.querySelector("#progress");
const backtop = document.querySelector("#backtop");
const tocLinks = [...document.querySelectorAll(".toc-link")];
const sections = [...new Set(tocLinks
  .map((link) => document.getElementById(link.hash.slice(1)))
  .filter(Boolean))];
const stateCards = [...document.querySelectorAll(".state-card")];
const modePanel = document.querySelector("#modePanel");
const compareTable = document.querySelector("#compareTable");
const mobileContents = document.querySelector(".mobile-contents");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const modeCopy = {
  dragon: {
    title: "有龙：聚焦真龙，做主升浪",
    body: "只在主线明确、真龙已被七维确认时提高仓位。第一性看身位，唯一性看题材内、题材之间以及最高标抱团的唯一出口；主要做三进四、四进五；唯一性早出现可前置，未决PK不参与，题材与量能共同确认后再执行。",
    bg: "#f5faf7",
    border: "rgba(7, 135, 93, 0.24)"
  },
  relay: {
    title: "无龙：轻仓试错，做低位1进2",
    body: "没有高位总龙时，只做三种允许场景：冰点后新题材共振、分歧活口反包、硬逻辑趋势股回踩。只盯板块前排，晋级2板无龙头属性减半。",
    bg: "#f3fbfb",
    border: "rgba(0, 140, 140, 0.24)"
  },
  defense: {
    title: "退潮：停止幻想，空仓防守",
    body: "高潮次日、竞价崩盘、涨停指数走弱、题材电风扇轮动，都优先清仓或空仓。没有合格机会时，空仓就是正确动作。",
    bg: "#fff7f7",
    border: "rgba(223, 44, 44, 0.24)"
  }
};

function updateProgress() {
  const scrollTop = window.scrollY;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? scrollTop / scrollable : 0;
  progress.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
  backtop.classList.toggle("is-visible", scrollTop > 520);
}

function updateToc() {
  const marker = stickyHeight() + 64;
  let activeId = sections[0]?.id;
  let nearestTop = -Infinity;
  for (const section of sections) {
    if (!section.getClientRects().length) continue;
    const top = section.getBoundingClientRect().top;
    if (top <= marker && top > nearestTop) {
      activeId = section.id;
      nearestTop = top;
    }
  }

  tocLinks.forEach((link) => {
    const active = link.hash === `#${activeId}`;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  const activeLink = tocLinks.find((link) => link.hash === `#${activeId}`);
  const label = mobileContents?.querySelector("summary small");
  if (activeLink && label) label.textContent = activeLink.textContent.replace(/^\s*\d+\s*/, "").trim();
}

function stickyHeight() {
  const topbar = document.querySelector(".topbar")?.getBoundingClientRect().height || 0;
  const mobile = mobileContents && getComputedStyle(mobileContents).display !== "none"
    ? mobileContents.querySelector("summary").getBoundingClientRect().height : 0;
  return topbar + mobile;
}

function setMode(mode) {
  const copy = modeCopy[mode];
  if (!copy || !modePanel) return;

  stateCards.forEach((card) => {
    const isActive = card.dataset.mode === mode;
    card.classList.toggle("is-active", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });

  if (compareTable) {
    compareTable.classList.remove("mode-dragon", "mode-relay", "mode-defense");
    compareTable.classList.add(`mode-${mode}`);
  }

  modePanel.style.background = copy.bg;
  modePanel.style.borderColor = copy.border;
  modePanel.querySelector("h3").textContent = copy.title;
  modePanel.querySelector("p").textContent = copy.body;
}

function scrollToHashTarget() {
  if (!window.location.hash) return;
  let id;
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return;
  }

  const target = document.getElementById(id);
  if (!target) return;
  if (mobileContents) mobileContents.open = false;
  for (let node = target; node; node = node.parentElement) {
    if (node.tagName === "DETAILS") node.open = true;
  }
  requestAnimationFrame(() => {
    const top = target.getBoundingClientRect().top + window.scrollY - stickyHeight() - 20;
    window.scrollTo({ top, behavior: "instant" });
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    updateProgress();
    updateToc();
  });
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    if (mobileContents) mobileContents.open = false;
    if (link.hash === window.location.hash) scrollToHashTarget();
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileContents?.open) {
    mobileContents.open = false;
    mobileContents.querySelector("summary").focus();
  }
});

stateCards.forEach((card) => {
  card.addEventListener("click", () => setMode(card.dataset.mode));
});

backtop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "instant" : "smooth" });
});

let renderPending = false;
function scheduleRender() {
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(() => {
    renderPending = false;
    updateProgress();
    updateToc();
  });
}
window.addEventListener("scroll", scheduleRender, { passive: true });
document.addEventListener("toggle", scheduleRender, true);

window.addEventListener("resize", scheduleRender);
window.addEventListener("load", scrollToHashTarget);
window.addEventListener("hashchange", scrollToHashTarget);

updateProgress();
updateToc();
