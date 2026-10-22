import type { Database } from "./contracts";
import type { OrderProgress } from "../lib/order-tracking";

export async function readOrderProgress(db: Database, id: string): Promise<OrderProgress | null> {
  const row = await db.prepare("SELECT code,status,total,created_at FROM orders WHERE id=?").bind(id).first<{ code: string; status: OrderProgress["status"]; total: number; created_at: number | string }>();
  return row ? { code: row.code, status: row.status, total: Number(row.total), createdAt: Number(row.created_at) } : null;
}
