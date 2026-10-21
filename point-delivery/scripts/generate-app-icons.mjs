import sharp from "sharp";
import { fileURLToPath } from "node:url";

const folder = new URL("../public/icons/", import.meta.url);
const source = fileURLToPath(new URL("point.svg", folder));
for (const [name, size] of [["point-192.png", 192], ["point-512.png", 512], ["point-maskable-512.png", 512], ["apple-touch-icon.png", 180]]) {
  await sharp(source).resize(size, size).png().toFile(fileURLToPath(new URL(name, folder)));
}
