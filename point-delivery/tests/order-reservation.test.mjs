import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Miniflare } from "miniflare";
import { reserveOrder } from "../db/order-reservation.ts";
import { ingredientNames, validateSelection, getStockShortages, InsufficientStockError } from "../domain/menu.ts";

const selection = { "carne-hamburguer": 1, queijo: 1, cheddar: 1, presunto: 1, ovo: 1, salsicha: 1, ervilha: 1, salada: 2, "batata-palha": 1, pao: 1 };
const catalog = { ingredients: [...ingredientNames.map(([id, name, category, unit]) => ({ id, name, category, unit, stock: 50, maxQty: 4, active: true, price: null })), { id: "pao", name: "Pão tradicional", category: "Pães", unit: "unidade", stock: 50, maxQty: 1, active: true, price: null }], prices: { 10: 2000 }, deliveryFee: 0 };
const items = catalog.ingredients.filter(i => selection[i.id]).map(i => ({ id: i.id, name: i.name, quantity: selection[i.id] }));
const order = (id = crypto.randomUUID(), key = id) => ({ id, idempotencyKey: key, fingerprint: "fixture", code: "TESTE", customer: "TESTE AUTOMATIZADO", phone: "00000000000", address: "Endereço fictício de teste", reference: "Sem entrega", notes: "Não produzir", subtotal: 2000, deliveryFee: 0, total: 2000, createdAt: 1792520000123 });
async function fixture(t) {
  const mf = new Miniflare({ modules: true, script: 'export default {fetch(){return new Response("test")}}', compatibilityDate: "2026-05-15", d1Databases: ["DB"] });
  t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB");
  const journal = JSON.parse(readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"));
  for (const migration of journal.entries) {
    for (const sql of readFileSync(new URL(`../drizzle/${migration.tag}.sql`, import.meta.url), "utf8").split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean)) await db.prepare(sql).run();
  }
  await db.batch(catalog.ingredients.map(i => db.prepare("INSERT INTO ingredients (id,name,category,unit,stock,max_qty) VALUES (?,?,?,?,?,?)").bind(i.id, i.name, i.category, i.unit, i.stock, i.maxQty)));
  return db;
}

test("the reported recipe reserves every quantity including two salads and bread, with a persisted timestamp", async t => {
  const db = await fixture(t), input = order();
  await reserveOrder(db, input, items);
  const saved = await db.prepare("SELECT created_at,subtotal,delivery_fee,total,status FROM orders WHERE id=?").bind(input.id).first();
  assert.deepEqual(saved, { created_at: input.createdAt, subtotal: 2000, delivery_fee: 0, total: 2000, status: "recebido" });
  for (const item of items) assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id=?").bind(item.id).first()).stock, 50 - item.quantity);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM order_items").first()).count, items.length);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM movements WHERE created_at>0").first()).count, items.length);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM finance").first()).count, 0);
});

test("stock exhaustion on the last line rolls back the whole order and all previous stock movements", async t => {
  const db = await fixture(t);
  await db.prepare("UPDATE ingredients SET stock=0 WHERE id='pao'").run();
  await assert.rejects(reserveOrder(db, order(), items), /constraint/i);
  for (const table of ["orders", "order_items", "movements", "finance"]) assert.equal((await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first()).count, 0);
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='salada'").first()).stock, 50);
});

test("concurrent orders for the last portions allow only one reservation and no negative stock", async t => {
  const db = await fixture(t);
  for (const item of items) await db.prepare("UPDATE ingredients SET stock=? WHERE id=?").bind(item.quantity, item.id).run();
  const results = await Promise.allSettled([reserveOrder(db, order(), items), reserveOrder(db, order(), items)]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM orders").first()).count, 1);
  assert.equal((await db.prepare("SELECT MIN(stock) AS minimum FROM ingredients").first()).minimum, 0);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM movements").first()).count, items.length);
});

test("a repeated idempotency key cannot deduct inventory twice", async t => {
  const db = await fixture(t), input = order();
  await reserveOrder(db, input, items);
  await assert.rejects(reserveOrder(db, order(crypto.randomUUID(), input.idempotencyKey), items), /unique/i);
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='salada'").first()).stock, 48);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM orders").first()).count, 1);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM movements").first()).count, items.length);
});

test("a manual pause with stock remaining blocks stale reservations atomically until released", async t => {
  const db = await fixture(t);
  // Simulate a customer who validated the menu before the admin paused the bread.
  assert.equal(validateSelection(selection, catalog).subtotal, 2000);
  await db.prepare("UPDATE ingredients SET active=0 WHERE id='pao'").run();
  await assert.rejects(reserveOrder(db, order(), items), /ingredient_unavailable/);
  for (const table of ["orders", "order_items", "movements", "finance"]) assert.equal((await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first()).count, 0);
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='pao'").first()).stock, 50);
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='salada'").first()).stock, 50);
  await db.prepare("UPDATE ingredients SET active=1 WHERE id='pao'").run();
  await reserveOrder(db, order(), items);
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='pao'").first()).stock, 49);
});

test("completion records the historic order value once and cancellation restores quantities once", async t => {
  const db = await fixture(t), completed = order(), canceled = order();
  await reserveOrder(db, completed, items);
  await db.prepare("INSERT INTO prices (count,value) VALUES (10,9999)").run();
  for (let n = 0; n < 2; n++) await db.prepare("UPDATE orders SET status='concluido' WHERE id=?").bind(completed.id).run();
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM finance").first()).count, 1);
  assert.equal((await db.prepare("SELECT value FROM finance").first()).value, completed.total);
  await reserveOrder(db, canceled, items);
  for (let n = 0; n < 2; n++) await db.prepare("UPDATE orders SET status='cancelado' WHERE id=?").bind(canceled.id).run();
  assert.equal((await db.prepare("SELECT stock FROM ingredients WHERE id='salada'").first()).stock, 48);
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM finance").first()).count, 1);
});

test("shortages name every missing ingredient, partial quantity and bread without labeling available items missing", () => {
  const reduced = { ...catalog, ingredients: catalog.ingredients.map(i => ({ ...i, stock: i.id === "salada" ? 1 : ["queijo", "pao"].includes(i.id) ? 0 : i.stock })) };
  const missing = getStockShortages(selection, reduced);
  assert.deepEqual(missing.map(i => [i.id, i.available, i.requested]), [["queijo", 0, 1], ["salada", 1, 2], ["pao", 0, 1]]);
  assert.throws(() => validateSelection(selection, reduced), e => e instanceof InsufficientStockError && e.shortages.length === 3 && e.message.includes("Pão tradicional"));
  assert.equal(validateSelection(selection, catalog).subtotal, 2000);
  const inactive = { ...catalog, ingredients: catalog.ingredients.map(i => i.id === "cheddar" ? { ...i, active: false } : i) };
  assert.equal(getStockShortages(selection, inactive)[0].id, "cheddar");
});
