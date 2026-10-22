import { placeOrder } from "@/actions/store";
import { InsufficientStockError } from "@/domain/menu";
import { hasValidRequestOrigin } from "@/lib/request-origin";
export async function POST(request: Request) {
  try { if (!hasValidRequestOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
    if (Number(request.headers.get("content-length") || 0) > 20000) return Response.json({ error: "Pedido muito grande." }, { status: 413 });
    return Response.json(await placeOrder(await request.json()));
  } catch (e) {
    if (e instanceof InsufficientStockError) return Response.json({ error: e.message, code: "INSUFFICIENT_STOCK", shortages: e.shortages }, { status: 409 });
    return Response.json({ error: e instanceof Error ? e.message : "Não foi possível enviar seu pedido." }, { status: 400 });
  }
}
