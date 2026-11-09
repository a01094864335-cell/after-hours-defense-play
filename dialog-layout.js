"use strict";
/* One owner for modal composition. Existing nodes retain their event handlers.
   Header/context/footer never share the scroll body's grid cells. */
(() => {
  if (typeof document.createDocumentFragment !== "function") return;
  const q = (s) => document.querySelector(s);
  const definitions = {
    "daily-events-dialog": { header: ".sheet-head" },
    equipment: { header: ".sheet-head", context: "#equipment-balance" },
    info: { title: "h2", actions: "#info-close" },
    menu: { title: "h2", close: "#menu-close" },
    leave: { title: "h2", actions: "#leave-confirm,#leave-cancel" },
    shop: {
      header: ".sheet-head",
      context: ".shop-wallet:not(.stage-wallet),#shop-status,.shop-tabs",
      actions: "#buy-staff-pack,#shop-to-roster",
    },
    "story-archive": { header: ".sheet-head", context: "#story-progress" },
    guide: {
      title: "#guide-title",
      actions: "#guide-next,#discount-tutorial-skip",
    },
    perk: { title: "h2", actions: "#perk-back" },
    deck: { header: ".sheet-head" },
    "journey-dialog": { header: "header" },
    "save-transfer-dialog": { header: "header", actions: "#save-restore" },
  };
  function compose(dialog, definition) {
    if (!dialog) return;
    let header =
      dialog.querySelector(":scope > .ui-dialog-header") ||
      dialog.querySelector(definition.header || ":scope > .ui-dialog-header");
    if (!header && definition.title) {
      const title = dialog.querySelector(definition.title);
      if (title) {
        header = document.createElement("header");
        header.className = "ui-dialog-header";
        header.append(title);
        if (definition.close) {
          const close = dialog.querySelector(definition.close);
          if (close) header.append(close);
        }
        dialog.prepend(header);
      }
    }
    let body = dialog.querySelector(":scope > .panel-scroll-body");
    if (!body) {
      body = document.createElement("div");
      body.className = "panel-scroll-body";
      dialog.append(body);
    }
    let footer = dialog.querySelector(":scope > .ui-dialog-actions");
    const actions = definition.actions
      ? [...dialog.querySelectorAll(definition.actions)]
      : [];
    if (actions.length) {
      if (!footer) {
        footer = document.createElement("footer");
        footer.className = "ui-dialog-actions";
        dialog.append(footer);
      }
      for (const action of actions)
        if (action.parentElement !== footer) footer.append(action);
    }
    const context = definition.context
      ? [...dialog.querySelectorAll(definition.context)]
      : [];
    const keep = new Set([header, body, footer, ...context]);
    for (const node of [...dialog.children])
      if (!keep.has(node)) body.append(node);
    // Establish DOM order once; avoid mutation-observer ownership loops.
    const ordered = [header, ...context, body, footer].filter(Boolean);
    if (ordered.some((node, i) => dialog.children[i] !== node))
      dialog.replaceChildren(...ordered);
    if (!dialog.classList.contains("contained-panel"))
      dialog.classList.add("contained-panel");
  }
  function detail() {
    const detail = q("#roster-detail");
    if (
      !detail ||
      detail.hidden ||
      detail.querySelector(":scope > .panel-scroll-body")
    )
      return;
    const actions =
      detail.querySelector(":scope > .live-dossier-actions") ||
      document.createElement("footer");
    actions.className = "live-dossier-actions";
    actions.append(
      ...detail.querySelectorAll(
        ":scope > .staff-action,:scope > #detail-action-status",
      ),
    );
    const body = document.createElement("div");
    body.className = "panel-scroll-body";
    body.append(...[...detail.children].filter((e) => e !== actions));
    detail.append(body);
    if (actions.children.length) detail.append(actions);
  }
  function refresh() {
    for (const [id, definition] of Object.entries(definitions))
      compose(document.getElementById(id), definition);
    for (const notice of document.querySelectorAll("dialog.notice-dialog"))
      compose(notice, { title: "h2", actions: "button" });
    const back = q("#roster-back"),
      head = q("#roster>.sheet-head");
    if (back && head && back.parentElement !== head) head.prepend(back);
    const reveal = q(".recruit-reveal");
    if (reveal?.querySelector(".ref-recruit-actions")) {
      let body = reveal.querySelector(":scope > .panel-scroll-body");
      const actions = reveal.querySelector(".ref-recruit-actions");
      if (!body) {
        body = document.createElement("div");
        body.className = "panel-scroll-body";
        body.append(...[...reveal.children].filter((e) => e !== actions));
        reveal.prepend(body);
      }
    }
    detail();
  }
  for (const id of [
    "daily-events-close",
    "journey-close",
    "save-transfer-close",
    "menu-close",
    "deck-close",
  ]) {
    const button = q("#" + id);
    if (!button) continue;
    button.setAttribute(
      "aria-label",
      button.getAttribute("aria-label") || button.textContent.trim(),
    );
    const icon = document.createElement("img");
    icon.src = "assets/ui-v2/icons/close.svg";
    icon.alt = "";
    button.replaceChildren(icon);
    button.classList.add("ui-close");
  }
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      refresh();
    });
  }).observe(document.body, { childList: true, subtree: true });
  refresh();
})();
