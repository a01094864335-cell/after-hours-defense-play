'use strict';
/* One art family for the watch room. Assets load only when battle is drawn. */
const NightWatchArt = (() => {
  const art = new Map();
  function get(name) {
    if (!art.has(name)) {
      const image = new Image();
      image.decoding = 'async';
      image.addEventListener?.('load', () => GamePerformance.invalidate());
      image.src = 'assets/night-watch/' + name + (name === 'arena' ? '.webp' : '.svg');
      art.set(name, image);
    }
    return art.get(name);
  }
  function paint(context, name, x, y, width, height) {
    const image = get(name);
    if (!image.complete || !image.naturalWidth) return false;
    context.drawImage(image, x, y, width, height);
    return true;
  }
  return Object.freeze({
    arena: () => get('arena'),
    cell(context, x, y, selected, match) {
      return paint(context, match ? 'slot-match' : selected ? 'slot-selected' : 'slot', x, y, 76, 88);
    },
  });
})();
