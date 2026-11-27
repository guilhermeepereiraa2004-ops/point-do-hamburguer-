import type { Database } from "./contracts";

/** Lock before reading the old balance; update and audit share one SQL statement. */
export async function adjustIngredientStock(db: Database, id: string, stock: number, reason: string, now = Date.now()) {
  const result = await db.prepare(`
    WITH previous AS MATERIALIZED (
      SELECT id,stock FROM ingredients WHERE id=? FOR UPDATE
    ), adjusted AS (
      UPDATE ingredients i SET stock=? FROM previous p WHERE i.id=p.id
      RETURNING i.id,p.stock AS old_stock
    )
    INSERT INTO movements(ingredient_id,delta,reason,created_at)
    SELECT id,?-old_stock,?,? FROM adjusted RETURNING ingredient_id
  `).bind(id, stock, stock, reason, now).first();
  if (!result) throw new Error("Ingrediente não encontrado.");
}
