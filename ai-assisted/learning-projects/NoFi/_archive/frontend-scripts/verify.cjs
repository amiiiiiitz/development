const { chromium } = require("playwright-core");
const fs = require("fs");
const os = require("os");
const path = require("path");
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pw-"));
  const ctx = await chromium.launchPersistentContext(tmp, { headless: true, executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const results = {};
  async function dismissModal() { await page.evaluate(() => { const b = Array.from(document.querySelectorAll(".personalization-modal button")).find(x => /skip|not now|later/i.test(x.textContent.trim())); if (b) b.click(); }); await page.waitForTimeout(600); }
  async function gotoLib() { await page.evaluate(() => { const lib = Array.from(document.querySelectorAll(".nav-item")).find(i => i.textContent.trim() === "library"); if (lib) lib.click(); }); await page.waitForTimeout(1000); }
  function viewState() {
    return page.evaluate(() => {
      const listBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "List");
      const gridBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Grid");
      const active = (btn) => btn ? (btn.style.background === "rgb(255, 217, 61)" || btn.getAttribute("aria-pressed") === "true") : null;
      return { listBtnExists: !!listBtn, gridBtnExists: !!gridBtn, listActive: active(listBtn), gridActive: active(gridBtn) };
    });
  }
  await dismissModal();
  await gotoLib();
  results.libraryLoaded = await page.evaluate(() => !!document.querySelector(".rx-library"));
  results.sortValue = await page.evaluate(() => { const sel = document.querySelector("select[aria-label=\"Sort songs\"]"); return sel ? sel.value : "no-select"; });
  results.desktopView = await viewState();

  // Open Tools and verify portal above grid
  await page.evaluate(() => { const btn = document.querySelector(".rx-tools-wrap button"); if (btn) btn.click(); });
  await page.waitForTimeout(500);
  results.toolsOpen = await page.evaluate(() => ({ menuExists: !!document.querySelector(".rx-tools-portal"), menuItems: Array.from(document.querySelectorAll(".rx-tools-portal button[role=menuitem]")).map(b => b.textContent.trim()) }));
  results.toolsAbove = await page.evaluate(() => {
    const menu = document.querySelector(".rx-tools-portal");
    if (!menu) return { portalFound: false };
    const mr = menu.getBoundingClientRect();
    const samples = [];
    for (let i = 0; i <= 4; i++) {
      const x = mr.x + (mr.width * i / 4);
      const y = mr.y + (mr.height * i / 4);
      const el = document.elementFromPoint(x, y);
      samples.push({ i, topEl: el ? (el.tagName + (el.className ? "." + String(el.className).split(" ")[0] : "")) : null });
    }
    return { portalFound: true, menuRect: { x: Math.round(mr.x), y: Math.round(mr.y), w: Math.round(mr.width), h: Math.round(mr.height) }, samples };
  });

  // Test outside-click dismissal
  await page.mouse.click(10, 10);
  await page.waitForTimeout(300);
  results.outsideClickDismiss = await page.evaluate(() => ({ menuStillOpen: !!document.querySelector(".rx-tools-portal"), toolsBtnAria: document.querySelector(".rx-tools-wrap button") ? document.querySelector(".rx-tools-wrap button").getAttribute("aria-expanded") : null }));

  // Re-open and test each action
  await page.evaluate(() => { const btn = document.querySelector(".rx-tools-wrap button"); if (btn) btn.click(); });
  await page.waitForTimeout(300);
  const action1 = await page.evaluate(() => { const b = Array.from(document.querySelectorAll(".rx-tools-portal button[role=menuitem]")).find(x => x.textContent.trim() === "Export collection"); if (b) { b.click(); return "clicked"; } return "not-found"; });
  await page.waitForTimeout(300);
  results.exportAction = action1;
  results.menuAfterExport = await page.evaluate(() => !!document.querySelector(".rx-tools-portal"));

  // List and Grid views
  await page.evaluate(() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "List"); if (btn) btn.click(); });
  await page.waitForTimeout(300);
  results.listView = await viewState();
  await page.evaluate(() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "Grid"); if (btn) btn.click(); });
  await page.waitForTimeout(300);
  results.gridView = await viewState();

  // Mobile positioning
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  results.mobileView = await viewState();
  await page.evaluate(() => { const btn = document.querySelector(".rx-tools-wrap button"); if (btn) btn.click(); });
  await page.waitForTimeout(400);
  results.mobileTools = await page.evaluate(() => {
    const menu = document.querySelector(".rx-tools-portal");
    if (!menu) return { portalFound: false };
    const mr = menu.getBoundingClientRect();
    const samples = [];
    for (let i = 0; i <= 4; i++) {
      const x = mr.x + (mr.width * i / 4);
      const y = mr.y + (mr.height * i / 4);
      const el = document.elementFromPoint(x, y);
      samples.push({ i, topEl: el ? (el.tagName + (el.className ? "." + String(el.className).split(" ")[0] : "")) : null });
    }
    return { portalFound: true, menuRect: { x: Math.round(mr.x), y: Math.round(mr.y), w: Math.round(mr.width), h: Math.round(mr.height) }, samples };
  });

  results.errors = errors.slice(0, 10);
  console.log(JSON.stringify(results, null, 2));
  await page.screenshot({ path: "C:\\Users\\user\\OneDrive\\Desktop\\development\\ai-assisted\\learning-projects\\yt-mp3-app\\verify-desktop.png" });
  await page.screenshot({ path: "C:\\Users\\user\\OneDrive\\Desktop\\development\\ai-assisted\\learning-projects\\yt-mp3-app\\verify-mobile.png" });
  await ctx.close();
})();
