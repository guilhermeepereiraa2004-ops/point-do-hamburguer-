import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const photos = JSON.parse(await readFile(new URL("components/ingredient-photos.json", root), "utf8"));
const directory = new URL("public/ingredients/optimized/", root);
const heroDirectory = new URL("public/images/optimized/", root);
await Promise.all([mkdir(directory, { recursive: true }), mkdir(heroDirectory, { recursive: true })]);
const ingredients = {}, processed = new Map();
let originalBytes = 0, previewBytes = 0, thumbnailBytes = 0;
for (const [id, photo] of Object.entries(photos)) {
  const filename = photo.file || `${id}.png`;
  if (!processed.has(filename)) {
    const input = await readFile(new URL(`public/ingredients/${filename}`, root));
    const hash = createHash("sha256").update(input).update("menu-webp-v1-896-256-q82-76").digest("hex").slice(0, 12);
    const base = filename.replace(/\.png$/, "");
    const paths = {};
    originalBytes += input.length;
    for (const [kind, width, quality] of [["preview", 896, 82], ["thumbnail", 256, 76]]) {
      const name = `${base}.${hash}.${kind}.webp`;
      const output = new URL(name, directory);
      await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality, alphaQuality: 100, effort: 6 }).toFile(fileURLToPath(output));
      paths[kind] = `/ingredients/optimized/${name}`;
      const size = (await stat(output)).size;
      if (kind === "preview") previewBytes += size; else thumbnailBytes += size;
    }
    processed.set(filename, paths);
  }
  ingredients[id] = processed.get(filename);
}
const heroInput = await readFile(new URL("public/burger-hero.png", root));
const heroHash = createHash("sha256").update(heroInput).update("hero-webp-v1-q84").digest("hex").slice(0, 12);
const heroMetadata = await sharp(heroInput).metadata();
const hero = { width: heroMetadata.width, height: heroMetadata.height, src: "", srcSet: "" };
const variants = [];
let heroBytes = 0;
for (const width of [480, 960]) {
  const name = `burger-hero.${heroHash}.${width}.webp`;
  const output = new URL(name, heroDirectory);
  await sharp(heroInput).resize({ width, withoutEnlargement: true }).webp({ quality: 84, alphaQuality: 100, effort: 6 }).toFile(fileURLToPath(output));
  const src = `/images/optimized/${name}`;
  variants.push(`${src} ${width}w`);
  hero.src = src;
  heroBytes += (await stat(output)).size;
}
hero.srcSet = variants.join(", ");
await writeFile(new URL("components/menu-image-assets.json", root), JSON.stringify({ ingredients, hero }, null, 2) + "\n");
console.log(JSON.stringify({ uniqueIngredientImages: processed.size, originalBytes, previewBytes, thumbnailBytes, heroOriginalBytes: heroInput.length, heroVariantsBytes: heroBytes }));
