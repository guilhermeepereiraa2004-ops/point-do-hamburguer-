export type Ingredient = { id: string; name: string; category: string; unit: string; stock: number; lowStock: number; maxQty: number; price: number | null; active: boolean; extraType?: string | null; productName?: string | null; flavor?: string | null; size?: string | null; featured?: boolean; description?: string | null };
export const isAccompanimentFeatured = (item: Ingredient) => item.category === "Complementos" && Boolean(item.featured);
const offered = (item: Ingredient) => item.active && (item.category !== "Complementos" || isAccompanimentFeatured(item));
export const isIngredientAvailable = (item: Ingredient) => offered(item) && item.stock > 0;
export type Catalog = { ingredients: Ingredient[]; prices: Record<string, number>; deliveryFee: number | null };
export type Selection = Record<string, number>;
export const accompanimentChoices = (items: Ingredient[], selection: Selection) => items.filter(item => item.category === "Complementos" && (isAccompanimentFeatured(item) || (selection[item.id] || 0) > 0));
export type StockShortage = { id: string; name: string; unit: string; requested: number; available: number };
export function getStockShortages(selection: Selection, catalog: Catalog): StockShortage[] {
  return catalog.ingredients.flatMap(item => {
    const requested = selection[item.id] || 0;
    const available = offered(item) ? item.stock : 0;
    return requested > available ? [{ id: item.id, name: item.name, unit: item.unit, requested, available }] : [];
  });
}
export class InsufficientStockError extends Error {
  readonly shortages: StockShortage[];
  constructor(shortages: StockShortage[]) {
    super(`Ajuste os ingredientes indisponíveis: ${shortages.map(item => `${item.name} (${item.available} disponível, ${item.requested} no pedido)`).join("; ")}.`);
    this.name = "InsufficientStockError";
    this.shortages = shortages;
  }
}
export const statuses = ["recebido", "preparo", "entrega", "concluido", "cancelado"] as const;
export type Status = typeof statuses[number];
export const statusLabels: Record<Status, string> = { recebido: "Recebido", preparo: "Em preparo", entrega: "Saiu para entrega", concluido: "Concluído", cancelado: "Cancelado" };
export const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
export const ingredientNames = [
  ["carne-hamburguer", "Carne de hambúrguer", "Proteínas", "unidade"], ["frango", "Frango", "Proteínas", "porção"],
  ["queijo", "Queijo", "Queijos", "unidade"], ["cheddar", "Cheddar", "Queijos", "unidade"], ["catupiry", "Catupiry", "Queijos", "unidade"],
  ["presunto", "Presunto", "Extras", "unidade"], ["bacon", "Bacon", "Extras", "porção"], ["ovo", "Ovo", "Extras", "unidade"],
  ["calabresa", "Calabresa", "Extras", "porção"], ["salsicha", "Salsicha", "Extras", "porção"], ["milho-verde", "Milho verde", "Extras", "porção"],
  ["ervilha", "Ervilha", "Extras", "porção"], ["cebola", "Cebola", "Extras", "porção"], ["salada", "Salada", "Extras", "porção"], ["batata-palha", "Batata palha", "Extras", "porção"],
];
export function countItems(selection: Selection, catalog: Catalog) {
  return catalog.ingredients.filter(i => ["Proteínas", "Queijos", "Extras"].includes(i.category)).reduce((n, i) => n + (selection[i.id] || 0), 0);
}
export function summarize(selection: Selection, catalog: Catalog) {
  const count = countItems(selection, catalog);
  const burgerPrice = catalog.prices[String(count)];
  const extras = catalog.ingredients.filter(i => i.category === "Complementos").reduce((n, i) => n + (selection[i.id] || 0) * (i.price || 0), 0);
  return { count, burgerPrice, extras, subtotal: (burgerPrice || 0) + extras };
}
export function validateSelection(selection: Selection, catalog: Catalog) {
  if (!selection || typeof selection !== "object" || Array.isArray(selection)) throw new Error("Escolha os ingredientes do seu hambúrguer.");
  for (const [id, qty] of Object.entries(selection)) {
    const item = catalog.ingredients.find(i => i.id === id);
    if (!item || !Number.isInteger(qty) || qty < 0 || qty > item.maxQty) throw new Error("Quantidade ou ingrediente inválido.");
    if (qty && item.category === "Complementos" && item.price === null) throw new Error(`${item.name}: preço ainda não configurado.`);
  }
  const shortages = getStockShortages(selection, catalog);
  if (shortages.length) throw new InsufficientStockError(shortages);
  const bread = catalog.ingredients.filter(i => i.category === "Pães").reduce((n, i) => n + (selection[i.id] || 0), 0);
  if (bread !== 1) throw new Error("Selecione um pão.");
  const summary = summarize(selection, catalog);
  if (summary.burgerPrice === undefined) throw new Error("Escolha entre 3 e 15 itens para usar a tabela de preços.");
  return summary;
}
export function canTransition(from: Status, to: Status) {
  return from === to || ({ recebido: ["preparo", "cancelado"], preparo: ["entrega", "cancelado"], entrega: ["concluido", "cancelado"], concluido: [], cancelado: [] } as Record<Status, string[]>)[from]?.includes(to);
}
export type Order = { id: string; code: string; customer: string; phone: string; address: string; reference: string; notes: string; status: Status; subtotal: number; deliveryFee: number; total: number; createdAt: number; burgers?: { price: number; items: { name: string; quantity: number }[] }[]; extras?: { name: string; quantity: number }[]; items: { name: string; quantity: number }[] };
