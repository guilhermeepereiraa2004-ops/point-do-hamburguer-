import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { sendNotification } from "web-push";
import { getStore } from "@/db";
import { claimPushDeliveries, finishPushDelivery, readPushTarget } from "@/db/push";
import { createPushReceipt } from "./push-receipt";
import { PUSH_ACK_WAIT_MS, PUSH_RETENTION_MS } from "@/domain/push";

export function getPushConfig() {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject: process.env.BETTER_AUTH_URL || "https://point-do-hamburguer.vercel.app" };
}

export async function sendPushTest(userId: string, endpoint: string) {
  const config = getPushConfig();
  const target = await readPushTarget(getStore(), userId, endpoint);
  if (!config || !target) throw new Error("Ative as notificações neste aparelho primeiro.");
  const receipt = createPushReceipt(config.privateKey);
  await sendNotification(target, JSON.stringify({ test: true,
    tag: `point-push-test-${randomUUID()}`, receipt: receipt.token }),
    { vapidDetails: config, TTL: 60, urgency: "high", timeout: 7000 });
}

export async function dispatchOrderPush() {
  const config = getPushConfig();
  if (!config) return;
  try {
    const db = getStore();
    for (let round = 0; round < 3; round++) {
      const deliveries = await claimPushDeliveries(db);
      if (!deliveries.length) return;
      const results = await Promise.allSettled(deliveries.map(async delivery => {
        try {
          await sendNotification({ endpoint: delivery.endpoint, keys: { p256dh: delivery.p256dh, auth: delivery.auth } },
            JSON.stringify({ code: delivery.code, tag: `point-order-${delivery.order_id}`,
              receipt: createPushReceipt(config.privateKey, "standard", Date.now(), {
                orderId: delivery.order_id, subscriptionId: delivery.subscription_id,
              }).token }),
            { vapidDetails: config, TTL: PUSH_RETENTION_MS / 1000, urgency: "high", timeout: 7000,
              topic: createHash("sha256").update(delivery.order_id).digest("base64url").slice(0, 32) });
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          await finishPushDelivery(db, delivery, status === 404 || status === 410 ? "expired" : "retry");
          return;
        }
        await finishPushDelivery(db, delivery, "sent");
      }));
      if (results.some(result => result.status === "rejected")) console.error("[push] delivery state update failed");
      if (round < 2) await new Promise(resolve => setTimeout(resolve, PUSH_ACK_WAIT_MS + 1000));
    }
  } catch {
    console.error("[push] notification dispatch unavailable");
  }
}
