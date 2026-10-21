import { combineSelections, MAX_BURGERS } from "./cart.ts";
import { getStockShortages, InsufficientStockError, validateSelection, type Catalog, type Selection } from "./menu.ts";

export function resizeBurgerDrafts(burgers: Selection[], quantity: number): Selection[] {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_BURGERS) {
    throw new Error(`Escolha de 1 a ${MAX_BURGERS} hambúrgueres.`);
  }
  return Array.from({ length: quantity }, (_, index) => ({ ...burgers[index], pao: 1 }));
}

export function burgerIsFinished(burger: Selection, signature: string | undefined) {
  return signature === JSON.stringify(burger);
}

export function nextUnfinishedBurger(burgers: Selection[], signatures: string[], after = -1) {
  for (let offset = 1; offset <= burgers.length; offset++) {
    const index = (after + offset) % burgers.length;
    if (index !== after && !burgerIsFinished(burgers[index], signatures[index])) return index;
  }
  return -1;
}

export function repeatBurgerRecipe(burgers: Selection[], source: number, targets: number[], catalog: Catalog): Selection[] {
  if (!Number.isSafeInteger(source) || source < 0 || source >= burgers.length) throw new Error("Escolha o lanche que deseja repetir.");
  const destinations = new Set(targets);
  if (!destinations.size || [...destinations].some(index => !Number.isSafeInteger(index) || index < 0 || index >= burgers.length || index === source)) {
    throw new Error("Escolha os outros hambúrgueres que receberão esta receita.");
  }
  const recipe = burgers[source];
  validateSelection(recipe, catalog);
  if (catalog.ingredients.some(item => item.category === "Complementos" && recipe[item.id] > 0)) throw new Error("Os acompanhamentos são escolhidos separadamente.");
  const result = burgers.map((burger, index) => destinations.has(index) ? { ...recipe } : burger);
  const shortages = getStockShortages(combineSelections(result), catalog);
  if (shortages.length) throw new InsufficientStockError(shortages);
  return result;
}
