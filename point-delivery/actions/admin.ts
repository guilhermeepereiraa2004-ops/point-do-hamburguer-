import "server-only";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getStore } from "@/db";
import { adminAccess } from "@/db/admin-access";
export async function getAdminIdentity() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  const access = await adminAccess(getStore(),session.user.id);
  return access ? { user: session.user, ...access } : null;
}
export async function isAdmin() {
  const identity = await getAdminIdentity();
  return Boolean(identity && !identity.mustChangePassword);
}
export async function assertAdmin() { if (!await isAdmin()) throw new Error("Acesso administrativo necessário."); }
