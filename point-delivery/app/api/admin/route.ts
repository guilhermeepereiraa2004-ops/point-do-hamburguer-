import { isAdmin } from "@/actions/admin";
import { getDashboard, updateStatus, updateCatalog } from "@/actions/store";
import type { Status } from "@/domain/menu";
import { hasValidRequestOrigin } from "@/lib/request-origin";
export async function GET() {
  if (!await isAdmin()) return Response.json({ error: "Acesso restrito." }, { status: 403 });
  try { return Response.json(await getDashboard(), { headers: { "Cache-Control": "no-store" } }); } catch { return Response.json({ error: "Falha ao carregar o painel." }, { status: 503 }); }
}
export async function POST(request: Request) {
  if (!await isAdmin()) return Response.json({ error: "Acesso restrito." }, { status: 403 });
  if (!hasValidRequestOrigin(request)) return Response.json({ error: "Origem inválida." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 20000) return Response.json({ error: "Solicitação muito grande." }, { status: 413 });
  try { const input = await request.json() as Record<string, unknown>; if (input.kind === "status") await updateStatus(String(input.id), input.value as Status); else await updateCatalog(input); return Response.json({ ok: true }); }
  catch (e) { return Response.json({ error: e instanceof Error ? e.message : "Não foi possível salvar." }, { status: 400 }); }
}
