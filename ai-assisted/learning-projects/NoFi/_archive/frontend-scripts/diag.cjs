const { chromium } = require("playwright-core");
const fs = require("fs");
const os = require("os");
const path = require("path");
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pw-"));
  const ctx = await chromium.launchPersistentContext(tmp, { headless: true, executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const b = Array.from(document.querySelectorAll(".personalization-modal button")).find(x => /skip|not now|later/i.test(x.textContent.trim())); if (b) b.click(); });
  await page.waitForTimeout(600);
  await page.evaluate(() => { const lib = Array.from(document.querySelectorAll(".nav-item")).find(i => i.textContent.trim() === "library"); if (lib) lib.click(); });
  await page.waitForTimeout(1000);
  // Try to find React via the fiber
  const r = await page.evaluate(() => {
    const root = document.getElementById("root");
    const anyChild = root && root.firstElementChild;
    let fiber = anyChild;
    const found = [];
    // Walk up the fiber tree to find a component instance and access its type
    let safety = 0;
    while (fiber && safety < 50) {
      // Try to find React via the element's __reactProps$ or via the fiber's memoizedProps
      if (fiber.stateNode && fiber.stateNode.constructor) {
        found.push(fiber.stateNode.constructor.name);
      }
      fiber = fiber.return;
      safety++;
    }
    return { fiberCount: safety, constructors: found.slice(0, 10) };
  });
  console.log("FIBER:", JSON.stringify(r, null, 2));
  await ctx.close();
})();
