import { getStockShortages, InsufficientStockError, summarize, validateSelection, type Catalog, type Selection } from "./menu.ts";

export const MAX_BURGERS = 10;
export type BurgerSnapshot = { price: number; items: { name: string; quantity: number }[] };
export function combineSelections(selections: Selection[]): Selection {
  const result: Selection = {};
  for (const selection of selections) for (const [id, quantity] of Object.entries(selection)) result[id] = (result[id] || 0) + quantity;
  return result;
}
export function summarizeCart(burgers: Selection[], extras: Selection, catalog: Catalog) {
  const summaries = burgers.map(burger => summarize(burger, catalog));
  const extrasPrice = summarize(extras, catalog).extras;
  return { valid: burgers.length > 0 && burgers.length <= MAX_BURGERS && summaries.every(s => s.burgerPrice !== undefined) && burgers.every(burger => catalog.ingredients.filter(i => i.category === "Pães").reduce((sum, item) => sum + (burger[item.id] || 0), 0) === 1),
    subtotal: summaries.reduce((sum, s) => sum + (s.burgerPrice || 0), 0) + extrasPrice, extrasPrice, summaries };
}
export function validateCart(burgers: unknown, extras: unknown, catalog: Catalog) {
  if (!Array.isArray(burgers) || !burgers.length || burgers.length > MAX_BURGERS) throw new Error(`Monte de 1 a ${MAX_BURGERS} hambúrgueres por pedido.`);
  if (!extras || typeof extras !== "object" || Array.isArray(extras)) throw new Error("Confira os acompanhamentos.");
  const choices = burgers as Selection[], sides = extras as Selection;
  const recipeRules = { ...catalog, ingredients: catalog.ingredients.map(item => ({ ...item, stock: Number.MAX_SAFE_INTEGER, active: true, featured: true })) };
  for (const burger of choices) {
    validateSelection(burger, recipeRules);
    for (const [id, qty] of Object.entries(burger)) if (qty && catalog.ingredients.find(i => i.id === id)?.category === "Complementos") throw new Error("Selecione os acompanhamentos separados dos hambúrgueres.");
  }
  for (const [id, qty] of Object.entries(sides)) {
    const item = catalog.ingredients.find(i => i.id === id);
    if (!item || item.category !== "Complementos" || !Number.isSafeInteger(qty) || qty < 0 || qty > item.maxQty) throw new Error("Quantidade de acompanhamento inválida.");
    if (qty && item.price === null) throw new Error(`${item.name}: preço ainda não configurado.`);
  }
  const selection = combineSelections([...choices, sides]);
  const shortages = getStockShortages(selection, catalog);
  if (shortages.length) throw new InsufficientStockError(shortages);
  const summary = summarizeCart(choices, sides, catalog);
  const snapshots: BurgerSnapshot[] = choices.map((burger, index) => ({ price: summary.summaries[index].burgerPrice!, items: catalog.ingredients.filter(i => burger[i.id]).map(i => ({ name: i.name, quantity: burger[i.id] })) }));
  // Keep each burger's lines separate: per-ingredient limits apply per burger, not to the whole cart.
  const lines = [...choices, sides].flatMap(part => catalog.ingredients.filter(i => part[i.id]).map(i => ({ id: i.id, name: i.name, quantity: part[i.id] })));
  return { ...summary, selection, snapshots, lines };
}
