"use strict";
const audit = require("./ui-layout-audit.cjs");
const { chromium } = require("playwright"),
  fs = require("node:fs"),
  path = require("node:path");
(async () => {
  const root =
      process.env.UI_QA_DIR ||
      path.resolve(__dirname, "../qa/layout-foundation"),
    b = await chromium.launch({
      executablePath: process.env.UI_CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    }),
    results = [];
  fs.mkdirSync(root + "/lobby", { recursive: true });
  try {
    for (const [width, height] of [
      [320, 568],
      [360, 640],
      [375, 667],
      [390, 568],
      [390, 640],
      [390, 844],
      [430, 568],
      [430, 932],
    ]) {
      const p = await b.newPage({
        viewport: { width, height },
        isMobile: true,
        hasTouch: true,
        reducedMotion: "reduce",
      });
      await p.goto(
        (process.env.UI_BASE_URL || "http://127.0.0.1:8766/") + "?gm=1",
      );
      await p.waitForTimeout(250);
      await p.evaluate(() => {
        document.querySelector("#gm-test-panel").style.display = "none";
        document.body.classList.remove("gm-test-active");
        saveChange((d) => {
          if (!d.owned.includes("rescue")) d.owned.push("rescue");
          d.equipped = "rescue";
        });
        renderMeta();
      });
      for (const resume of [false, true]) {
        await p.evaluate(
          (v) => (document.querySelector("#resume-run").hidden = !v),
          resume,
        );
        await p.waitForTimeout(30);
        const metrics = await p.evaluate(() => {
          const shortcuts = document
              .querySelector(".duo-shortcuts")
              .getBoundingClientRect(),
            companion = document
              .querySelector(".duo-companion")
              .getBoundingClientRect(),
            art = document.querySelector(".lobby-art").getBoundingClientRect(),
            dock = document
              .querySelector(".approved-lobby-dock")
              .getBoundingClientRect();
          return {
            verticalGap: companion.top - shortcuts.bottom,
            gap: Math.max(
              companion.top - shortcuts.bottom,
              shortcuts.top - companion.bottom,
              companion.left - shortcuts.right,
              shortcuts.left - companion.right,
            ),
            sceneGap: dock.top - art.bottom,
            inside:
              shortcuts.top >= art.top &&
              shortcuts.bottom <= art.bottom &&
              companion.top >= art.top &&
              companion.bottom <= art.bottom,
          };
        });
        results.push({
          size: [width, height],
          resume,
          ...metrics,
          layout: await p.evaluate(audit),
        });
        await p.screenshot({
          path: `${root}/lobby/${width}x${height}-${resume ? "resume" : "normal"}.png`,
        });
      }
      await p.close();
    }
  } finally {
    await b.close();
  }
  fs.writeFileSync(
    root + "/lobby/checks.json",
    JSON.stringify(results, null, 2),
  );
  const issues = results.filter(
    (x) =>
      x.gap < 8 ||
      Math.abs(x.sceneGap) > 1 ||
      !x.inside ||
      x.layout.issues.length,
  );
  console.log(JSON.stringify({ cases: results.length, issues }, null, 2));
  if (issues.length) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
