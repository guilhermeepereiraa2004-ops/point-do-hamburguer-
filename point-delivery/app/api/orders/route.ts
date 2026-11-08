import { StoreClosedError } from "@/domain/store-status";
import { placeOrder } from "@/actions/store";
import { InsufficientStockError } from "@/domain/menu";
import { hasValidRequestOrigin } from "@/lib/request-origin";
import { after } from "next/server";
import { dispatchOrderPush } from "@/lib/order-push";
export const maxDuration = 120;
export async function POST(request: Request) {
  try { if (!hasValidRequestOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
    if (Number(request.headers.get("content-length") || 0) > 20000) return Response.json({ error: "Pedido muito grande." }, { status: 413 });
    const result = await placeOrder(await request.json());
    after(dispatchOrderPush);
    return Response.json(result);
  } catch (e) {
    if (e instanceof StoreClosedError) return Response.json({ error: e.message, code: "STORE_CLOSED" }, { status: 409 });
    if (e instanceof InsufficientStockError) return Response.json({ error: e.message, code: "INSUFFICIENT_STOCK", shortages: e.shortages }, { status: 409 });
    return Response.json({ error: e instanceof Error ? e.message : "Não foi possível enviar seu pedido." }, { status: 400 });
  }
}
