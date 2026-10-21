import type { Database } from "./contracts";
export async function adminAccess(database: Database, userId: string | undefined) {
  if(!userId)return null;
  const access=await database.prepare("SELECT user_id,must_change_password FROM admin_access WHERE user_id=? AND active=1").bind(userId).first();
  return access ? {mustChangePassword:Boolean(access.must_change_password)} : null;
}
