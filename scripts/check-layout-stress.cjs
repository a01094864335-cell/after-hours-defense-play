"use strict";
const { chromium } = require("playwright"),
  fs = require("node:fs"),
  path = require("node:path"),
  audit = require("./ui-layout-audit.cjs");
(async () => {
  const root =
      process.env.UI_QA_DIR ||
      path.resolve(__dirname, "../qa/layout-foundation"),
    browser = await chromium.launch({
      executablePath: process.env.UI_CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    }),
    results = [],
    fontScale = Number(process.env.UI_TEXT_SCALE || 1.3);
  fs.mkdirSync(root + "/stress", { recursive: true });
  const cases = [
    [
      "shop",
      () => {
        document.querySelector("#shop-open").click();
        shopTab("items");
      },
      () => {
        document.querySelector("#shop .sheet-head h2").textContent =
          "Night dispatch marketplace";
        document.querySelectorAll(".item-product>span").forEach((e) => {
          e.firstChild.textContent = "Promotion synthesis voucher";
          e.querySelector("small").textContent =
            "Combine employees of the same grade, even when their roles are different. Consumed once per use.";
        });
      },
    ],
    [
      "personnel",
      () => document.querySelector("#roster-open").click(),
      () => {
        document.querySelector("#roster-title").textContent =
          "Night shift personnel records";
        document
          .querySelectorAll(".staff-pass .pass-open")
          .forEach((e) => (e.textContent = "야간 시설관리 전문 직원"));
        document
          .querySelectorAll(".staff-pass .pass-job")
          .forEach((e) => (e.textContent = "Emergency facilities technician"));
        document
          .querySelectorAll(".staff-pass .pass-meta b")
          .forEach((e) => (e.textContent = "Currently on duty"));
      },
    ],
    [
      "detail",
      () => {
        document.querySelector("#roster-open").click();
        showStaffRecord("goblin-guard");
      },
      () => {
        document.querySelector(".dossier-hero h3").textContent =
          "Emergency Response Specialist";
        document.querySelector(
          ".dossier-hero>span:not(.dossier-stamp)",
        ).textContent = "야간 당직 시설관리 및 안전지원팀 / 전문 경비원";
        document.querySelector(".staff-action").textContent =
          "Remove employee from the night shift roster";
      },
    ],
    [
      "training",
      () => openTraining(),
      () => {
        document.querySelector(".training-header h2").textContent =
          "Permanent employee training";
        document
          .querySelectorAll(".training-character-title>span")
          .forEach((e) => (e.textContent = "Available after recruitment"));
        document
          .querySelectorAll(".training-character li>span")
          .forEach(
            (e) =>
              (e.textContent =
                "야간 근무 중 모든 동료에게 적용되는 추가 지원 효과입니다. 강화 레벨에 따라 효과가 증가합니다."),
          );
      },
    ],
  ];
  try {
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [430, 932],
    ])
      for (const [name, open, copy] of cases) {
        const page = await browser.newPage({
          viewport: { width, height },
          isMobile: true,
          hasTouch: true,
          reducedMotion: "reduce",
        });
        await page.goto(
          (process.env.UI_BASE_URL || "http://127.0.0.1:8766/") +
            "?gm=1&coins=400",
        );
        await page.waitForTimeout(250);
        await page.evaluate(() => {
          document.querySelector("#gm-test-panel").style.display = "none";
          document.body.classList.remove("gm-test-active");
          saveChange((d) => (d.tutorialComplete = true));
          restartTo("lobby");
        });
        await page.evaluate(open);
        await page.waitForTimeout(100);
        await page.evaluate(copy);
        await page.evaluate((scale) => {
          const nodes = [
            ...document.querySelector("dialog[open]").querySelectorAll("*"),
          ].filter(
            (e) => !["IMG", "CANVAS", "SVG", "PATH"].includes(e.tagName),
          );
          const sizes = nodes.map((e) => [
            e,
            parseFloat(getComputedStyle(e).fontSize),
          ]);
          for (const [e, size] of sizes)
            if (size) e.style.fontSize = size * scale + "px";
        }, fontScale);
        await page.waitForTimeout(100);
        const top = await page.evaluate(audit);
        await page.screenshot({
          path: `${root}/stress/${width}-${name}-${Math.round(fontScale * 100)}-top.png`,
        });
        await page.evaluate(() => {
          for (const e of document.querySelectorAll(
            "dialog[open] .panel-scroll-body,dialog[open] .live-training-body,dialog[open] #roster-overview",
          ))
            e.scrollTop = e.scrollHeight;
        });
        await page.waitForTimeout(50);
        const bottom = await page.evaluate(audit);
        await page.screenshot({
          path: `${root}/stress/${width}-${name}-${Math.round(fontScale * 100)}-bottom.png`,
        });
        results.push({
          size: [width, height],
          case: name,
          fontScale,
          longCopy: true,
          top,
          bottom,
        });
        await page.close();
      }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(
    root + "/stress/checks-" + Math.round(fontScale * 100) + ".json",
    JSON.stringify(results, null, 2) + "\n",
  );
  const issues = results.filter(
    (r) => r.top.issues.length || r.bottom.issues.length,
  );
  console.log(JSON.stringify({ cases: results.length, issues }, null, 2));
  if (issues.length) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
