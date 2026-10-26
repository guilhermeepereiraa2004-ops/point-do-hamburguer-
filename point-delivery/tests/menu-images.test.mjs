import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { composeBurger, ingredientIds } from "../components/burger-composition.ts";

const photos = JSON.parse(readFileSync(new URL("../components/ingredient-photos.json", import.meta.url), "utf8"));
const assets = JSON.parse(readFileSync(new URL("../components/menu-image-assets.json", import.meta.url), "utf8"));
const path = src => fileURLToPath(new URL(`../public${src}`, import.meta.url));

test("all menu previews and thumbnails retain transparent canvases and stay within a small transfer budget", async () => {
  const seen = new Set();
  let originalBytes = 0, previewBytes = 0, thumbnailBytes = 0;
  for (const [id, photo] of Object.entries(photos)) {
    const mapped = assets.ingredients[id];
    assert.ok(mapped, `missing ${id}`);
    if (seen.has(mapped.preview)) continue;
    seen.add(mapped.preview);
    const original = new URL(`../public/ingredients/${photo.file || id+'.png'}`, import.meta.url);
    const originalMeta = await sharp(fileURLToPath(original)).metadata();
    originalBytes += statSync(original).size;
    for (const [kind, maxWidth] of [["preview",896],["thumbnail",256]]) {
      const file = path(mapped[kind]), metadata = await sharp(file).metadata();
      assert.equal(metadata.format,"webp");
      assert.ok(metadata.width<=maxWidth);
      assert.ok(Math.abs(metadata.height - metadata.width * photo.height/photo.width)<=1);
      assert.equal(metadata.hasAlpha,originalMeta.hasAlpha);
      if (kind === "preview") previewBytes+=statSync(file).size; else thumbnailBytes+=statSync(file).size;
    }
  }
  assert.ok(previewBytes < originalBytes * .2,"preview transfer must shrink by at least 80%");
  assert.ok(thumbnailBytes < originalBytes * .04,"thumbnail transfer must shrink by at least 96%");
  for (let quantity=1;quantity<=4;quantity++) {
    const selection={pao:1,...Object.fromEntries(ingredientIds.map(id=>[id,quantity]))};
    for(const layer of composeBurger(selection,photos).layers) assert.ok(assets.ingredients[layer.photoId],`missing mounted layer ${layer.photoId}`);
  }
});

test("hero has smaller responsive WebP variants without changing its aspect ratio", async () => {
  const original=statSync(new URL("../public/burger-hero.png",import.meta.url)).size;
  for(const variant of assets.hero.srcSet.split(", ")) {
    const [src,size]=variant.split(" "), file=path(src), metadata=await sharp(file).metadata();
    assert.equal(metadata.format,"webp");
    assert.equal(metadata.width,Number(size.slice(0,-1)));
    assert.ok(Math.abs(metadata.height-metadata.width*assets.hero.height/assets.hero.width)<=1);
    assert.ok(statSync(file).size<original*.2);
  }
});
