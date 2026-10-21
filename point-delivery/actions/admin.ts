import { headers } from "next/headers";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
export async function isAdmin() {
  const user = await getChatGPTUser();
  if (!user) return false;
  const host = (await headers()).get("host") || "";
  if (process.env.NODE_ENV !== "production" && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) && user.userId === "local_seedy") return true;
  const allowed = ((env as unknown as { ADMIN_USER_IDS?: string }).ADMIN_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
  return allowed.includes(user.userId);
}
export async function assertAdmin() { if (!await isAdmin()) throw new Error("Acesso administrativo necessário."); }
