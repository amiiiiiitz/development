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

  // Tools portal above grid
  await page.evaluate(() => { const btn = document.querySelector(".rx-tools-wrap button"); if (btn) btn.click(); });
  await page.waitForTimeout(500);
  results.toolsPortal = await page.evaluate(() => {
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

  // Switch to list, verify persistence, reload
  await page.evaluate(() => { const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim() === "List"); if (btn) btn.click(); });
  await page.waitForTimeout(400);
  results.listAfterClick = await viewState();
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await dismissModal();
  await gotoLib();
  results.listAfterReload = await viewState();

  // Mobile default = list
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  results.mobileView = await viewState();

  // Tablet default = grid
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(600);
  results.tabletView = await viewState();

  // Resize back to desktop -> user had set list manually, so it should stay list
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(600);
  results.desktopResizeView = await viewState();

  results.errors = errors.slice(0, 5);
  console.log(JSON.stringify(results, null, 2));
  await page.screenshot({ path: "C:\\Users\\user\\OneDrive\\Desktop\\development\\ai-assisted\\learning-projects\\yt-mp3-app\\e2e-desktop.png" });
  await page.screenshot({ path: "C:\\Users\\user\\OneDrive\\Desktop\\development\\ai-assisted\\learning-projects\\yt-mp3-app\\e2e-mobile.png" });
  await ctx.close();
})();
