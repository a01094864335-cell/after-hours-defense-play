"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  { execFileSync } = require("node:child_process");
test("open-scene surface, wordless asset family and archived galleries are packaged", () => {
  const root = path.resolve(__dirname, ".."),
    out = fs.mkdtempSync(path.join(os.tmpdir(), "enamel-pages-"));
  try {
    execFileSync(process.execPath, ["scripts/build-pages.cjs", out], {
      cwd: root,
    });
    const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
    assert.match(html, /ui\.css\?v=[a-f0-9]{12}/);
    assert.match(html, /open-scene\.css\?v=[a-f0-9]{12}/);
    assert.match(html, /open-scene\.js\?v=[a-f0-9]{12}/);
    assert.ok(!html.includes('href="gameworld.css'), "Retired framed surface is not loaded");
    for (const retired of [
      "game-ui.bundle.css",
      "enamel-ui.css",
      "visual-pass.css",
      "roomy-buttons.css",
      "play-design.css",
      "approved-ui.css",
      "detail-ui.css",
      "dialog-layout.css",
      "development.css",
    ])
      assert.ok(
        !html.includes('href="' + retired),
        retired + " must not participate in the screen cascade",
      );
    const release = JSON.parse(
      fs.readFileSync(path.join(out, "release-manifest.json")),
    );
    assert.ok(release.files['assets/night-watch/arena.webp']);
    assert.match(html, /battle-art\.js\?v=[a-f0-9]{12}/);
    assert.ok(html.indexOf('src="battle-art.js') < html.indexOf('src="game.js'));
    for (const name of ['slot', 'slot-selected', 'slot-match', 'panel', 'button-gold', 'button-iron']) {
      assert.ok(release.files['assets/night-watch/' + name + '.svg'], 'Watch-room art: ' + name);
    }
    const openScene = JSON.parse(fs.readFileSync(path.join(out, 'assets/open-scene/manifest.json')));
    assert.equal(openScene.textBakedIn, false);
    for (const asset of openScene.assets) {
      assert.equal(asset.text, false);
      assert.ok(release.files['assets/open-scene/' + asset.file], asset.file);
    }
    const surface = fs.readFileSync(path.join(out, 'open-scene.css'), 'utf8');
    for (const match of surface.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g))
      assert.ok(release.files[match[1]], 'Open-scene reference: ' + match[1]);
    const spec = JSON.parse(
      fs.readFileSync(path.join(root, "assets/ui-b/manifest.json")),
    );
    for (const a of spec.assets) {
      assert.ok(release.files[a.png], a.png);
      assert.ok(fs.statSync(path.join(out, a.png)).size > 0);
    }
    assert.ok(release.files["assets/ui-b/gallery.html"]);
    assert.ok(release.files["assets/ui-b/manifest.json"]);
    const screenCSS = fs.readFileSync(path.join(out, "ui.css"), "utf8");
    for (const m of screenCSS.matchAll(/url\(["']?([^"')]+)["']?\)/g))
      assert.ok(release.files[m[1].split("?")[0]], "Screen asset: " + m[1]);
    const css = fs.readFileSync(path.join(out, "enamel-ui.css"), "utf8");
    for (const m of css.matchAll(/url\('([^']+)'\)/g))
      assert.ok(release.files[m[1].split("?")[0]], m[1]);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

