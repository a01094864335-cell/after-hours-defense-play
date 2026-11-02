"use strict";
const { chromium } = require("playwright"),
  fs = require("node:fs"),
  path = require("node:path");
(async () => {
  const browser = await chromium.launch({
      executablePath: process.env.UI_CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    }),
    out = __dirname,
    checks = [];
  try {
    for (const [width, height] of [
      [390, 844],
      [320, 568],
      [375, 667],
      [390, 568],
      [430, 932],
    ]) {
      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(
        (process.env.UI_BASE_URL || "http://127.0.0.1:8766/") +
          "previews/lobby-direction/",
      );
      await page.waitForTimeout(200);
      const result = await page.evaluate(() => {
        const problems = [],
          r = (e) => e.getBoundingClientRect(),
          overlap = (a, b) =>
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
        const names = [".hud", ".game-logo", ".hero", ".shortcuts", ".support"];
        for (let i = 0; i < names.length; i++)
          for (let j = i + 1; j < names.length; j++) {
            const a = document.querySelector(names[i]),
              b = document.querySelector(names[j]);
            if (overlap(r(a), r(b)))
              problems.push({ overlap: [names[i], names[j]] });
          }
        for (const e of document.querySelectorAll("button")) {
          if (
            e.scrollWidth > e.clientWidth + 2 ||
            e.scrollHeight > e.clientHeight + 2
          )
            problems.push({ overflow: e.className || e.textContent.trim() });
          const box = r(e);
          if (
            box.left < 0 ||
            box.right > innerWidth ||
            box.bottom > innerHeight + 1
          )
            problems.push({ outside: e.className || e.textContent.trim() });
        }
        const imageFailures = [...document.images]
          .filter((e) => !e.complete || !e.naturalWidth)
          .map((e) => e.src);
        return {
          problems,
          imageFailures,
          heroHeight: r(document.querySelector(".hero")).height,
        };
      });
      const file =
        width === 390 && height === 844
          ? "lobby-390.png"
          : width === 320
            ? "lobby-320.png"
            : width === 430
              ? "lobby-430.png"
              : `lobby-${width}x${height}.png`;
      await page.screenshot({ path: path.join(out, file) });
      checks.push({ size: [width, height], ...result, errors });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(
    path.join(out, "checks.json"),
    JSON.stringify(checks, null, 2),
  );
  console.log(JSON.stringify(checks));
  if (
    checks.some(
      (x) => x.problems.length || x.imageFailures.length || x.errors.length,
    )
  )
    process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
