import type { Database } from "../db/contracts";
import { hasPendingOrderPush } from "../db/push.ts";

export type PushRecoveryMessage = { version: 1; orderId: string };
export function isPushRecoveryMessage(message: unknown): message is PushRecoveryMessage {
  if (!message || typeof message !== "object") return false;
  const candidate = message as Partial<PushRecoveryMessage>;
  return candidate.version === 1 && typeof candidate.orderId === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate.orderId);
}

/** Throwing keeps the durable message pending until the browser confirms display. */
export async function recoverOrderPush(message: unknown, db: Database, dispatch: (orderId: string) => Promise<void>, now = Date.now()) {
  if (!isPushRecoveryMessage(message) || !await hasPendingOrderPush(db, message.orderId, now)) return;
  await dispatch(message.orderId);
  if (await hasPendingOrderPush(db, message.orderId, now)) throw new Error("Push delivery awaiting confirmation");
}

export const pushRecoveryDelay = (deliveryCount: number) => Math.min(300, 30 * 2 ** Math.min(4, Math.max(0, deliveryCount - 1)));
