"use strict";
/* Runs in the browser. Measures ink and image boxes, not just scrollWidth.
   Decorative silhouettes / badges intentionally layered on portraits are excluded. */
module.exports = function auditLayout() {
  const scope =
      document.querySelector("dialog[open]") ||
      document.querySelector("#app-shell"),
    issues = [];
  const name = (e) =>
    e.id
      ? "#" + e.id
      : e.tagName.toLowerCase() + "." + [...e.classList].join(".");
  const rect = (e) => e.getBoundingClientRect();
  const intersection = (a, b) => ({
    w: Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)),
    h: Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)),
  });
  function visible(e) {
    if (!e || e.closest("[hidden]")) return false;
    const r = rect(e),
      s = getComputedStyle(e);
    if (
      r.width < 1 ||
      r.height < 1 ||
      s.display === "none" ||
      s.visibility === "hidden" ||
      s.opacity === "0"
    )
      return false;
    let clip = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    for (let a = e.parentElement; a; a = a.parentElement) {
      const c = getComputedStyle(a);
      if (
        /auto|scroll|hidden|clip/.test(c.overflow + c.overflowX + c.overflowY)
      ) {
        const ar = rect(a);
        clip = {
          left: Math.max(clip.left, ar.left),
          right: Math.min(clip.right, ar.right),
          top: Math.max(clip.top, ar.top),
          bottom: Math.min(clip.bottom, ar.bottom),
        };
      }
    }
    return intersection(r, clip).w > 1 && intersection(r, clip).h > 1;
  }
  function ink(e) {
    const entries = [],
      walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode,
        parent = node.parentElement;
      if (
        !node.textContent.trim() ||
        !visible(parent) ||
        parent.closest(".locked-mark") ||
        parseFloat(getComputedStyle(parent).fontSize) < 1
      )
        continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects())
        if (r.width > 1 && r.height > 1)
          entries.push({
            r,
            label: node.textContent.trim().slice(0, 55),
            node,
          });
    }
    return entries;
  }
  for (const button of scope.querySelectorAll("button")) {
    if (!visible(button)) continue;
    const b = rect(button),
      text = ink(button);
    if (button.scrollHeight > button.clientHeight + 2)
      issues.push({
        type: "button-vertical-overflow",
        element: name(button),
        client: button.clientHeight,
        scroll: button.scrollHeight,
      });
    for (const t of text)
      if (
        t.r.left < b.left + 1 ||
        t.r.right > b.right - 1 ||
        t.r.top < b.top + 1 ||
        t.r.bottom > b.bottom - 1
      )
        issues.push({
          type: "button-ink-outside",
          element: name(button),
          text: t.label,
        });
    const art = [...button.querySelectorAll("img,canvas")]
      .filter(visible)
      .map((e) => ({ r: rect(e), label: name(e) }));
    for (const t of text)
      for (const a of art) {
        const i = intersection(t.r, a.r);
        if (i.w > 2 && i.h > 2)
          issues.push({
            type: "button-text-art-overlap",
            element: name(button),
            text: t.label,
            art: a.label,
          });
      }
    for (let i = 0; i < text.length; i++)
      for (let j = i + 1; j < text.length; j++) {
        const a = text[i],
          b = text[j];
        if (a.node === b.node) continue;
        const c = intersection(a.r, b.r);
        if (c.w > 2 && c.h > 2)
          issues.push({
            type: "button-text-overlap",
            element: name(button),
            a: a.label,
            b: b.label,
          });
      }
  }
  const zones = [
    [".lobby-art", ".lobby-title,.lobby-gobi,.duo-shortcuts,.duo-companion"],
    [".shop-row", ":scope > img,:scope > canvas,:scope > span,:scope > button"],
    [
      ".staff-pass",
      ".pass-portrait,.pass-open,.pass-job,.pass-role,.pass-meta",
    ],
    [
      ".dossier-hero",
      ":scope > img,:scope > canvas,:scope > h3,:scope > span,:scope > p",
    ],
    [".sheet-head", ":scope > div,:scope > button"],
    [".training-header", ":scope > div,:scope > button"],
    [".ui-dialog-header", ":scope > h2,:scope > button"],
    [".development-sheet > header", ":scope > h2,:scope > button"],
    [".summon-row", ":scope > span,:scope > button"],
    [".skill-row", ":scope > button"],
    [
      "#daily-option",
      ".daily-event-heading > small,#daily-label,#daily-events-open",
    ],
    [
      ".training-character-title",
      ":scope > img,:scope > canvas,:scope > div,:scope > span",
    ],
  ];
  for (const [parent, children] of zones)
    for (const group of scope.querySelectorAll(parent)) {
      const elements = [...group.querySelectorAll(children)].filter(visible);
      for (let i = 0; i < elements.length; i++)
        for (let j = i + 1; j < elements.length; j++) {
          const a = elements[i],
            b = elements[j];
          if (a.contains(b) || b.contains(a)) continue;
          const overlap = intersection(rect(a), rect(b));
          if (overlap.w > 2 && overlap.h > 2)
            issues.push({
              type: "layout-zone-overlap",
              group: name(group),
              a: name(a),
              b: name(b),
            });
        }
    }
  const dialog = document.querySelector("dialog[open]");
  if (dialog) {
    const frame = rect(dialog);
    for (const e of dialog.children) {
      if (!visible(e)) continue;
      const r = rect(e);
      if (
        r.left < frame.left + 1 ||
        r.right > frame.right - 1 ||
        r.top < frame.top + 1 ||
        r.bottom > frame.bottom - 1
      )
        issues.push({
          type: "modal-region-outside",
          element: name(e),
          dialog: dialog.id,
        });
    }
    for (const container of [
      dialog,
      dialog.querySelector("#roster-detail"),
    ].filter(Boolean)) {
      const children = [...container.children].filter(visible);
      for (let i = 0; i < children.length; i++)
        for (let j = i + 1; j < children.length; j++) {
          const a = children[i],
            b = children[j],
            o = intersection(rect(a), rect(b));
          if (o.w > 2 && o.h > 2)
            issues.push({
              type: "modal-regions-overlap",
              a: name(a),
              b: name(b),
              dialog: dialog.id,
            });
        }
    }
  }
  return {
    issues,
    checkedButtons: [...scope.querySelectorAll("button")].filter(visible)
      .length,
  };
};
