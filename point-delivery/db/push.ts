import { createHash, randomUUID } from "node:crypto";
import type { Database } from "./contracts";
import type { PushDevice, PushTarget } from "../domain/push";

const targetId = (endpoint: string) => createHash("sha256").update(endpoint).digest("hex");

export async function savePushTarget(db: Database, userId: string, target: PushTarget, label = "Aparelho cadastrado") {
  await db.prepare(`
    INSERT INTO push_subscriptions(id,user_id,endpoint,p256dh,auth,updated_at,device_label)
    SELECT ?,?,?,?,?,?,? WHERE
      (SELECT count(*) FROM push_subscriptions WHERE user_id=?) < 20 OR
      EXISTS(SELECT 1 FROM push_subscriptions WHERE id=?)
    ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id,p256dh=excluded.p256dh,
      auth=excluded.auth,updated_at=excluded.updated_at,device_label=excluded.device_label
  `).bind(targetId(target.endpoint), userId, target.endpoint, target.keys.p256dh, target.keys.auth, Date.now(), label,
    userId, targetId(target.endpoint)).run();
  const saved = await pushDeviceId(db, userId, target.endpoint);
  if (!saved) throw new Error("Limite de aparelhos atingido para este administrador.");
  return saved;
}

export async function hasPushTarget(db: Database, userId: string, endpoint: string) {
  return await pushDeviceId(db, userId, endpoint) !== null;
}

export async function removePushTarget(db: Database, userId: string, endpoint: string) {
  await removePushDevice(db, userId, targetId(endpoint));
}

export async function listPushDevices(db: Database, userId: string): Promise<PushDevice[]> {
  const { results } = await db.prepare("SELECT id,device_label,updated_at FROM push_subscriptions WHERE user_id=? ORDER BY updated_at DESC,id")
    .bind(userId).all<{ id: string; device_label: string; updated_at: number | string }>();
  return results.map(row => ({ id: row.id, label: row.device_label, updatedAt: Number(row.updated_at) }));
}

export async function removePushDevice(db: Database, userId: string, id: string) {
  await db.prepare("DELETE FROM push_subscriptions WHERE id=? AND user_id=?").bind(id, userId).run();
}

export async function pushDeviceId(db: Database, userId: string, endpoint: string) {
  const row = await db.prepare("SELECT id FROM push_subscriptions WHERE id=? AND user_id=?").bind(targetId(endpoint), userId).first<{ id: string }>();
  return row?.id ?? null;
}

export async function readPushTarget(db: Database, userId: string, endpoint: string): Promise<PushTarget | null> {
  const row = await db.prepare("SELECT endpoint,p256dh,auth FROM push_subscriptions WHERE id=? AND user_id=?")
    .bind(targetId(endpoint), userId).first<{ endpoint: string; p256dh: string; auth: string }>();
  return row ? { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } } : null;
}

export type PushDelivery = {
  order_id: string; subscription_id: string; code: string; endpoint: string; p256dh: string; auth: string; claim_token: string;
};

export async function claimPushDeliveries(db: Database, now = Date.now()) {
  const token = randomUUID();
  await db.prepare(`
    UPDATE push_deliveries d SET claim_token=?,locked_until=?
    WHERE (d.order_id,d.subscription_id) IN (
      SELECT p.order_id,p.subscription_id FROM push_deliveries p
      JOIN push_subscriptions s ON s.id=p.subscription_id
      JOIN admin_access a ON a.user_id=s.user_id AND a.active=1 AND a.must_change_password=0
      JOIN orders o ON o.id=p.order_id AND o.status='recebido'
      WHERE p.sent_at IS NULL AND p.next_attempt<=? AND p.locked_until<=? AND p.created_at>=?
      ORDER BY p.created_at LIMIT 50 FOR UPDATE OF p SKIP LOCKED
    )
  `).bind(token, now + 60000, now, now, now - 15 * 60000).run();
  const { results } = await db.prepare(`
    SELECT d.order_id,d.subscription_id,d.claim_token,o.code,s.endpoint,s.p256dh,s.auth
    FROM push_deliveries d JOIN orders o ON o.id=d.order_id
    JOIN push_subscriptions s ON s.id=d.subscription_id WHERE d.claim_token=?
  `).bind(token).all<PushDelivery>();
  return results;
}

export async function finishPushDelivery(db: Database, delivery: PushDelivery, status: "sent" | "retry" | "expired", now = Date.now()) {
  if (status === "expired") {
    await db.prepare("DELETE FROM push_subscriptions WHERE id=? AND p256dh=? AND auth=?")
      .bind(delivery.subscription_id, delivery.p256dh, delivery.auth).run();
    return;
  }
  await db.prepare(`
    UPDATE push_deliveries SET sent_at=?,attempts=attempts+1,next_attempt=?,claim_token=NULL,locked_until=0
    WHERE order_id=? AND subscription_id=? AND claim_token=?
  `).bind(status === "sent" ? now : null, now + 1000, delivery.order_id, delivery.subscription_id, delivery.claim_token).run();
}
