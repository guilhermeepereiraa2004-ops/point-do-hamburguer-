import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Miniflare } from "miniflare";
import { validateAccompaniment, validateManualEntry, parseBusinessDate } from "../domain/management.ts";
import { buildMonthlyReport, currentMonth, inFinancialPeriod } from "../domain/reporting.ts";
import { saveAccompaniment, addManualEntry, setProductFeatured } from "../db/management.ts";
import { reserveOrder } from "../db/order-reservation.ts";
import { validateSelection, accompanimentChoices, isIngredientAvailable, getStockShortages } from "../domain/menu.ts";

const now = Date.parse("2026-10-20T15:00:00Z");
const friesMenu = JSON.parse(readFileSync(new URL("../data/fries-menu.json", import.meta.url), "utf8"));
const beverage = (overrides = {}) => validateAccompaniment({ id: crypto.randomUUID(), extraType: "refrigerante", productName: "Bebida de teste", flavor: "Cola", size: "Lata 350 ml", price: 600, stock: 2, lowStock: 1, maxQty: 4, ...overrides });
async function fixture(t, beforeFeatured) {
  const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("test")}}', compatibilityDate: "2026-05-15", d1Databases: ["DB"] });
  t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB");
  const journal = JSON.parse(readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"));
  for (const migration of journal.entries) {
    if (migration.tag === "0003_menu_featured" && beforeFeatured) await beforeFeatured(db);
    for (const sql of readFileSync(new URL(`../drizzle/${migration.tag}.sql`, import.meta.url), "utf8").split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean)) await db.prepare(sql).run();
  }
  return db;
}
const order = (id, total) => ({ id, idempotencyKey: id, fingerprint: "fixture", code: "QAONLY", customer: "CLIENTE DE TESTE", phone: "00000000000", address: "Sem entrega: teste automatizado", reference: "Teste isolado", notes: "Não produzir", subtotal: total, deliveryFee: 0, total, createdAt: now });

test("the owner's eight fries portions retain toppings and prices without inventing stock or duplicating on retry", async t => {
  const db = await fixture(t);
  assert.equal(new Set(friesMenu.map(i => i.id)).size, 8);
  assert.deepEqual(friesMenu.map(i => i.price), [2500, 2700, 2700, 2700, 2800, 2800, 2800, 3000]);
  for (const portion of friesMenu) {
    const item = validateAccompaniment({ ...portion, extraType: "batata-frita", size: "Porção", stock: 0, lowStock: 5, maxQty: 4 });
    await saveAccompaniment(db, item, true); await saveAccompaniment(db, item, true);
    await setProductFeatured(db, item.id, true);
    const saved = await db.prepare("SELECT * FROM ingredients WHERE id=?").bind(item.id).first();
    assert.equal(saved.description, portion.description); assert.equal(saved.price, portion.price);
    assert.equal(saved.stock, 0); assert.equal(isIngredientAvailable(saved), false);
    await assert.rejects(saveAccompaniment(db, { ...item, description: "Outra cobertura" }, true), /outros dados/);
    await saveAccompaniment(db, { ...item, description: "Descrição editada", stock: 99 }, false);
    const edited = await db.prepare("SELECT description,stock,featured FROM ingredients WHERE id=?").bind(item.id).first();
    assert.deepEqual(edited, { description: "Descrição editada", stock: 0, featured: 1 });
  }
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM ingredients").first()).count, 8);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM movements").first()).count, 8);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM orders").first()).count, 0);
  assert.throws(() => validateAccompaniment({ ...friesMenu[0], extraType: "batata-frita", size: "Porção", lowStock: 5, maxQty: 4, description: "x".repeat(201) }), /descrição/);
});

test("month boundaries use Bahia time, including the UTC hours belonging to the previous month", () => {
  assert.equal(currentMonth(Date.parse("2026-11-01T02:59:59Z")).label, "outubro de 2026");
  assert.equal(currentMonth(Date.parse("2026-11-01T03:00:00Z")).start, Date.parse("2026-11-01T03:00:00Z"));
  assert.equal(currentMonth(Date.parse("2026-12-31T15:00:00Z")).end, Date.parse("2027-01-01T03:00:00Z"));
});
test("monthly analytics use all orders, exclude cancellations, show weekday ties and separate manual cash from sales", () => {
  const orders = Array.from({ length: 220 }, (_, i) => ({ id: String(i), status: "concluido", createdAt: Date.parse("2026-10-19T18:00:00Z") }));
  orders.push({ id: "cancelled", status: "cancelado", createdAt: now }, { id: "lastMonth", status: "concluido", createdAt: Date.parse("2026-10-01T02:59:00Z") });
  const sales = [
    { orderId: "a", customer: "Ana", phone: "(71) 99999-1111", value: 2000, createdAt: now },
    { orderId: "b", customer: "Ana Silva", phone: "+55 71 99999-1111", value: 3000, createdAt: now },
    { orderId: "c", customer: "Bia", phone: "71999992222", value: 6000, createdAt: now },
    { orderId: "d", customer: "Anterior", phone: "71999993333", value: 9000, createdAt: Date.parse("2026-10-01T02:00:00Z") },
  ];
  const report = buildMonthlyReport(orders, sales, [{ id: "cash", type: "entrada", description: "Caixa", value: 1000, occurredAt: now, createdAt: now }, { id: "cost", type: "saida", description: "Custo", value: 400, occurredAt: now, createdAt: now }], now);
  assert.equal(report.orderCount, 220); assert.equal(report.completedCount, 3);
  assert.equal(report.revenue, 11000); assert.equal(report.received, 12000); assert.equal(report.balance, 11600); assert.equal(report.averageTicket, 3667);
  assert.deepEqual(report.busiestDays, ["Segunda"]); assert.equal(report.busiestCount, 220);
  assert.deepEqual(report.topCustomer, { name: "Ana Silva", count: 2, value: 5000, tiedCustomers: 0 });
  const tied = buildMonthlyReport([{ id: "mon", status: "recebido", createdAt: Date.parse("2026-10-19T18:00:00Z") }, { id: "tue", status: "recebido", createdAt: now }], [], [], now);
  assert.deepEqual(tied.busiestDays, ["Segunda", "Terça"]);
  const empty = buildMonthlyReport([], [], [], now); assert.equal(empty.averageTicket, 0); assert.equal(empty.topCustomer, null); assert.deepEqual(empty.busiestDays, []);
});
test("finance periods include today's dated manual entries even before noon and use seven local calendar days", () => {
  const morning = Date.parse("2026-10-20T10:00:00Z"), month = currentMonth(morning);
  assert.equal(inFinancialPeriod(parseBusinessDate("2026-10-20"), "semana", month, morning), true);
  assert.equal(inFinancialPeriod(parseBusinessDate("2026-10-14"), "semana", month, morning), true);
  assert.equal(inFinancialPeriod(parseBusinessDate("2026-10-13"), "semana", month, morning), false);
  assert.equal(inFinancialPeriod(Date.parse("2026-10-20T02:59:59Z"), "hoje", month, morning), false);
  assert.equal(inFinancialPeriod(Date.parse("2026-11-01T02:59:59Z"), "mes", month, morning), true);
  assert.equal(inFinancialPeriod(Date.parse("2026-11-01T03:00:00Z"), "mes", month, morning), false);
});
test("accompaniment validation requires flavor, size, positive cent prices and integer quantities", () => {
  assert.throws(() => beverage({ flavor: "" }), /sabor/); assert.throws(() => beverage({ size: "" }), /tamanho/);
  assert.throws(() => beverage({ price: 0 }), /preço/); assert.throws(() => beverage({ price: 1.5 }), /preço/);
  assert.throws(() => beverage({ stock: -1 }), /estoque/); assert.throws(() => beverage({ extraType: "invalid" }), /Selecione/);
  assert.equal(beverage({ extraType: "suco", flavor: "Uva", size: "500 ml" }).name, "Bebida de teste · Uva · 500 ml");
  assert.equal(beverage({ extraType: "batata-frita", flavor: undefined, productName: "Fritas", size: "300 g" }).name, "Fritas · 300 g");
});
test("manual entries reject invalid dates, future dates, signs, fractions and types", () => {
  const input = { id: "manual-test", type: "saida", description: "Embalagens", value: 1099, date: "2026-10-20" };
  assert.equal(validateManualEntry(input, now).occurredAt, Date.parse("2026-10-20T15:00:00Z"));
  for (const value of [0, -2, 10.5, "100"]) assert.throws(() => validateManualEntry({ ...input, value }, now));
  assert.throws(() => parseBusinessDate("2026-02-30")); assert.throws(() => validateManualEntry({ ...input, date: "2026-10-21" }, now), /data passada/);
  assert.throws(() => validateManualEntry({ ...input, type: "sale" }, now));
});
test("creating and retrying a product never replenishes stock or duplicates its audit movement", async t => {
  const db = await fixture(t), item = beverage();
  await Promise.all([saveAccompaniment(db, item, true), saveAccompaniment(db, item, true)]);
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id=?").bind(item.id).first()).stock, 2);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM movements").first()).count, 1);
  await db.prepare("UPDATE ingredients SET stock=0 WHERE id=?").bind(item.id).run();
  await saveAccompaniment(db, item, true);
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id=?").bind(item.id).first()).stock, 0);
  await assert.rejects(saveAccompaniment(db, { ...item, stock: 9 }, true));
  await assert.rejects(saveAccompaniment(db, { ...item, price: 999 }, true));
  await saveAccompaniment(db, { ...item, stock: 100, price: 700 }, false);
  assert.deepEqual(await db.prepare("SELECT stock,price FROM ingredients WHERE id=?").bind(item.id).first(), { stock: 0, price: 700 });
});
test("each beverage size and juice flavor has independent stock, joins the order total and is restored on cancellation", async t => {
  const db = await fixture(t), soda = beverage(), large = beverage({ size: "2 L", price: 1200 }), juice = beverage({ extraType: "suco", productName: "Suco", flavor: "Uva", size: "500 ml", price: 900 });
  for (const product of [soda, large, juice]) { await saveAccompaniment(db, product, true); await setProductFeatured(db, product.id, true); }
  for (const [id, category, max] of [["pao", "Pães", 1], ["carne", "Proteínas", 4], ["queijo", "Queijos", 4], ["salada", "Extras", 4]]) await db.prepare("INSERT INTO ingredients (id,name,category,unit,stock,max_qty) VALUES (?,?,?,'unidade',10,?)").bind(id, id, category, max).run();
  const { results } = await db.prepare("SELECT id,name,category,unit,stock,max_qty AS maxQty,price,active,featured FROM ingredients").all();
  const selection = { pao: 1, carne: 1, queijo: 1, salada: 1, [soda.id]: 2, [juice.id]: 1 };
  const summary = validateSelection(selection, { ingredients: results, prices: { 3: 1300 }, deliveryFee: 0 });
  assert.equal(summary.count, 3); assert.equal(summary.subtotal, 3400);
  const lines = results.filter(i => selection[i.id]).map(i => ({ id: i.id, name: i.name, quantity: selection[i.id] }));
  const id = crypto.randomUUID(); await reserveOrder(db, order(id, summary.subtotal), lines);
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id=?").bind(soda.id).first()).stock, 0);
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id=?").bind(large.id).first()).stock, 2);
  await assert.rejects(reserveOrder(db, order(crypto.randomUUID(), 3400), lines), /constraint/i);
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='carne'").first()).stock, 9);
  await db.prepare("UPDATE orders SET status='cancelado' WHERE id=?").bind(id).run();
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id=?").bind(soda.id).first()).stock, 2);
  const saleId = crypto.randomUUID(); await reserveOrder(db, order(saleId, 3400), lines);
  await saveAccompaniment(db, { ...soda, price: 990 }, false);
  await db.prepare("UPDATE orders SET status='concluido' WHERE id=?").bind(saleId).run();
  assert.equal((await db.prepare("SELECT value FROM finance WHERE order_id=?").bind(saleId).first()).value, 3400);
});
test("manual incomes and expenses persist idempotently without creating sales or altering inventory", async t => {
  const db = await fixture(t);
  const income = validateManualEntry({ id: "cash-in-test", type: "entrada", description: "Caixa inicial", value: 5000, date: "2026-10-20" }, now);
  const expense = validateManualEntry({ id: "cash-out-test", type: "saida", description: "Embalagens", value: 1500, date: "2026-10-20" }, now);
  await Promise.all([addManualEntry(db, income), addManualEntry(db, income)]); await addManualEntry(db, expense);
  await assert.rejects(addManualEntry(db, { ...income, value: 6000 }), /outros dados/);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM manual_finance").first()).count, 2);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM finance").first()).count, 0);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM movements").first()).count, 0);
  await assert.rejects(db.prepare("INSERT INTO manual_finance (id,type,description,value,occurred_at,created_at) VALUES ('bad','entrada','Test',-1,0,0)").run(), /constraint/i);
});
test("the star publishes only the chosen products without changing stock, price or manual availability", async t => {
  const db = await fixture(t), product = beverage();
  await saveAccompaniment(db, product, true);
  const read = () => db.prepare("SELECT id,name,category,unit,stock,price,active,featured,max_qty AS maxQty FROM ingredients WHERE id=?").bind(product.id).first();
  assert.equal((await read()).featured, 0);
  assert.deepEqual(accompanimentChoices([await read()], {}), []);
  await setProductFeatured(db, product.id, true);
  assert.equal(accompanimentChoices([await read()], {}).length, 1);
  const before = await read();
  await setProductFeatured(db, product.id, false);
  const after = await read();
  assert.deepEqual({ ...after, featured: 1 }, before);
  assert.equal(isIngredientAvailable(after), false);
  // An existing selection remains removable even after it disappears from new choices.
  assert.equal(accompanimentChoices([after], { [product.id]: 1 }).length, 1);
  assert.deepEqual(getStockShortages({ [product.id]: 1 }, { ingredients: [after] }).map(i => [i.name, i.available]), [[product.name, 0]]);
  await assert.rejects(setProductFeatured(db, product.id, 1));
  await assert.rejects(setProductFeatured(db, "unknown", true));
  await saveAccompaniment(db, { ...product, price: 750 }, false);
  assert.equal((await read()).featured, 0); // Editing cannot silently publish a product.
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM movements").first()).count, 1);
});
test("a product unstarred during reservation blocks a stale cart and rolls the entire batch back", async t => {
  const db = await fixture(t), product = beverage();
  await saveAccompaniment(db, product, true); await setProductFeatured(db, product.id, true);
  await db.prepare("INSERT INTO ingredients (id,name,category,unit,stock) VALUES ('carne','Carne','Proteínas','unidade',10)").run();
  const lines = [{ id: "carne", name: "Carne", quantity: 1 }, { id: product.id, name: product.name, quantity: 1 }];
  await setProductFeatured(db, product.id, false);
  await assert.rejects(reserveOrder(db, order(crypto.randomUUID(), 2000), lines), /ingredient_unavailable/);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM orders").first()).count, 0);
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='carne'").first()).stock, 10);
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id=?").bind(product.id).first()).stock, 2);
  await assert.rejects(setProductFeatured(db, "carne", true));
  await setProductFeatured(db, product.id, true);
  await reserveOrder(db, order(crypto.randomUUID(), 2000), lines);
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id=?").bind(product.id).first()).stock, 1);
});
test("the additive star migration preserves existing menu products, prices and quantities", async t => {
  const db = await fixture(t, async raw => {
    await raw.prepare("INSERT INTO ingredients (id,name,category,unit,stock,price,active) VALUES ('legacy','Suco','Complementos','unidade',7,800,0)").run();
    await raw.prepare("INSERT INTO ingredients (id,name,category,unit,stock) VALUES ('carne','Carne','Proteínas','unidade',20)").run();
  });
  assert.deepEqual(await db.prepare("SELECT stock,price,active,featured FROM ingredients WHERE id='legacy'").first(), { stock: 7, price: 800, active: 0, featured: 1 });
  assert.equal((await db.prepare("SELECT featured FROM ingredients WHERE id='carne'").first()).featured, 0);
  assert.equal(beverage({ extraType: "outros", productName: "Produto de teste", flavor: undefined, size: "Unidade" }).name, "Produto de teste · Unidade");
});
