const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 480, height: 900 });
  await page.goto("file:///C:/Users/user/OneDrive/Desktop/development/ai-assisted/learning-projects/yt-mp3-app/tools-stacking-diag.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const diag = await page.evaluate(() => {
    const menu = document.getElementById("toolsMenu");
    const grid = document.querySelector(".rx-lib-grid");
    const filters = document.querySelector(".rx-filters");
    const pageEl = document.querySelector(".rx-page");
    function describe(el) {
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName + (el.id ? "#" + el.id : "") + (el.className ? "." + String(el.className).split(" ")[0] : ""),
        position: cs.position,
        zIndex: cs.zIndex,
        overflow: cs.overflow + "/" + cs.overflowY,
        isolation: cs.isolation,
        transform: cs.transform,
        filter: cs.filter,
        opacity: cs.opacity,
        width: cs.width,
        height: cs.height,
        rect: { x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y, w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height },
      };
    }
    function ancestors(el) {
      const out = [];
      let n = el;
      while (n && n.nodeType === 1) { out.push(describe(n)); n = n.parentNode; }
      return out;
    }
    function isClipped(el) {
      let n = el;
      while (n && n.nodeType === 1) {
        const cs = getComputedStyle(n);
        if (cs.overflow !== "visible" && cs.overflow !== "clip") {
          const r = n.getBoundingClientRect();
          const er = el.getBoundingClientRect();
          if (er.top < r.top - 0.5 || er.bottom > r.bottom + 0.5 || er.left < r.left - 0.5 || er.right > r.right + 0.5) {
            return { clipped: true, by: n.tagName + (n.className ? "." + n.className.split(" ")[0] : ""), overflow: cs.overflow, rect: { x: r.x, y: r.y, w: r.width, h: r.height } };
          }
        }
        n = n.parentNode;
      }
      return { clipped: false };
    }
    return {
      menuAncestors: ancestors(menu),
      gridAncestors: ancestors(grid),
      filtersAncestors: ancestors(filters),
      pageAncestors: ancestors(pageEl),
      menuRect: { x: menu.getBoundingClientRect().x, y: menu.getBoundingClientRect().y, w: menu.getBoundingClientRect().width, h: menu.getBoundingClientRect().height },
      gridRect: { x: grid.getBoundingClientRect().x, y: grid.getBoundingClientRect().y, w: grid.getBoundingClientRect().width, h: grid.getBoundingClientRect().height },
      filtersRect: { x: filters.getBoundingClientRect().x, y: filters.getBoundingClientRect().y, w: filters.getBoundingClientRect().width, h: filters.getBoundingClientRect().height },
      menuClipping: isClipped(menu),
      gridClipping: isClipped(grid),
      windowInner: { w: window.innerWidth, h: window.innerHeight },
    };
  });
  console.log(JSON.stringify(diag, null, 2));
  await browser.close();
})();