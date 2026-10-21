// Read-only pixel inspection: original ImageGen PNGs remain unchanged.
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const previous = JSON.parse(readFileSync("components/ingredient-photos.json", "utf8"));
const sources = Object.entries(previous).map(([id, photo]) => [id, `public/ingredients/${photo.file || `${id}.png`}`]);
const manifest = {};
for (const [id, source] of sources) {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width, top = info.height, right = -1, bottom = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 24) {
        left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left || bottom < top) throw new Error(`No visible pixels in ${id}`);
  // Keep a small antialiasing margin in the CSS/SVG viewport, not an edited file.
  left = Math.max(0, left - 3); top = Math.max(0, top - 3);
  right = Math.min(info.width - 1, right + 3); bottom = Math.min(info.height - 1, bottom + 3);
  manifest[id] = { ...(previous[id].file ? { file: previous[id].file } : {}), width: info.width, height: info.height, crop: { x: left, y: top, width: right - left + 1, height: bottom - top + 1 } };
}
writeFileSync("components/ingredient-photos.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`Inspected ${Object.keys(manifest).length} photographic ingredient assets; originals preserved.`);
