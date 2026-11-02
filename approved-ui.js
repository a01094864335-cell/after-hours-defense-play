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
  // The existing live support summary already tracks equipment and cooldowns.
  // Keep that data owner; move the view beside the battle instead of duplicating it.
  const support = q("#merc-slot"), board = q(".board-stage");
  if (support && board) {
    support.classList.add("approved-battle-support");
    board.after(support);
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
