import type { Order } from "../domain/menu.ts";
import type { Database } from "./contracts";

type BoardOrder = Omit<Order, "items" | "extras" | "burgers"> & { burgers: string };

/** Active orders never compete with the bounded, terminal-order history. */
export async function readBoardOrders(db: Database): Promise<BoardOrder[]> {
  const { results } = await db.prepare(`
    SELECT id,code,customer,phone,address,reference,notes,status,subtotal,
      delivery_fee AS "deliveryFee",total,created_at AS "createdAt",burgers,
      payment_method AS "paymentMethod",needs_change AS "needsChange",change_for AS "changeFor"
    FROM orders
    WHERE status IN ('recebido','preparo','entrega') OR id IN (
      SELECT id FROM orders WHERE status IN ('concluido','cancelado')
      ORDER BY created_at DESC,id DESC LIMIT 200
    )
    ORDER BY created_at DESC,id DESC
  `).all<BoardOrder>();
  return results.map(order => ({ ...order, createdAt: Number(order.createdAt) }));
}
