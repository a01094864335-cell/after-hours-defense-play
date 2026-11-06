/* Keep the live controls and their listeners; only compose the approved surface. */
(() => {
  if (typeof document.createDocumentFragment !== "function") return;
  const q = (s) => document.querySelector(s),
    lobby = q("#lobby");
  if (!lobby) return;
  const dock = document.createElement("div");
  dock.className = "approved-lobby-dock";
  for (const sel of [
    "#daily-option",
    "#deck-open",
    ".mode-card",
    "#resume-run",
    "#enter-battle",
    ".lobby-links",
  ]) {
    const el = q(sel);
    if (el) dock.append(el);
  }
  lobby.append(dock);
  const pauseBackground = () =>
    document.documentElement.classList.toggle(
      "ui-background-paused",
      document.hidden,
    );
  document.addEventListener("visibilitychange", pauseBackground);
  pauseBackground();
  // Keep the existing live effect node: renderProgress remains its data owner.
  const daily = q("#daily-option"),
    dailyCopy = document.createElement("div"),
    dailyTitle = document.createElement("div");
  dailyCopy.className = "daily-copy";
  dailyTitle.className = "daily-title";
  q(".daily-event-heading > small")?.remove();
  dailyTitle.append(q("#daily-label"));
  dailyCopy.append(dailyTitle, q("#daily-effect"));
  daily.prepend(dailyCopy);
  q("#daily-events-open").setAttribute(
    "aria-label",
    "오늘의 변주 효과와 전체 목록 보기",
  );

  // Recruitment rules stay one tap away, ahead of the purchase action.
  const pack = q(".recruit-shop"),
    rules = pack.querySelector(":scope > p");
  if (rules) {
    const details = document.createElement("details"),
      summary = document.createElement("summary");
    details.className = "recruit-rules";
    const supportRate = Math.round(RECRUIT_SUPPORT_RATE * 100);
    summary.textContent = `일반 ${100 - supportRate}% · 지원 ${supportRate}%`;
    summary.setAttribute("aria-label", `${summary.textContent}. 확률·보장 규칙 펼치기`);
    rules.before(details);
    details.append(summary, rules);
  }


  // A concept: compose the existing shop; purchase and save logic keep ownership.
  const shop = q("#shop"), wallet = q(".shop-wallet");
  shop.classList.add("summon-stage-shop");
  wallet.classList.add("stage-wallet");
  shop.querySelector(".sheet-head").insertBefore(wallet, q("#shop-close"));
  const renderPack = renderRecruitShop;
  let packLedgerSignature = "";
  renderRecruitShop = function (...args) {
    const result = renderPack.apply(this, args);
    if (!shop.open) return result;
    const balance = q("#recruit-balance");
    const signature = balance.textContent;
    if (signature === packLedgerSignature && balance.querySelector(".pack-points")) return result;
    packLedgerSignature = signature;
    const parts = signature.split(" · ");
    if (parts.length < 3) return result;
    const coins = document.createElement("span"), points = document.createElement("span"), pity = document.createElement("span");
    coins.className = "sr-only";
    coins.textContent = parts[0];
    points.className = "pack-points";
    points.textContent = parts[1];
    pity.className = "pack-pity";
    const label = document.createElement("span");
    label.textContent = parts.slice(2).join(" · ");
    const track = document.createElement("span");
    track.className = "pack-pity-track";
    track.setAttribute("aria-hidden", "true");
    const count = missingSupports().length ? profile().pity : SUPPORT_PITY;
    for (let i = 0; i < SUPPORT_PITY; i++) {
      const pip = document.createElement("i");
      pip.classList.toggle("lit", i < count);
      track.append(pip);
    }
    pity.append(label, track);
    balance.replaceChildren(coins, points, pity);
    return result;
  };

  const board = q(".board-stage");
  if (board && typeof renderMeta === "function") {
    const support = document.createElement("div");
    support.id = "approved-battle-support";
    q("#info .help-content").append(support);
    let lastSupport = "";
    const originalRenderMeta = renderMeta;
    renderMeta = function (...args) {
      const result = originalRenderMeta.apply(this, args);
      const id = playing ? activeMerc : meta.equipped;
      const merc = id && mercCatalog[id];
      const signature = merc
        ? id + trainedMercDescription(id, playing)
        : "none";
      if (signature !== lastSupport) {
        lastSupport = signature;
        support.replaceChildren();
        if (merc) {
          const image = document.createElement("img");
          image.src = "assets/pixel/" + merc.file + ".webp";
          image.alt = "";
          const copy = document.createElement("span");
          const title = document.createElement("b");
          title.textContent = merc.name;
          const description = document.createElement("small");
          description.textContent = trainedMercDescription(id, playing);
          copy.append(title, description);
          support.append(image, copy);
        } else support.textContent = "지원 영웅 미편성";
      }
      return result;
    };
    renderMeta();
  }
  const upgrade = q("#upgrade-open");
  if (upgrade) {
    const icon = document.createElement("img");
    icon.src = "assets/ui-v2/icons/gear.svg";
    icon.alt = "";
    const label = document.createElement("span");
    label.textContent = "장비";
    upgrade.replaceChildren(icon, label);
    upgrade.setAttribute("aria-label", "장비 강화");
  }
  const shortcuts = {
    "lobby-story-collection": ["book", "이야기"],
    "journey-summary": ["scroll", "기록"],
    "training-entry": ["sword", "훈련소"],
  };
  // renderJourney replaces the record button contents when its summary changes.
  function refreshShortcutFaces() {
    for (const [id, [iconName, label]] of Object.entries(shortcuts)) {
      const button = q("#" + id);
      if (!button || button.querySelector(".approved-shortcut-face")) continue;
      const face = document.createElement("span");
      face.className = "approved-shortcut-face";
      const icon = document.createElement("img");
      icon.src = "assets/ui-v2/icons/" + iconName + ".svg";
      icon.alt = "";
      const copy = document.createElement("span");
      copy.textContent = label;
      face.append(icon, copy);
      button.append(face);
    }
  }
  refreshShortcutFaces();
  new MutationObserver(refreshShortcutFaces).observe(q(".duo-shortcuts"), {
    childList: true,
    subtree: true,
  });
})();
