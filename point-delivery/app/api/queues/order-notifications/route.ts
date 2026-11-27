import { handleCallback } from "@vercel/queue";
import { getStore } from "@/db";
import { dispatchOrderPush, getPushConfig } from "@/lib/order-push";
import { usesVercelPushQueue } from "@/lib/order-push-queue";
import { isPushRecoveryMessage, pushRecoveryDelay, recoverOrderPush } from "@/lib/push-recovery";

export const maxDuration = 60;
// Queue triggers are private on Vercel. Never register a remote consumer in local dev.
const consume = usesVercelPushQueue() ? handleCallback(async (message: unknown) => {
  if (!isPushRecoveryMessage(message)) return;
  try {
    if (!getPushConfig()) throw new Error("Push configuration unavailable");
    await recoverOrderPush(message, getStore(), orderId => dispatchOrderPush({ orderId, rounds: 1 }));
  } catch {
    // Avoid leaking database details or subscription endpoints into SDK logs.
    throw new Error("Push recovery pending");
  }
}, { retry: (_error, metadata) => ({ afterSeconds: pushRecoveryDelay(metadata.deliveryCount) }) }) : null;

export async function POST(request: Request) {
  if (!consume) return Response.json({ error: "Não disponível neste ambiente." }, { status: 403 });
  return consume(request);
}
