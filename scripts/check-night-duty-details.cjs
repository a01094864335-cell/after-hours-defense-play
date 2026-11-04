"use strict";
const { chromium } = require("playwright"),
  fs = require("node:fs"),
  path = require("node:path"),
  audit = require("./ui-layout-audit.cjs");
(async () => {
  const out =
    process.env.UI_QA_DIR ||
    path.resolve(__dirname, "../qa/night-duty-details");
  fs.mkdirSync(out + "/focused", { recursive: true });
  const browser = await chromium.launch({
      executablePath: process.env.UI_CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    }),
    report = [];
  try {
    for (const [width, height] of [
      [320, 568],
      [375, 667],
      [390, 844],
      [430, 932],
    ]) {
      const p = await browser.newPage({
          viewport: { width, height },
          isMobile: true,
          hasTouch: true,
          reducedMotion: "reduce",
        }),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(
        (process.env.UI_BASE_URL || "http://127.0.0.1:8830/") +
          "?gm=1&coins=400",
      );
      await p.waitForTimeout(350);
      await p.evaluate(() => {
        document.querySelector("#gm-test-panel").style.display = "none";
        document.body.classList.remove("gm-test-active");
        saveChange((d) => {
          d.tutorialComplete = true;
          if (!d.owned.includes("rescue")) d.owned.push("rescue");
          d.equipped = "rescue";
        });
        restartTo("lobby");
        renderMeta();
      });
      const rules = await p.evaluate(() =>
          DAILY_RULES.map((r, i) => ({ i, id: r.id, effect: r.effect })),
        ),
        variants = [];
      for (const rule of rules)
        for (const resume of [false, true]) {
          await p.evaluate(
            ({ i, resume }) => {
              dailyEnabled = true;
              tutorialMode = false;
              dailyRule = i;
              renderProgress();
              document.querySelector("#resume-run").hidden = !resume;
            },
            { ...rule, resume },
          );
          const effect = await p.locator("#daily-effect").innerText();
          if (effect !== rule.effect) throw Error("Stale effect " + rule.id);
          const layout = await p.evaluate(audit);
          variants.push({ rule: rule.id, resume, issues: layout.issues });
        }
      await p.evaluate(() => {
        document.querySelector("#resume-run").hidden = true;
        dailyRule = 1;
        renderProgress();
      });
      await p.screenshot({ path: `${out}/focused/${width}-lobby.png` });
      await p.click(".duo-companion");
      if (!(await p.locator("#roster").evaluate((e) => e.open)))
        throw Error("Support action lost");
      await p.click("#roster-close");
      await p.click("#roster-open");
      await p.click("#roster-tab-staff");
      if ((await p.locator(".pass-number").count()) === 0)
        throw Error("Personnel serial missing");
      await p.screenshot({ path: `${out}/focused/${width}-personnel.png` });
      await p.locator('[data-staff="goblin-guard"]').click();
      await p.click("#roster-close");
      await p.click("#shop-open");
      await p.locator(".recruit-rules summary").click();
      const rulesCopy = await p.locator(".recruit-rules p").innerText();
      if (!rulesCopy.includes("미보유 지원") || !rulesCopy.includes("포인트"))
        throw Error("Recruit rules lost");
      const shopLayout = await p.evaluate(audit);
      await p.screenshot({ path: `${out}/focused/${width}-shop-rules.png` });
      await p.click("#shop-tab-items");
      const coins = await p.evaluate(() => meta.coins);
      await p.click("#buy-grade");
      if ((await p.evaluate(() => meta.coins)) !== coins - 20)
        throw Error("Purchase changed");
      await p.click("#shop-close");
      await p.evaluate(() => GamePerformance.setMode(false));
      const reduced = await p
        .locator(".lobby-gobi")
        .evaluate((e) => getComputedStyle(e).animationName);
      if (reduced !== "none") throw Error("Reduced motion ignored");
      await p.emulateMedia({ reducedMotion: "no-preference" });
      const active = await p
        .locator(".lobby-gobi")
        .evaluate((e) => getComputedStyle(e).animationName);
      if (active !== "gobi-breathe") throw Error("Breathing missing");
      await p.click("#menu-open");
      const modalPaused = await p
        .locator(".lobby-gobi")
        .evaluate((e) => getComputedStyle(e).animationName);
      if (modalPaused !== "none") throw Error("Background moves under modal");
      await p.click("#menu-close");
      await p.evaluate(() => GamePerformance.setMode(true));
      const lowPower = await p
        .locator(".lobby-gobi")
        .evaluate((e) => getComputedStyle(e).animationName);
      if (lowPower !== "none") throw Error("Power saving ignored");
      const issues = variants.flatMap((v) =>
        v.issues.map((i) => ({ rule: v.rule, resume: v.resume, ...i })),
      );
      report.push({
        size: [width, height],
        dailyVariants: variants.length,
        issues,
        shopIssues: shopLayout.issues,
        supportAction: true,
        purchase: true,
        rulesDisclosure: true,
        motion: { reduced, active, modalPaused, lowPower },
        errors,
      });
      await p.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(
    out + "/focused/checks.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  if (
    report.some(
      (r) => r.issues.length || r.shopIssues.length || r.errors.length,
    )
  )
    process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
