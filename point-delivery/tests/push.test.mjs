import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { generateVAPIDKeys, generateRequestDetails } from "web-push";
import { postgresFixture } from "./postgres-fixture.mjs";
import { validatePushTarget } from "../domain/push.ts";
import { claimPushDeliveries, finishPushDelivery, hasPushTarget, removePushTarget, savePushTarget } from "../db/push.ts";
import { reserveOrder } from "../db/order-reservation.ts";

const vapid = generateVAPIDKeys();
const target = { endpoint: "https://fcm.googleapis.com/fcm/send/fixture", keys: { p256dh: vapid.publicKey, auth: randomBytes(16).toString("base64url") } };

test("push validates browser services and encrypts a signed payload without external requests", () => {
  assert.deepEqual(validatePushTarget(target), target);
  for (const endpoint of ["http://fcm.googleapis.com/test", "https://127.0.0.1/test", "https://fcm.googleapis.com.attacker.example/test", "https://u:p@fcm.googleapis.com/test"]) {
    assert.throws(() => validatePushTarget({ ...target, endpoint }));
  }
  assert.throws(() => validatePushTarget({ ...target, keys: { p256dh: 123, auth: "invalid" } }));
  const details = generateRequestDetails(target, JSON.stringify({ code: "ABC123" }), {
    vapidDetails: { ...vapid, subject: "https://point-do-hamburguer.vercel.app" }, TTL: 900,
  });
  assert.equal(details.headers["Content-Encoding"], "aes128gcm");
  assert.match(details.headers.Authorization, /^vapid /);
  assert.ok(Buffer.isBuffer(details.body));
});

async function fixture(t) {
  const db = await postgresFixture(t, true);
  await db.batch([
    db.prepare(`INSERT INTO auth_user(id,name,email,"emailVerified") VALUES ('admin','Teste','admin@example.test',true)`),
    db.prepare("INSERT INTO admin_access(user_id,must_change_password) VALUES ('admin',0)"),
    db.prepare("INSERT INTO ingredients(id,name,category,unit,stock,max_qty) VALUES ('carne','Carne','Carnes','unidade',5,4)"),
  ]);
  await savePushTarget(db, "admin", target);
  const order = { id: crypto.randomUUID(), idempotencyKey: crypto.randomUUID(), fingerprint: "test", code: "ABC123",
    customer: "Teste", phone: "71900000000", address: "Rua de teste, 1", reference: "Teste", notes: "",
    subtotal: 1500, deliveryFee: 0, total: 1500, createdAt: Date.now() };
  return { db, order };
}

test("order push is atomic with stock and a duplicate request cannot enqueue a second notification", async t => {
  const { db, order } = await fixture(t);
  await assert.rejects(reserveOrder(db, order, [{ id: "carne", name: "Carne", quantity: 6 }]));
  assert.equal((await db.prepare("SELECT count(*) AS count FROM push_deliveries").first()).count, 0);
  await reserveOrder(db, order, [{ id: "carne", name: "Nome histórico", quantity: 1 }]);
  await assert.rejects(reserveOrder(db, order, []));
  assert.equal((await db.prepare("SELECT count(*) AS count FROM push_deliveries").first()).count, 1);
  const first = await claimPushDeliveries(db);
  assert.equal(first.length, 1);
  assert.equal((await claimPushDeliveries(db)).length, 0);
  await finishPushDelivery(db, first[0], "retry");
  assert.equal((await claimPushDeliveries(db)).length, 0);
  const retry = await claimPushDeliveries(db, Date.now() + 1100);
  assert.equal(retry.length, 1);
  await finishPushDelivery(db, first[0], "sent");
  assert.equal((await db.prepare("SELECT sent_at FROM push_deliveries").first()).sent_at, null);
  await finishPushDelivery(db, retry[0], "sent");
  assert.equal((await claimPushDeliveries(db, Date.now() + 2000)).length, 0);
});

test("revoked administrators stop receiving push and expired or removed devices lose their pending deliveries", async t => {
  const { db, order } = await fixture(t);
  await reserveOrder(db, order, []);
  await db.prepare("UPDATE admin_access SET active=0 WHERE user_id='admin'").run();
  assert.equal((await claimPushDeliveries(db)).length, 0);
  await db.prepare("UPDATE admin_access SET active=1 WHERE user_id='admin'").run();
  const [delivery] = await claimPushDeliveries(db);
  await finishPushDelivery(db, delivery, "expired");
  assert.equal(await hasPushTarget(db, "admin", target.endpoint), false);
  assert.equal((await db.prepare("SELECT count(*) AS count FROM push_deliveries").first()).count, 0);
  await savePushTarget(db, "admin", target);
  await removePushTarget(db, "other-admin", target.endpoint);
  assert.equal(await hasPushTarget(db, "admin", target.endpoint), true);
  await removePushTarget(db, "admin", target.endpoint);
  assert.equal(await hasPushTarget(db, "admin", target.endpoint), false);
});

test("service worker displays push with no open page and notification click opens the order board", async () => {
  const handlers = {}, notifications = [], opened = [];
  const self = {
    addEventListener: (type, handler) => { handlers[type] = handler; },
    location: { origin: "https://point.example" },
    registration: { showNotification: async (title, options) => notifications.push({ title, options }) },
    clients: { matchAll: async () => [], openWindow: async url => opened.push(url) },
  };
  vm.runInNewContext(readFileSync(new URL("../public/admin-notifications-sw.js", import.meta.url), "utf8"), { self, URL });
  let completion;
  handlers.push({ data: { json: () => ({ code: "ABC123", tag: "same-order" }) }, waitUntil: work => { completion = work; } });
  await completion;
  assert.equal(notifications[0].options.tag, "same-order");
  assert.match(notifications[0].options.body, /ABC123/);
  assert.equal(notifications[0].options.silent, false);
  handlers.notificationclick({ notification: { close() {} }, waitUntil: work => { completion = work; } });
  await completion;
  assert.deepEqual(opened, ["https://point.example/admin?section=pedidos"]);
});
