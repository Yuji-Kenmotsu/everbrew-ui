// everbrew-ui : build.mjs
// 依存ゼロ。src を結合して dist を生成するだけ。
// 圧縮は jsDelivr が .min を自動生成するのでここでは不要。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(join(root, "src", p), "utf8");

mkdirSync(join(root, "dist"), { recursive: true });

const css = [src("tokens.css"), src("shell.css"), src("components.css")].join("\n\n");
const js  = src("shell.js");

writeFileSync(join(root, "dist", "everbrew.css"), css);
writeFileSync(join(root, "dist", "everbrew.js"), js);

console.log("built dist/everbrew.css (%d bytes), dist/everbrew.js (%d bytes)",
  css.length, js.length);
