// everbrew-ui : build.mjs
// 依存ゼロ。src を結合して dist を生成するだけ。
// 圧縮は jsDelivr が .min を自動生成するのでここでは不要。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(join(root, "src", p), "utf8");

mkdirSync(join(root, "dist"), { recursive: true });

// --- アプリシェル束(全 GAS アプリが読む) ---
const css = [src("tokens.css"), src("shell.css"), src("components.css")].join("\n\n");
const js  = src("shell.js");

// --- 進捗ダッシュボード束(型E。render-status.mjs だけが読む) ---
// shell.css を含めない。ダッシュボード専用の数KBを全アプリに配らないため出力を分ける。
const statusCss = [src("tokens.css"), src("status.css")].join("\n\n");
const statusJs  = src("status.js");

const out = {
  "everbrew.css":        css,
  "everbrew.js":         js,
  "everbrew-status.css": statusCss,
  "everbrew-status.js":  statusJs,
};

for (const [name, body] of Object.entries(out)) {
  writeFileSync(join(root, "dist", name), body);
  console.log("built dist/%s (%d bytes)", name, body.length);
}
