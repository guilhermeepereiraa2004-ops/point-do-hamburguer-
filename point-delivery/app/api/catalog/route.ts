import { getCatalog } from "@/actions/store";
export async function GET() { try { return Response.json(await getCatalog(), { headers: { "Cache-Control": "no-store" } }); } catch { return Response.json({ error: "O cardápio está sendo preparado. Tente novamente em instantes." }, { status: 503 }); } }
