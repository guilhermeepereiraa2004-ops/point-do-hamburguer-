import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { generateVAPIDKeys, generateRequestDetails } from "web-push";
import { postgresFixture } from "./postgres-fixture.mjs";
import { pushDeviceLabel, validatePushDeviceName, validatePushTarget } from "../domain/push.ts";
import { claimPushDeliveries, finishPushDelivery, hasPushTarget, listPushDevices, pushDeviceId, removePushDevice, removePushTarget, renamePushDevice, savePushTarget } from "../db/push.ts";
import { reserveOrder } from "../db/order-reservation.ts";
import { createPushReceipt, pushReceiptResponse } from "../lib/push-receipt.ts";

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

test("device management lists only this administrator's registrations and removal cancels only the selected delivery", async t => {
  const { db, order } = await fixture(t);
  const second = { ...target, endpoint: "https://fcm.googleapis.com/fcm/send/second" };
  const secondId = await savePushTarget(db, "admin", second, "Chrome · Android");
  const firstId = await pushDeviceId(db, "admin", target.endpoint);
  const devices = await listPushDevices(db, "admin");
  assert.equal(devices.length, 2);
  assert.deepEqual(Object.keys(devices[0]).sort(), ["id", "label", "updatedAt"]);
  assert.equal(devices.find(device => device.id === secondId).label, "Chrome · Android");
  assert.equal(devices.find(device => device.id === firstId).label, "Aparelho cadastrado");
  assert.deepEqual(await listPushDevices(db, "other-admin"), []);
  await reserveOrder(db, order, []);
  await removePushDevice(db, "other-admin", firstId);
  assert.equal((await listPushDevices(db, "admin")).length, 2);
  await removePushDevice(db, "admin", firstId);
  await removePushDevice(db, "admin", firstId);
  assert.equal((await listPushDevices(db, "admin")).length, 1);
  const deliveries = await claimPushDeliveries(db);
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0].subscription_id, secondId);
  assert.equal(await hasPushTarget(db, "admin", target.endpoint), false);
  const restoredId = await savePushTarget(db, "admin", target, "Safari · iPhone");
  assert.equal(restoredId, firstId);
});

test("device labels identify browser and system without retaining the raw user agent", () => {
  assert.equal(pushDeviceLabel("Mozilla/5.0 (Linux; Android 14) Chrome/130 Safari/537.36"), "Chrome · Android");
  assert.equal(pushDeviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1"), "Safari · iPhone");
  assert.equal(pushDeviceLabel("Mozilla/5.0 (Windows NT 10.0) Chrome/130 Safari/537.36 Edg/130"), "Edge · Windows");
  assert.equal(pushDeviceLabel("Mozilla/5.0 (Linux; Android 14) SamsungBrowser/27 Chrome/130 Safari/537.36"), "Samsung Internet · Android");
  assert.equal(pushDeviceLabel(""), "Navegador");
});

test("device names accept descriptive names and reject empty, oversized and control-character input", () => {
  assert.equal(validatePushDeviceName("  Celular da cozinha  "), "Celular da cozinha");
  assert.equal(validatePushDeviceName("Caixa · João"), "Caixa · João");
  assert.equal(validatePushDeviceName("a".repeat(60)).length, 60);
  for (const value of [null, 12, {}, "", "   ", "a".repeat(61), "Caixa\ncozinha", "Caixa\u0000"]) {
    assert.throws(() => validatePushDeviceName(value));
  }
});

test("renaming is private, survives reactivation and preserves activation date and pending alerts", async t => {
  const { db, order } = await fixture(t);
  const firstId = await pushDeviceId(db, "admin", target.endpoint);
  const before = (await listPushDevices(db, "admin"))[0];
  await reserveOrder(db, order, []);
  assert.equal(await renamePushDevice(db, "other-admin", firstId, "Outro nome"), false);
  assert.equal(await renamePushDevice(db, "admin", "a".repeat(64), "Inexistente"), false);
  assert.deepEqual((await listPushDevices(db, "admin"))[0], before);
  assert.equal(await renamePushDevice(db, "admin", firstId, " Celular do caixa "), true);
  assert.deepEqual((await listPushDevices(db, "admin"))[0], { ...before, label: "Celular do caixa" });
  assert.equal((await claimPushDeliveries(db)).length, 1);
  await savePushTarget(db, "admin", target, "Chrome · Android");
  assert.equal((await listPushDevices(db, "admin"))[0].label, "Celular do caixa");
  await assert.rejects(renamePushDevice(db, "admin", firstId, " "));
  assert.equal((await listPushDevices(db, "admin"))[0].label, "Celular do caixa");
  await db.prepare(`INSERT INTO auth_user(id,name,email,"emailVerified") VALUES ('admin2','Teste 2','second@example.test',true)`).run();
  await db.prepare("INSERT INTO admin_access(user_id,must_change_password) VALUES ('admin2',0)").run();
  await savePushTarget(db, "admin2", target, "Chrome · Android");
  assert.deepEqual(await listPushDevices(db, "admin"), []);
  assert.equal((await listPushDevices(db, "admin2"))[0].label, "Chrome · Android");
});

test("service worker activates updates immediately and displays an alert with no open page", async () => {
  const handlers = {}, notifications = [], opened = [];
  let activated = false, claimed = false;
  const self = {
    addEventListener: (type, handler) => { handlers[type] = handler; },
    skipWaiting: async () => { activated = true; },
    location: { origin: "https://point.example" },
    registration: { showNotification: async (title, options) => notifications.push({ title, options }) },
    clients: { claim: async () => { claimed = true; }, matchAll: async () => [], openWindow: async url => opened.push(url) },
  };
  vm.runInNewContext(readFileSync(new URL("../public/admin-notifications-sw.js", import.meta.url), "utf8"), { self, URL });
  let completion;
  handlers.install({ waitUntil: work => { completion = work; } });
  await completion;
  assert.equal(activated, true);
  handlers.activate({ waitUntil: work => { completion = work; } });
  await completion;
  assert.equal(claimed, true);
  handlers.push({ data: { json: () => ({ code: "ABC123", tag: "same-order" }) }, waitUntil: work => { completion = work; } });
  await completion;
  assert.equal(notifications[0].options.tag, "point-order-alert");
  assert.match(notifications[0].options.body, /ABC123/);
  assert.equal(notifications[0].options.silent, false);
  assert.equal(notifications[0].options.renotify, true);
  assert.equal("vibrate" in notifications[0].options, false);
  handlers.notificationclick({ notification: { close() {} }, waitUntil: work => { completion = work; } });
  await completion;
  assert.deepEqual(opened, ["https://point.example/admin?section=pedidos"]);
});

test("display receipts require a valid unexpired signature and log only bounded diagnostic fields", async () => {
  const secret = "test-only-push-receipt-secret-not-used-in-production";
  const now = Date.now(), receipt = createPushReceipt(secret, "system-default", now), records = [];
  const report = { token: receipt.token, revision: "point-push-20261108-2", profile: "system-default",
    displayed: true, canonicalOrigin: true, endpoint: "PRIVATE", customer: "PRIVATE" };
  const request = body => new Request("https://point.example/api/push-receipt", { method: "POST", body: JSON.stringify(body) });
  const response = await pushReceiptResponse(request(report), secret, event => records.push(event), now);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(records, [{ probe: receipt.probe, revision: report.revision, requestedProfile: "system-default",
    displayedProfile: "system-default", displayed: true, canonicalOrigin: true }]);
  records.length = 0;
  const candidates = [undefined, "invalid", receipt.token.slice(0, -1) + (receipt.token.endsWith("A") ? "B" : "A"),
    createPushReceipt(secret + "other", "system-default", now).token,
    createPushReceipt(secret, "system-default", now - 21 * 60000).token,
    createPushReceipt(secret, "system-default", now + 60000).token];
  for (const token of candidates) {
    assert.equal((await pushReceiptResponse(request({ ...report, token }), secret, event => records.push(event), now)).status, 404);
  }
  for (const changes of [{ revision: "untrusted\nlog" }, { displayed: "yes" }, { profile: "unknown" }, { canonicalOrigin: "true" }]) {
    assert.equal((await pushReceiptResponse(request({ ...report, ...changes }), secret, event => records.push(event), now)).status, 404);
  }
  assert.equal((await pushReceiptResponse(request(null), secret, event => records.push(event), now)).status, 404);
  assert.equal((await pushReceiptResponse(request({ ...report, extra: "x".repeat(1024) }), secret, event => records.push(event), now)).status, 404);
  assert.equal(records.length, 0);
});

test("tests use the same alert as orders, fall back after rejected options and acknowledge the actual display", async () => {
  const handlers = {}, notifications = [], reports = [];
  let rejectOptions = false, rejectReceipt = false;
  const self = { addEventListener: (type, handler) => { handlers[type] = handler; },
    location: { origin: "https://point-do-hamburguer.vercel.app" },
    registration: { showNotification: async (title, options) => {
      if (rejectOptions && "silent" in options) throw new TypeError("Unsupported alert setting");
      notifications.push({ title, options });
    } },
  };
  vm.runInNewContext(readFileSync(new URL("../public/admin-notifications-sw.js", import.meta.url), "utf8"), {
    self, URL, AbortSignal, fetch: async (url, init) => {
      assert.equal(url, "https://point-do-hamburguer.vercel.app/api/push-receipt");
      assert.equal(init.credentials, "omit");
      reports.push(JSON.parse(init.body));
      if (rejectReceipt) throw new Error("Offline receipt");
      return { ok: true };
    },
  });
  async function push(data) {
    let completion;
    handlers.push({ data: { json: () => data }, waitUntil: work => { completion = work; } });
    await completion;
  }
  await push({ test: true, profile: "system-default", receipt: "signed-receipt", tag: "test-1" });
  assert.equal(notifications[0].options.silent, false);
  assert.equal("vibrate" in notifications[0].options, false);
  assert.equal(reports[0].profile, "standard");
  assert.equal(reports[0].displayed, true);
  assert.equal(reports[0].revision, "point-push-20261108-4");
  assert.equal(reports[0].canonicalOrigin, true);
  rejectOptions = true;
  await push({ code: "ABC123", receipt: "signed-receipt", tag: "order-1" });
  assert.match(notifications[1].options.body, /ABC123/);
  assert.equal(reports[1].profile, "fallback");
  assert.equal(reports[1].displayed, true);
  rejectOptions = false;
  rejectReceipt = true;
  await push({ code: "ABC124", receipt: "signed-receipt", tag: "order-2" });
  assert.equal(notifications.length, 3);
  assert.equal(notifications[2].options.silent, false);
  assert.equal(reports[2].profile, "standard");
});

test("one alert slot preserves the pre-transfer audible options for orders and tests", async () => {
  // Snapshot of the deployed worker in commit 21bfe4805feea982a81ddd00ce3c34e734856cc2.
  const previous = readFileSync(new URL("./fixtures/notifications-before-transfer.js", import.meta.url), "utf8");
  const current = readFileSync(new URL("../public/admin-notifications-sw.js", import.meta.url), "utf8");
  async function render(source, data) {
    const handlers = {}, alerts = [];
    const self = { addEventListener: (name, handler) => { handlers[name] = handler; },
      registration: { showNotification: async (title, options) => alerts.push({ title, options }) } };
    vm.runInNewContext(source, { self, URL });
    let completion;
    handlers.push({ data: { json: () => data }, waitUntil: work => { completion = work; } });
    await completion;
    return JSON.parse(JSON.stringify(alerts));
  }
  for (const payload of [{ code: "ABC123", tag: "point-order-fixture" }, { test: true, tag: "point-push-test" }]) {
    const oldAlerts = await render(previous, payload), currentAlerts = await render(current, payload);
    assert.equal(currentAlerts[0].options.tag, "point-order-alert");
    oldAlerts[0].options.tag = "point-order-alert";
    assert.deepEqual(currentAlerts, oldAlerts);
  }
});

test("successive pushes replace one alert, remove only legacy Point alerts and survive cleanup failure", async () => {
  const handlers = {}, alerts = new Map(), closed = [];
  let unavailable = false;
  const existing = ["point-order-old", "point-push-test-old", "another-alert", "point-order-alert"];
  const self = { addEventListener: (name, handler) => { handlers[name] = handler; }, registration: {
    getNotifications: async () => {
      if (unavailable) throw new Error("Unavailable notification list");
      return existing.map(tag => ({ tag, close: () => closed.push(tag) }));
    },
    showNotification: async (title, options) => { alerts.set(options.tag, { title, options }); },
  } };
  vm.runInNewContext(readFileSync(new URL("../public/admin-notifications-sw.js", import.meta.url), "utf8"), { self, URL });
  async function push(data) {
    let completion;
    handlers.push({ data: { json: () => data }, waitUntil: work => { completion = work; } });
    await completion;
  }
  await push({ code: "FIRST", tag: "point-order-one" });
  assert.deepEqual(closed, ["point-order-old", "point-push-test-old"]);
  await push({ code: "SECOND", tag: "point-order-two" });
  assert.equal(alerts.size, 1);
  assert.match(alerts.get("point-order-alert").options.body, /SECOND/);
  assert.equal(alerts.get("point-order-alert").options.renotify, true);
  assert.equal(alerts.get("point-order-alert").options.silent, false);
  unavailable = true;
  await push({ test: true, tag: "point-push-test-new" });
  assert.equal(alerts.size, 1);
  assert.equal(alerts.get("point-order-alert").title, "Notificações do Point ativadas");
});
