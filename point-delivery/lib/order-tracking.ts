import { createHmac, timingSafeEqual } from "node:crypto";

export type OrderProgress = { code: string; status: "recebido" | "preparo" | "entrega" | "concluido" | "cancelado"; total: number; createdAt: number };
const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export function getTrackingSecret() {
  const secret = process.env.ORDER_TRACKING_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Acompanhamento de pedidos não configurado.");
  return secret;
}
export function trackingToken(id: string, secret: string) {
  if (!validId(id) || secret.length < 32) throw new Error("Acompanhamento de pedidos não configurado.");
  return createHmac("sha256", secret).update(`point:order-tracking:v1:${id}`).digest("base64url");
}
export function orderConfirmation(order: { id: string; code: string }, secret: string) {
  return { code: order.code, trackingUrl: `/pedido/${order.id}#acesso=${trackingToken(order.id, secret)}` };
}
export async function trackingResponse(request: Request, id: string, secret: string, read: (id: string) => Promise<OrderProgress | null>) {
  const headers = { "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow", "Vary": "Authorization" };
  const missing = () => Response.json({ error: "Link de acompanhamento inválido ou pedido não encontrado." }, { status: 404, headers });
  const token = request.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  if (!validId(id) || !token) return missing();
  try {
    const expected = trackingToken(id, secret);
    if (!timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return missing();
    const order = await read(id);
    if (!order) return missing();
    // Keep the response explicitly limited, even if the persistence model grows.
    return Response.json({ code: order.code, status: order.status, total: order.total, createdAt: order.createdAt }, { headers });
  } catch {
    return Response.json({ error: "Não foi possível atualizar seu pedido agora. Tente novamente." }, { status: 503, headers });
  }
}
