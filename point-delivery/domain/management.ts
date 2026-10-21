export const accompanimentTypes = { refrigerante: "Refrigerante", suco: "Suco", "batata-frita": "Batata frita", outros: "Outros produtos" } as const;
export type AccompanimentType = keyof typeof accompanimentTypes;
export type AccompanimentInput = { id: string; productName: string; name: string; extraType: AccompanimentType; flavor: string; size: string; description: string; price: number; stock: number; lowStock: number; maxQty: number };
export type ManualEntry = { id: string; type: "entrada" | "saida"; description: string; value: number; occurredAt: number; createdAt: number };
export function requiredText(value: unknown, label: string, max = 100) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new Error(`Confira ${label}.`);
  return value.trim();
}
export function integerValue(value: unknown, label: string, min: number, max = 1000000) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) throw new Error(`Confira ${label}.`);
  return value;
}
export function recordId(value: unknown) {
  const id = requiredText(value, "o identificador", 80);
  if (!/^[a-zA-Z0-9-]{3,80}$/.test(id)) throw new Error("Identificador inválido.");
  return id;
}
export function validateAccompaniment(input: Record<string, unknown>): AccompanimentInput {
  if (typeof input.extraType !== "string" || !Object.hasOwn(accompanimentTypes, input.extraType)) throw new Error("Selecione uma categoria de produto válida.");
  const extraType = input.extraType as AccompanimentType;
  const productName = requiredText(input.productName, "o nome ou marca", 70);
  const flavor = ["refrigerante", "suco"].includes(extraType) ? requiredText(input.flavor, "o sabor", 60) : "";
  const size = requiredText(input.size, "o tamanho ou porção", 40);
  const description = input.description == null || input.description === "" ? "" : requiredText(input.description, "a descrição", 200);
  return { id: recordId(input.id), productName, name: [productName, flavor, size].filter(Boolean).join(" · "), extraType, flavor, size, description,
    price: integerValue(input.price, "o preço em centavos", 1), stock: input.stock === undefined ? 0 : integerValue(input.stock, "o estoque inicial", 0),
    lowStock: integerValue(input.lowStock, "o alerta de estoque", 0), maxQty: integerValue(input.maxQty, "o limite por pedido", 1, 99) };
}
export function parseBusinessDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Informe uma data válida.");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 15)); // Noon in Bahia; never shift the selected calendar day.
  if (year < 2000 || year > 2100 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error("Informe uma data válida.");
  return date.getTime();
}
export function validateManualEntry(input: Record<string, unknown>, now = Date.now()): Omit<ManualEntry, "createdAt"> {
  if (input.type !== "entrada" && input.type !== "saida") throw new Error("Selecione entrada ou saída.");
  const occurredAt = parseBusinessDate(input.date);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bahia", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  if (String(input.date) > today) throw new Error("Use hoje ou uma data passada para registrar uma movimentação realizada.");
  return { id: recordId(input.id), type: input.type, description: requiredText(input.description, "a descrição", 200), value: integerValue(input.value, "o valor em centavos", 1), occurredAt };
}
