import type { Selection } from "../domain/menu";

export type Crop = { x: number; y: number; width: number; height: number };
export type Photo = { width: number; height: number; crop: Crop; file?: string };
export type FoodLayer = { id: string; photoId: string; key: string; x: number; y: number; width: number; height: number; crop: Crop; quantity: number; rotation: number; closedOffset: { x: number; y: number; rotation: number }; role: "bread" | "filling" | "lid" };
export const ingredientIds = ["carne-hamburguer", "frango", "queijo", "cheddar", "catupiry", "presunto", "bacon", "ovo", "calabresa", "salsicha", "milho-verde", "ervilha", "cebola", "salada", "batata-palha"];
/** Bottom to top: selection history never decides the sandwich's assembly. */
export const assemblyOrder = ["pao-base", "carne-hamburguer", "frango", "calabresa", "salsicha", "queijo", "cheddar", "presunto", "ovo", "bacon", "catupiry", "cebola", "batata-palha", "milho-verde", "ervilha", "salada", "pao-topo"] as const;
const assemblyRank = new Map<string, number>(assemblyOrder.map((id, index) => [id, index]));

/** Whole photographic silhouettes overlap naturally. No food is sliced by a mask. */
export function composeBurger(selection: Selection, photos: Record<string, Photo>) {
  const quantity = (id: string) => Math.max(0, Math.min(4, Math.floor(selection[id] || 0)));
  const count = ingredientIds.reduce((sum, id) => sum + quantity(id), 0);
  const beef = quantity("carne-hamburguer");
  const beefId = photos[`carne-${beef}`] ? `carne-${beef}` : "carne-hamburguer";
  const beefPhoto = photos[beefId];
  const beefWidth = beef === 4 ? 288 : beef === 3 ? 300 : 310;
  const proteinHeight = beef ? beefWidth * beefPhoto.crop.height / beefPhoto.crop.width : quantity("frango") ? 48 + Math.min(12, quantity("frango") * 3) : count ? 28 : 0;
  const proteinBottom = 407;
  const baseBottom = 458;
  const proteinTop = proteinBottom - proteinHeight;
  const extras = count - beef;
  const toppingSeat = quantity("salada") ? -14 : extras ? -9 : 9;
  const roof = count ? proteinTop + toppingSeat - Math.min(9, Math.log2(extras + 1) * 2) : 369;
  const layers: FoodLayer[] = [];
  const closedOffsets: Record<string, readonly [number, number, number]> = {
    "pao-topo": [0, quantity("salada") ? -12 : 0, 0],
    // A closed sandwich reveals small, different edges rather than one tall layer per food.
    frango: [-9, 16, -1], presunto: [-18, 25, -2], bacon: [15, 29, 2],
    calabresa: [-42, 28, -2], salsicha: [45, 25, 2], ovo: [-24, 20, -2],
    catupiry: [-20, 4, 0], cebola: [-12, 12, -1], salada: [0, 2, 0],
  };

  function add(id: string, width: number, center: number, bottom: number, index = 0, role: FoodLayer["role"] = "filling", photoId = id, rotation = 0) {
    const photo = photos[photoId];
    if (!photo) return;
    const crop = { ...photo.crop };
    const height = width * crop.height / crop.width;
    const isGarnish = id === "milho-verde" || id === "ervilha" || id === "batata-palha";
    const [offsetX, offsetY, offsetRotation] = isGarnish ? [center < 200 ? -5 : 5, 7, 0] : closedOffsets[id] ?? [0, 0, 0];
    layers.push({ id, photoId, key: `${id}-${index}`, x: center - width / 2, y: bottom - height, width, height, crop, quantity: quantity(id), rotation, closedOffset: { x: offsetX, y: offsetY, rotation: offsetRotation }, role });
  }

  // A real filling supports these portions. Without protein, use the bread's cut surface.
  const basePhoto = photos["pao-base"];
  const breadSurface = baseBottom - 316 * basePhoto.crop.height / basePhoto.crop.width + 25;
  const garnishBottom = beef || quantity("frango") ? proteinTop + 45 : breadSurface;
  function addGarnishPortions() {
    const bothGrains = quantity("milho-verde") > 0 && quantity("ervilha") > 0;
    for (const id of ["milho-verde", "ervilha"]) {
      const selected = quantity(id);
      if (!selected) continue;
      const center = bothGrains ? id === "milho-verde" ? 140 : 250 : 200;
      const width = bothGrains ? id === "milho-verde" ? 128 : 120 : 136;
      const offsets = [[0, 0, 0], [12, -4, -3], [-16, 4, 4], [24, 2, -4]];
      offsets.slice(0, selected).forEach(([dx, dy, rotation], index) => {
        add(id, width, center + dx, garnishBottom + dy, index, "filling", id, rotation);
      });
    }
    const strawQuantity = quantity("batata-palha");
    if (strawQuantity) {
      // A shallow, cohesive portion behind the grains, never a blanket over the salad.
      const patches = [[200, 0, 190, 0], [182, 3, 150, -3], [217, -1, 146, 3], [200, 5, 130, -2]];
      patches.slice(0, strawQuantity).forEach(([center, dy, width, rotation], index) => {
        add("batata-palha", width, center, garnishBottom - 9 + dy, index, "filling", "batata-palha", rotation);
      });
    }
  }

  if (selection.pao) add("pao-base", 316, 200, baseBottom, 0, "bread");
  if (beef) add("carne-hamburguer", beefWidth, 200, proteinBottom, 0, "filling", beefId);
  if (quantity("frango")) {
    add("frango", 270 + Math.min(15, quantity("frango") * 4), 198, beef ? proteinTop + 54 : 404);
    if (quantity("frango") > 2) add("frango", 151, 245, (beef ? proteinTop + 54 : 404) + 4, 1);
  }
  for (const [id, center] of [["queijo", 198], ["cheddar", 203]] as const) {
    if (quantity(id)) add(id, 313 + quantity(id) * 2, center, proteinTop + 65 + Math.min(5, quantity(id) * 1.5));
  }
  if (quantity("presunto")) add("presunto", 294, 195, proteinTop + 24);
  if (quantity("salsicha")) add("salsicha", 215, 212, proteinTop + 24);
  if (quantity("calabresa")) add("calabresa", 230, 209, proteinTop + 24);
  if (quantity("ovo")) add("ovo", 275, 197, proteinTop + 22);
  if (quantity("bacon")) add("bacon", 300 + Math.min(8, quantity("bacon") * 2), 202, proteinTop + 21);
  if (quantity("catupiry")) add("catupiry", 280, 200, proteinTop + 22);
  addGarnishPortions();
  if (quantity("cebola")) add("cebola", 210 + Math.min(10, quantity("cebola") * 3), 200, proteinTop + 31);
  if (quantity("salada")) add("salada", 328, 200, proteinTop + 19);
  if (selection.pao) add("pao-topo", 320, 200, roof + 5, 0, "lid");

  layers.sort((a, b) => (assemblyRank.get(a.id) ?? 99) - (assemblyRank.get(b.id) ?? 99) || a.key.localeCompare(b.key));

  const lid = layers.find(layer => layer.role === "lid");
  const minBodyY = Math.min(baseBottom, ...layers.filter(layer => layer.role !== "lid").map(layer => layer.y));
  const openLift = lid ? Math.max(88, lid.y + lid.height - minBodyY + 26) : 0;
  const openTop = Math.min(minBodyY, lid ? lid.y - openLift : baseBottom);
  const closedTop = Math.min(baseBottom, ...layers.map(layer => layer.y + layer.closedOffset.y));
  return {
    layers, count, roof, proteinTop, proteinBottom, baseBottom,
    viewBox: "0 0 400 450",
    openLift,
    openShift: 225 - (baseBottom + openTop) / 2,
    closedShift: 225 - (baseBottom + closedTop) / 2,
  };
}
