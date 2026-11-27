import "server-only";
import { send } from "@vercel/queue";
import { dispatchOrderPush } from "./order-push";
import { PUSH_RETENTION_MS } from "@/domain/push";
import type { PushRecoveryMessage } from "./push-recovery";

export const PUSH_RECOVERY_TOPIC = "point-order-notifications";
export const usesVercelPushQueue = () => process.env.VERCEL === "1" && process.env.NODE_ENV === "production";

export async function scheduleAndDispatchOrderPush(orderId: string) {
  if (usesVercelPushQueue()) {
    // Publish before sending so a timeout in the immediate dispatcher cannot lose recovery.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await send(PUSH_RECOVERY_TOPIC, { version: 1, orderId } satisfies PushRecoveryMessage,
          { idempotencyKey: `point-push-${orderId}`, retentionSeconds: PUSH_RETENTION_MS / 1000, delaySeconds: 5 });
        break;
      } catch {
        if (attempt === 2) console.error("[push] durable recovery scheduling unavailable; database outbox retained");
        else await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  await dispatchOrderPush({ orderId });
}
