import type { Order, Status } from "../domain/menu";
import { normalizeCustomerPhone, type CustomerOrder } from "../domain/reporting.ts";
import type { Database } from "./contracts";

type HistoryRow = {
  id: string; code: string; created_at: number | string; total: number; status: Status;
  burgers: string; name: string | null; quantity: number | null; category: string | null;
};

export async function readCustomerOrders(db: Database, phone: string): Promise<CustomerOrder[]> {
  const digits = normalizeCustomerPhone(phone);
  if (!digits) return [];
  const withCountryCode = /^\d{10,11}$/.test(digits) ? `55${digits}` : digits;

  const { results } = await db.prepare(`
    SELECT o.id, o.code, o.created_at, o.total, o.status, o.burgers, i.name, i.quantity, p.category
    FROM orders o
    LEFT JOIN order_items i ON i.order_id = o.id
    LEFT JOIN ingredients p ON p.id = i.ingredient_id
    WHERE regexp_replace(o.phone, '[^0-9]', '', 'g') IN (?, ?)
    ORDER BY o.created_at DESC, o.id DESC, i.id
  `).bind(digits, withCountryCode).all<HistoryRow>();

  const history = new Map<string, CustomerOrder>();
  for (const row of results) {
    let order = history.get(row.id);
    if (!order) {
      order = {
        id: row.id, code: row.code, status: row.status, total: row.total, createdAt: Number(row.created_at),
        burgers: JSON.parse(row.burgers) as Order["burgers"], items: [], extras: [],
      };
      history.set(row.id, order);
    }
    if (row.name !== null && row.quantity !== null) {
      const item = { name: row.name, quantity: row.quantity };
      order.items.push(item);
      if (row.category === "Complementos") order.extras?.push(item);
    }
  }
  return [...history.values()];
}
