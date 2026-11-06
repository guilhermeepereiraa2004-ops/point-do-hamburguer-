import { isAdmin } from "@/actions/admin";
import { getDashboard, updateStatus, updateCatalog } from "@/actions/store";
import { getStore } from "@/db";
import { readCustomerOrders } from "@/db/customer-orders";
import type { Status } from "@/domain/menu";
import { hasValidRequestOrigin } from "@/lib/request-origin";
async function checkAdmin(): Promise<Response | null> {
  try {
    return await isAdmin() ? null : Response.json({ error: "Acesso restrito." }, { status: 403 });
  } catch {
    return Response.json({ error: "Não foi possível verificar o acesso agora." }, { status: 503 });
  }
}
export async function GET() {
  const denied = await checkAdmin();
  if (denied) return denied;
  try { return Response.json(await getDashboard(), { headers: { "Cache-Control": "no-store" } }); } catch { return Response.json({ error: "Falha ao carregar o painel." }, { status: 503 }); }
}
export async function POST(request: Request) {
  const denied = await checkAdmin();
  if (denied) return denied;
  if (!hasValidRequestOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 20000) return Response.json({ error: "Solicitação muito grande." }, { status: 413 });
  try {
    const input = await request.json() as Record<string, unknown>;
    if (input.kind === "customer-history") {
      const { name, phone } = input;
      if (typeof name !== "string" || !name.trim() || name.length > 100 ||
          typeof phone !== "string" || !phone.trim() || phone.length > 20) {
        return Response.json({ error: "Confira o nome e o telefone do cliente." }, { status: 400 });
      }
      try {
        const orders = await readCustomerOrders(getStore(), name, phone);
        return Response.json({ orders }, { headers: { "Cache-Control": "no-store" } });
      } catch {
        return Response.json({ error: "Não foi possível carregar o histórico agora." }, { status: 503 });
      }
    }
    if (input.kind === "status") await updateStatus(String(input.id), input.value as Status);
    else await updateCatalog(input);
    return Response.json({ ok: true });
  }
  catch (e) { return Response.json({ error: e instanceof Error ? e.message : "Não foi possível salvar." }, { status: 400 }); }
}
