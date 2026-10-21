import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { reserveOrder } from "@/db/order-reservation";
import { ingredients, prices, settings, orders, orderItems, movements, finance, manualFinance } from "@/db/schema";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { buildMonthlyReport, currentMonth } from "@/domain/reporting";
import { validateAccompaniment, validateManualEntry, type ManualEntry } from "@/domain/management";
import { saveAccompaniment, addManualEntry, setProductFeatured } from "@/db/management";
import { canTransition, getStockShortages, InsufficientStockError, validateSelection, type Catalog, type Order, type Selection, type Status, statuses } from "@/domain/menu";

export async function getCatalog(): Promise<Catalog> {
  const db = getDb();
  const [items, tiers, fee] = await Promise.all([db.select().from(ingredients), db.select().from(prices), db.select().from(settings).where(eq(settings.key, "deliveryFee"))]);
  return { ingredients: items, prices: Object.fromEntries(tiers.map(p => [String(p.count), p.value])), deliveryFee: fee[0]?.value ?? null };
}
function stringField(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) throw new Error(`Confira o campo ${label}.`);
  return value.trim();
}
export async function placeOrder(input: Record<string, unknown>) {
  const idempotencyKey = stringField(input.key, "identificador", 16, 80);
  const fingerprint = JSON.stringify({ selection: input.selection, customer: input.customer, phone: input.phone, address: input.address, reference: input.reference, notes: input.notes, expectedTotal: input.expectedTotal });
  const db = getDb();
  const existing = await db.select().from(orders).where(eq(orders.idempotencyKey, idempotencyKey));
  if (existing[0]) { if (existing[0].fingerprint !== fingerprint) throw new Error("Este identificador já pertence a outro pedido. Recarregue a página."); return { code: existing[0].code }; }
  const catalog = await getCatalog();
  const selection = input.selection as Selection;
  const summary = validateSelection(selection, catalog);
  if (catalog.deliveryFee === null) throw new Error("A taxa de entrega ainda precisa ser configurada pela hamburgueria.");
  const total = summary.subtotal + catalog.deliveryFee;
  if (input.expectedTotal !== total) throw new Error("Os preços foram atualizados. Revise o total antes de confirmar novamente.");
  const customer = stringField(input.customer, "nome", 2, 100), phone = stringField(input.phone, "telefone", 10, 20);
  if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ""))) throw new Error("Informe telefone com DDD.");
  const address = stringField(input.address, "endereço", 8, 300), reference = stringField(input.reference, "referência", 2, 200);
  const notes = stringField(input.notes ?? "", "observações", 0, 500);
  const id = crypto.randomUUID(), code = id.slice(0, 6).toUpperCase(), createdAt = Date.now();
  const raw = env.DB!;
  try {
    await reserveOrder(raw, { id, idempotencyKey, fingerprint, code, customer, phone, address, reference, notes, subtotal: summary.subtotal, deliveryFee: catalog.deliveryFee, total, createdAt }, catalog.ingredients.filter(item => selection[item.id]).map(item => ({ id: item.id, name: item.name, quantity: selection[item.id] })));
  } catch {
    const duplicate = await db.select().from(orders).where(eq(orders.idempotencyKey, idempotencyKey));
    if (duplicate[0]?.fingerprint === fingerprint) return { code: duplicate[0].code };
    const shortages = getStockShortages(selection, await getCatalog());
    if (shortages.length) throw new InsufficientStockError(shortages);
    console.error("[orders] reservation persistence failed");
    throw new Error("Não conseguimos confirmar seu pedido agora. Tente novamente em instantes.");
  }
  return { code };
}
export async function getDashboard() {
  const db = getDb();
  const now = Date.now(), month = currentMonth(now);
  const [list, lines, receipts, manual, history, catalog, monthOrders] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200), db.select().from(orderItems),
    db.select({ orderId: finance.orderId, value: finance.value, createdAt: finance.createdAt, customer: orders.customer, phone: orders.phone, code: orders.code }).from(finance).innerJoin(orders, eq(finance.orderId, orders.id)),
    db.select().from(manualFinance).orderBy(desc(manualFinance.occurredAt)),
    db.select().from(movements).orderBy(desc(movements.createdAt)).limit(30), getCatalog(),
    db.select({ id: orders.id, status: orders.status, createdAt: orders.createdAt }).from(orders).where(and(gte(orders.createdAt, month.start), lt(orders.createdAt, month.end))),
  ]);
  const manualEntries = manual as ManualEntry[];
  return { orders: list.map(o => ({ ...o, status: o.status as Status, items: lines.filter(l => l.orderId === o.id).map(l => ({ name: l.name, quantity: l.quantity })) })) as Order[],
    finance: receipts.map(({ phone: _phone, ...receipt }) => receipt), manualFinance: manualEntries, movements: history, catalog,
    report: buildMonthlyReport(monthOrders, receipts, manualEntries, now) };
}
export async function updateStatus(id: string, next: Status) {
  if (!statuses.includes(next)) throw new Error("Status inválido.");
  const db = getDb(); const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order || !canTransition(order.status as Status, next)) throw new Error("Esta alteração de status não é permitida.");
  await env.DB!.prepare("UPDATE orders SET status=? WHERE id=? AND status=?").bind(next, id, order.status).run();
}
export async function updateCatalog(input: Record<string, unknown>) {
  const raw = env.DB!;
  const kind = input.kind;
  const value = input.value;
  if (kind === "featured") {
    if (typeof input.id !== "string" || typeof value !== "boolean") throw new Error("Informe o produto e se deve aparecer nos acompanhamentos.");
    await setProductFeatured(raw, input.id, value);
    return;
  }
  if (kind === "accompaniment") {
    if (typeof input.create !== "boolean") throw new Error("Operação de cadastro inválida.");
    await saveAccompaniment(raw, validateAccompaniment(input), input.create);
    return;
  }
  if (kind === "manual-finance") {
    await addManualEntry(raw, validateManualEntry(input));
    return;
  }
  if (kind === "availability") {
    if (typeof input.id !== "string" || !input.id || typeof value !== "boolean") throw new Error("Informe o ingrediente e a disponibilidade desejada.");
    const result = await raw.prepare("UPDATE ingredients SET active=? WHERE id=?").bind(value ? 1 : 0, input.id).run();
    if (!result.meta.changes) throw new Error("Ingrediente não encontrado.");
    return;
  }
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 1000000) throw new Error("Informe um valor válido, maior ou igual a zero.");
  if (kind === "stock") {
    const id = String(input.id);
    const [item] = await getDb().select().from(ingredients).where(eq(ingredients.id, id));
    if (!item) throw new Error("Ingrediente não encontrado.");
    const reason = stringField(input.reason, "motivo do ajuste", 3, 200);
    await raw.batch([raw.prepare("INSERT INTO movements (ingredient_id,delta,reason,created_at) SELECT id, ?-stock, ?, ? FROM ingredients WHERE id=?").bind(value, reason, Date.now(), id), raw.prepare("UPDATE ingredients SET stock=? WHERE id=?").bind(value, id)]);
  } else if (kind === "price") {
    const count = Number(input.id); if (!Number.isInteger(count) || count < 3 || count > 15) throw new Error("Faixa inválida.");
    await raw.prepare("INSERT INTO prices (count,value) VALUES (?,?) ON CONFLICT(count) DO UPDATE SET value=excluded.value").bind(count, value).run();
  } else if (kind === "delivery") {
    await raw.prepare("INSERT INTO settings (key,value) VALUES ('deliveryFee',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(value).run();
  } else if (kind === "extra") {
    await raw.prepare("UPDATE ingredients SET price=? WHERE id=? AND category='Complementos'").bind(value, String(input.id)).run();
  } else throw new Error("Operação inválida.");
}
