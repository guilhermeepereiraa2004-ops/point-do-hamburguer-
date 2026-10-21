import type { Database } from "./contracts";
type Reservation = {
  id: string; idempotencyKey: string; fingerprint: string; code: string;
  customer: string; phone: string; address: string; reference: string; notes: string;
  subtotal: number; deliveryFee: number; total: number; createdAt: number;
};
type ReservationItem = { id: string; name: string; quantity: number };

/** PostgreSQL transaction commits the order and all trigger-driven stock deductions together. */
export function reserveOrder(db: Database, order: Reservation, items: ReservationItem[]) {
  const insert = db.prepare("INSERT INTO orders (id,idempotency_key,fingerprint,code,customer,phone,address,reference,notes,status,subtotal,delivery_fee,total,created_at) VALUES (?,?,?,?,?,?,?,?,?,'recebido',?,?,?,?)")
    .bind(order.id, order.idempotencyKey, order.fingerprint, order.code, order.customer, order.phone, order.address, order.reference, order.notes, order.subtotal, order.deliveryFee, order.total, order.createdAt);
  return db.batch([insert, ...[...items].sort((a, b) => a.id.localeCompare(b.id)).map(item => db.prepare("INSERT INTO order_items (order_id,ingredient_id,name,quantity) VALUES (?,?,?,?)").bind(order.id, item.id, item.name, item.quantity))]);
}
