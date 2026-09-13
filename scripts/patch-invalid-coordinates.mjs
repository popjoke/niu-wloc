import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const finiteCoordinate =
  'Number.isFinite(Number(e.longitude))&&Number.isFinite(Number(e.latitude))&&Math.abs(Number(e.latitude))<=90&&Math.abs(Number(e.longitude))<=180&&!(0===Number(e.longitude)&&0===Number(e.latitude))';

const patches = [
  {
    file: "dist/wloc-settings.js",
    replacements: [
      [
        'function l(e){return parseFloat(String(e||"0").replace(",","."))}',
        'function l(e){return null==e||""===String(e).trim()?NaN:parseFloat(String(e).replace(",","."))}',
      ],
      [
        'e&&"object"==typeof e&&e.longitude&&e.latitude?',
        `e&&"object"==typeof e&&${finiteCoordinate}?`,
      ],
    ],
  },
  {
    file: "dist/wloc.js",
    replacements: [
      [
        'if(e&&"object"==typeof e)return e',
        `if(e&&"object"==typeof e&&${finiteCoordinate})return e`,
      ],
      [
        'a.longitude&&(r.longitude=parseFloat(a.longitude)),a.latitude&&(r.latitude=parseFloat(a.latitude))',
        'Number.isFinite(Number(a.longitude))&&(r.longitude=parseFloat(a.longitude)),Number.isFinite(Number(a.latitude))&&(r.latitude=parseFloat(a.latitude))',
      ],
    ],
  },
];

for (const { file, replacements } of patches) {
  const target = path.join(root, file);
  let content = await readFile(target, "utf8");
  for (const [from, to] of replacements) {
    const count = content.split(from).length - 1;
    if (count !== 1) throw new Error(`${file}: expected one replacement, found ${count}: ${from}`);
    content = content.replace(from, to);
  }
  const marker = "Niu WLOC patch: reject invalid persisted coordinates";
  if (!content.includes(marker)) {
    content = `/* ${marker}; 2026-09-14 */\n${content}`;
  }
  await writeFile(target, content);
  console.log(`已修补 ${file}`);
}
