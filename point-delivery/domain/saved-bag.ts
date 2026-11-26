import { burgerIsFinished } from "./assembly-flow.ts";
import { MAX_BURGERS } from "./cart.ts";
import { validateSelection, type Catalog, type Selection } from "./menu.ts";
import type { BagBurgerState } from "./order-bag.ts";

export const BAG_STORAGE_KEY = "point:order-bag:v1";
export type SavedBagState = BagBurgerState & { extras: Selection; menuOnly: boolean; step: number };
export type RestoredBagState = SavedBagState & { changed: boolean };
const forbiddenIds = new Set(["__proto__", "constructor", "prototype"]);
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const positive = (selection: Selection): Selection => Object.fromEntries(Object.entries(selection).filter(([, quantity]) => quantity > 0).sort(([a], [b]) => a.localeCompare(b)));

export function emptySavedBag(): RestoredBagState {
  return { burgers: [{ pao: 1 }], recipients: [""], signatures: [], active: 0, extras: {}, menuOnly: false, step: 0, changed: false };
}

export function serializeSavedBag(state: SavedBagState): string | null {
  const hasItems = state.burgers.length > 1 || state.burgers.some(recipe => Object.entries(recipe).some(([id, quantity]) => id !== "pao" && quantity > 0)) || Object.values(state.extras).some(quantity => quantity > 0);
  if (!hasItems) return null;
  return JSON.stringify({ version: 1, burgers: state.burgers.map((recipe, index) => ({ items: positive(recipe), finished: burgerIsFinished(recipe, state.signatures[index]), recipient: state.recipients[index] || "" })), extras: positive(state.extras), active: state.active, menuOnly: state.menuOnly, step: state.step });
}

function readSelection(value: unknown): Selection | null {
  if (!record(value) || Object.keys(value).length > 128) return null;
  for (const [id, quantity] of Object.entries(value)) {
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(id) || forbiddenIds.has(id) || typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 99) return null;
  }
  return positive(value as Selection);
}

export function restoreSavedBag(raw: string | null, catalog: Catalog): RestoredBagState | null {
  if (raw === null || raw.length > 64000) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!record(data) || data.version !== 1 || !Array.isArray(data.burgers) || !data.burgers.length || data.burgers.length > MAX_BURGERS) return null;
    const extras = readSelection(data.extras);
    if (!extras) return null;
    const state = emptySavedBag();
    state.burgers = []; state.recipients = []; state.signatures = [];
    const products = new Map(catalog.ingredients.map(item => [item.id, item]));
    const recipeRules = { ...catalog, ingredients: catalog.ingredients.map(item => ({ ...item, stock: Number.MAX_SAFE_INTEGER, active: true, featured: true })) };
    for (const saved of data.burgers) {
      if (!record(saved) || typeof saved.finished !== "boolean" || typeof saved.recipient !== "string" || saved.recipient.length > 60) return null;
      const selection = readSelection(saved.items);
      if (!selection || selection.pao !== 1) return null;
      let recipeChanged = false;
      const recipe: Selection = {};
      for (const [id, quantity] of Object.entries(selection)) {
        const item = products.get(id);
        if (!item || item.category === "Complementos") {
          if (id === "pao") recipe.pao = 1;
          recipeChanged = true; continue;
        }
        const allowed = Math.min(quantity, item.maxQty);
        if (allowed > 0) recipe[id] = allowed;
        if (allowed !== quantity) recipeChanged = true;
      }
      let finished = saved.finished && !recipeChanged;
      if (finished) {
        try { validateSelection(recipe, recipeRules); }
        catch { finished = false; recipeChanged = true; }
      }
      const recipient = /[\u0000-\u001f\u007f]/.test(saved.recipient) ? "" : saved.recipient;
      state.burgers.push(recipe); state.recipients.push(recipient); state.signatures.push(finished ? JSON.stringify(recipe) : "");
      state.changed ||= recipeChanged || recipient !== saved.recipient;
    }
    for (const [id, quantity] of Object.entries(extras)) {
      const item = products.get(id);
      if (!item || item.category !== "Complementos") { state.changed = true; continue; }
      const allowed = Math.min(quantity, item.maxQty);
      if (allowed > 0) state.extras[id] = allowed;
      if (allowed !== quantity) state.changed = true;
    }
    state.active = Number.isSafeInteger(data.active) && Number(data.active) >= 0 && Number(data.active) < state.burgers.length ? Number(data.active) : 0;
    state.menuOnly = data.menuOnly === true && state.burgers.every(recipe => Object.keys(recipe).every(id => id === "pao"));
    state.step = [0, 1, 2].includes(Number(data.step)) ? Number(data.step) : 0;
    if (state.step === 2 && !state.menuOnly && (state.signatures.some(signature => !signature) || state.burgers.length > 1 && state.recipients.some(name => !name))) state.step = 0;
    return state;
  } catch { return null; }
}

type StoragePort = { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void; removeItem: (key: string) => void };
export function createBagStorage(getStorage: () => StoragePort) {
  let current: string | null = null;
  let lastWritten: string | null | undefined;
  function commit() {
    if (current === lastWritten) return;
    try {
      const storage = getStorage();
      if (current === null) storage.removeItem(BAG_STORAGE_KEY); else storage.setItem(BAG_STORAGE_KEY, current);
      lastWritten = current;
    } catch { /* Keep the in-memory bag usable when browser storage is unavailable. */ }
  }
  return {
    read() { try { current = lastWritten = getStorage().getItem(BAG_STORAGE_KEY); return current; } catch { return null; } },
    save(value: string | null) { current = value; commit(); },
    acceptRemote(value: string | null) { current = lastWritten = value; },
    flush: commit,
    clear() { current = null; lastWritten = undefined; commit(); },
  };
}
