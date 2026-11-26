import sharp from "sharp";
import { fileURLToPath } from "node:url";

const folder = new URL("../public/icons/", import.meta.url);
const source = fileURLToPath(new URL("../images/brand/point-icon-v2.webp", folder));
for (const [name, size] of [["ph-192-v2.png", 192], ["ph-512-v2.png", 512], ["ph-maskable-512-v2.png", 512], ["ph-apple-touch-v2.png", 180], ["ph-favicon-v2.png", 64], ["point-192.png", 192]]) {
  await sharp(source).resize(size, size).png().toFile(fileURLToPath(new URL(name, folder)));
}
