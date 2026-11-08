const { chromium } = require("playwright-core");
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 480, height: 900 });
  page.on("console", msg => console.log("BROWSER:", msg.text()));
  page.on("pageerror", err => console.log("PAGEERROR:", err.message));
  await page.goto("file:///C:/Users/user/OneDrive/Desktop/development/ai-assisted/learning-projects/yt-mp3-app/tools-stacking-diag.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const r = await page.evaluate(() => {
    const el = document.querySelector(".rx-page");
    const cs = getComputedStyle(el);
    const sheets = [...document.styleSheets].map(s => ({ href: s.href, rules: s.cssRules ? s.cssRules.length : 0 }));
    const bd = document.querySelector(".bd") ? getComputedStyle(document.querySelector(".bd")).border : "no .bd";
    return { pagePosition: cs.position, pageIsolation: cs.isolation, bdBorder: bd, sheets };
  });
  console.log(JSON.stringify(r, null, 2));
  await browser.close();
})();
