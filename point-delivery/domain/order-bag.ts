import { burgerIsFinished, repeatBurgerRecipe, resizeBurgerDrafts } from "./assembly-flow.ts";
import { combineSelections, MAX_BURGERS } from "./cart.ts";
import { getStockShortages, InsufficientStockError, type Catalog, type Selection } from "./menu.ts";

export type BagBurgerState = { burgers: Selection[]; recipients: string[]; signatures: string[]; active: number };
export type BagBurgerGroup = { key: string; indices: number[]; recipe: Selection };

export function groupBagBurgers(state: BagBurgerState): BagBurgerGroup[] {
  const groups = new Map<string, BagBurgerGroup>();
  state.burgers.forEach((recipe, index) => {
    if (!burgerIsFinished(recipe, state.signatures[index])) return;
    const key = JSON.stringify(Object.entries(recipe).filter(([, quantity]) => quantity > 0).sort(([a], [b]) => a.localeCompare(b)));
    const group = groups.get(key);
    if (group) group.indices.push(index);
    else groups.set(key, { key, indices: [index], recipe });
  });
  return [...groups.values()];
}

function withoutBurgers(state: BagBurgerState, removed: Set<number>): BagBurgerState {
  const kept = state.burgers.map((_, index) => index).filter(index => !removed.has(index));
  if (!kept.length) return { burgers: [{ pao: 1 }], recipients: [""], signatures: [""], active: 0 };
  const active = kept.includes(state.active) ? kept.indexOf(state.active) : Math.min(kept.filter(index => index < state.active).length, kept.length - 1);
  return { burgers: kept.map(index => ({ ...state.burgers[index] })), recipients: kept.map(index => state.recipients[index] || ""), signatures: kept.map(index => state.signatures[index] || ""), active };
}

export function removeBagBurger(state: BagBurgerState, index: number): BagBurgerState {
  if (!Number.isSafeInteger(index) || index < 0 || index >= state.burgers.length) throw new Error("Escolha o hambúrguer que deseja remover.");
  return withoutBurgers(state, new Set([index]));
}

export function changeBagBurgerQuantity(state: BagBurgerState, source: number, quantity: number, catalog: Catalog, extras: Selection = {}): BagBurgerState {
  const group = groupBagBurgers(state).find(entry => entry.indices.includes(source));
  if (!group || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > MAX_BURGERS) throw new Error(`Escolha até ${MAX_BURGERS} hambúrgueres por pedido.`);
  if (quantity <= group.indices.length) return withoutBurgers(state, new Set(group.indices.slice(quantity)));
  const additional = quantity - group.indices.length;
  if (state.burgers.length + additional > MAX_BURGERS) throw new Error(`O pedido pode ter até ${MAX_BURGERS} hambúrgueres.`);
  const targets = Array.from({ length: additional }, (_, index) => state.burgers.length + index);
  const burgers = repeatBurgerRecipe(resizeBurgerDrafts(state.burgers, state.burgers.length + additional), source, targets, catalog);
  const shortages = getStockShortages(combineSelections([...burgers, extras]), catalog);
  if (shortages.length) throw new InsufficientStockError(shortages);
  return { burgers, recipients: [...state.recipients, ...targets.map(() => "")], signatures: [...state.burgers.map((_, index) => state.signatures[index] || ""), ...targets.map(index => JSON.stringify(burgers[index]))], active: state.active };
}
