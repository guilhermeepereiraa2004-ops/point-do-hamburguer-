import { getStore } from "@/db";
import { readOrderProgress } from "@/db/order-tracking";
import { getTrackingSecret, trackingResponse } from "@/lib/order-tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Resolve configuration inside the protected response path; never log access tokens.
  return trackingResponse(request, id, process.env.ORDER_TRACKING_SECRET || process.env.BETTER_AUTH_SECRET || "", async orderId => {
    getTrackingSecret();
    return readOrderProgress(getStore(), orderId);
  });
}
