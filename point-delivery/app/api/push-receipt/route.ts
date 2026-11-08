import { pushReceiptResponse } from "@/lib/push-receipt";
import { confirmPushDelivery } from "@/db/push";
import { getStore } from "@/db";

export async function POST(request: Request) {
  return pushReceiptResponse(request, process.env.WEB_PUSH_PRIVATE_KEY || "",
    event => console.info("[push-receipt]", JSON.stringify(event)), Date.now(),
    delivery => confirmPushDelivery(getStore(), delivery));
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store",
  } });
}
