import test from "node:test";
import assert from "node:assert/strict";
import { postgresFixture } from "./postgres-fixture.mjs";
import { readBoardOrders } from "../db/board-orders.ts";
import { adjustIngredientStock } from "../db/stock-adjustment.ts";
import { reserveOrder } from "../db/order-reservation.ts";
import { claimPushDeliveries, confirmPushDelivery, finishPushDelivery, hasPendingOrderPush, savePushTarget } from "../db/push.ts";
import { pushRecoveryDelay, recoverOrderPush } from "../lib/push-recovery.ts";

const order = (createdAt = Date.now()) => ({ id: crypto.randomUUID(), idempotencyKey: crypto.randomUUID(),
  fingerprint: "fixture", code: crypto.randomUUID().slice(0, 6), customer: "Teste", phone: "71900000000",
  address: "Rua de teste, 1", reference: "Teste", notes: "", subtotal: 1400, deliveryFee: 0, total: 1400, createdAt });

test("board retains every active order independently of the latest 200 terminal orders", async t => {
  const db = await postgresFixture(t);
  // More than 200 active orders and more than 200 newer terminal orders.
  await db.prepare(`INSERT INTO orders(id,idempotency_key,fingerprint,code,customer,phone,address,reference,notes,status,subtotal,delivery_fee,total,created_at)
    SELECT 'fixture-'||n,'key-'||n,'fixture','C'||n,'Teste','71900000000','Rua de teste','Teste','',
      CASE WHEN n<=210 THEN (ARRAY['recebido','preparo','entrega'])[1+(n%3)]
        WHEN n%2=0 THEN 'cancelado' ELSE 'concluido' END,1400,0,1400,n FROM generate_series(1,440) n`).run();
  const board = await readBoardOrders(db);
  assert.equal(board.length, 410);
  assert.equal(board.filter(row => ["recebido", "preparo", "entrega"].includes(row.status)).length, 210);
  assert.equal(board.filter(row => ["concluido", "cancelado"].includes(row.status)).length, 200);
  assert.equal(board[0].id, "fixture-440");
  assert.equal(board.at(-1).id, "fixture-1");
  assert.equal(board.some(row => row.id === "fixture-240"), false);
  assert.equal(board.find(row => row.id === "fixture-1").total, 1400);
  assert.equal(typeof board[0].createdAt, "number");
  assert.equal("fingerprint" in board[0], false);
});

test("stock adjustments and reservations keep the balance equal to audited movements in either execution order", async t => {
  const db = await postgresFixture(t);
  await db.prepare("INSERT INTO ingredients(id,name,category,unit,stock,max_qty) VALUES ('carne','Carne','Carnes','unidade',50,4)").run();
  const first = order(), second = order();
  // PGlite serializes one connection. Promise.all verifies both allowed serialized orders;
  // the production statement locks before reading, rather than reading in a prior statement.
  await Promise.all([adjustIngredientStock(db, "carne", 60, "Contagem física"), reserveOrder(db, first, [{ id: "carne", name: "Carne", quantity: 1 }])]);
  await Promise.all([reserveOrder(db, second, [{ id: "carne", name: "Carne", quantity: 2 }]), adjustIngredientStock(db, "carne", 70, "Nova contagem")]);
  const stock = async () => (await db.prepare("SELECT stock FROM ingredients WHERE id='carne'").first()).stock;
  const balance = async () => 50 + Number((await db.prepare("SELECT SUM(delta) AS total FROM movements WHERE ingredient_id='carne'").first()).total);
  assert.equal(await stock(), await balance());
  await assert.rejects(reserveOrder(db, first, []));
  assert.equal(await stock(), await balance());
  await db.prepare("UPDATE orders SET status='cancelado' WHERE id=?").bind(first.id).run();
  assert.equal(await stock(), await balance());
  const before = await stock();
  const count = (await db.prepare("SELECT count(*) AS count FROM movements").first()).count;
  await assert.rejects(adjustIngredientStock(db, "carne", -1, "Inválido"));
  await assert.rejects(adjustIngredientStock(db, "ausente", 60, "Não existe"), /não encontrado/);
  assert.equal(await stock(), before);
  assert.equal((await db.prepare("SELECT count(*) AS count FROM movements").first()).count, count);
  // Force audit-write failure and verify that the preceding UPDATE rolls back too.
  await db.prepare("ALTER TABLE movements ADD CONSTRAINT fixture_reason CHECK(reason <> 'Falhar auditoria')").run();
  await assert.rejects(adjustIngredientStock(db, "carne", 99, "Falhar auditoria"));
  assert.equal(await stock(), before);
});

async function pushFixture(t) {
  const db = await postgresFixture(t, true);
  await db.batch([
    db.prepare(`INSERT INTO auth_user(id,name,email,"emailVerified") VALUES ('admin','Teste','admin@example.test',true)`),
    db.prepare("INSERT INTO admin_access(user_id,must_change_password) VALUES ('admin',0)"),
  ]);
  await savePushTarget(db, "admin", { endpoint: "https://fcm.googleapis.com/fcm/send/isolated-fixture", keys: { p256dh: "fixture", auth: "fixture" } });
  const first = order(), second = order();
  await reserveOrder(db, first, []);
  await reserveOrder(db, second, []);
  return { db, first, second, message: { version: 1, orderId: first.id } };
}

test("durable recovery retries beyond three executions and stops only after display confirmation", async t => {
  const { db, first, second, message } = await pushFixture(t);
  let now = Date.now(), attempts = 0;
  const dispatch = async id => {
    const deliveries = await claimPushDeliveries(db, now, id);
    assert.equal(deliveries.length, 1);
    assert.equal(deliveries[0].order_id, first.id);
    attempts++;
    await finishPushDelivery(db, deliveries[0], attempts < 5 ? "retry" : "sent", now);
    if (attempts === 5) await confirmPushDelivery(db, { orderId: first.id, subscriptionId: deliveries[0].subscription_id }, now);
  };
  for (let index = 0; index < 4; index++) {
    await assert.rejects(recoverOrderPush(message, db, dispatch, now), /awaiting confirmation/);
    now += 61000;
  }
  await recoverOrderPush(message, db, dispatch, now);
  await recoverOrderPush(message, db, dispatch, now); // Redelivery is harmless.
  assert.equal(attempts, 5);
  assert.equal(await hasPendingOrderPush(db, first.id, now), false);
  assert.equal(await hasPendingOrderPush(db, second.id, now), true);
  assert.equal((await db.prepare("SELECT attempts FROM push_deliveries WHERE order_id=?").bind(second.id).first()).attempts, 0);
  assert.deepEqual([1, 2, 3, 4, 5, 100].map(pushRecoveryDelay), [30, 60, 120, 240, 300, 300]);
});

test("pending leases are retried; malformed, expired, advanced and revoked deliveries stop recovery", async t => {
  const { db, first, second, message } = await pushFixture(t);
  const now = Date.now();
  const [delivery] = await claimPushDeliveries(db, now, first.id);
  assert.ok(delivery);
  let calls = 0;
  const dispatch = async () => { calls++; };
  await assert.rejects(recoverOrderPush(message, db, dispatch, now), /awaiting confirmation/);
  for (const bad of [null, {}, { version: 2, orderId: first.id }, { version: 1, orderId: "invalid" }]) await recoverOrderPush(bad, db, dispatch, now);
  assert.equal(calls, 1);
  await recoverOrderPush(message, db, dispatch, now + 86400001);
  assert.equal(calls, 1);
  await db.prepare("UPDATE orders SET status='preparo' WHERE id=?").bind(first.id).run();
  await recoverOrderPush(message, db, dispatch, now);
  assert.equal(calls, 1);
  await db.prepare("UPDATE admin_access SET active=0 WHERE user_id='admin'").run();
  await recoverOrderPush({ version: 1, orderId: second.id }, db, dispatch, now);
  assert.equal(calls, 1);
});
