import type { AccompanimentInput, ManualEntry } from "../domain/management";
export async function saveAccompaniment(db: D1Database, item: AccompanimentInput, create: boolean) {
  if (create) {
    const existing = () => db.prepare("SELECT i.description,i.name,i.price,i.category,i.extra_type AS extraType,i.low_stock AS lowStock,i.max_qty AS maxQty,m.delta AS initialStock FROM ingredients i LEFT JOIN movements m ON m.ingredient_id=i.id AND m.reason='Cadastro de acompanhamento' WHERE i.id=?").bind(item.id).first();
    const same = (row: Record<string, unknown> | null) => row && row.category === "Complementos" && row.name === item.name && row.description === item.description && row.price === item.price && row.extraType === item.extraType && row.lowStock === item.lowStock && row.maxQty === item.maxQty && row.initialStock === item.stock;
    const prior = await existing();
    if (prior) { if (same(prior)) return; throw new Error("Este cadastro já existe com outros dados. Atualize a lista."); }
    try {
      await db.batch([
        db.prepare("INSERT INTO ingredients (id,name,category,unit,stock,low_stock,max_qty,price,active,extra_type,product_name,flavor,size,description) VALUES (?,?,'Complementos',?,?,?,?,?,1,?,?,?,?,?)")
          .bind(item.id, item.name, item.extraType === "batata-frita" ? "porção" : "unidade", item.stock, item.lowStock, item.maxQty, item.price, item.extraType, item.productName, item.flavor, item.size, item.description),
        db.prepare("INSERT INTO movements (ingredient_id,delta,reason,created_at) VALUES (?,?,'Cadastro de acompanhamento',?)").bind(item.id, item.stock, Date.now()),
      ]);
    } catch (error) { if (!same(await existing())) throw error; }
    return;
  }
  const result = await db.prepare("UPDATE ingredients SET name=?,product_name=?,extra_type=?,flavor=?,size=?,price=?,low_stock=?,max_qty=?,unit=?,description=? WHERE id=? AND category='Complementos'")
    .bind(item.name, item.productName, item.extraType, item.flavor, item.size, item.price, item.lowStock, item.maxQty, item.extraType === "batata-frita" ? "porção" : "unidade", item.description, item.id).run();
  if (!result.meta.changes) throw new Error("Acompanhamento não encontrado.");
}
export async function addManualEntry(db: D1Database, entry: Omit<ManualEntry, "createdAt">) {
  await db.prepare("INSERT INTO manual_finance (id,type,description,value,occurred_at,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING")
    .bind(entry.id, entry.type, entry.description, entry.value, entry.occurredAt, Date.now()).run();
  const saved = await db.prepare("SELECT type,description,value,occurred_at FROM manual_finance WHERE id=?").bind(entry.id).first();
  if (!saved || saved.type !== entry.type || saved.description !== entry.description || saved.value !== entry.value || saved.occurred_at !== entry.occurredAt) throw new Error("Este lançamento já foi registrado com outros dados. Abra um novo lançamento.");
}
export async function setProductFeatured(db: D1Database, id: string, featured: boolean) {
  if (typeof featured !== "boolean") throw new Error("Informe se o produto deve aparecer nos acompanhamentos.");
  const result = await db.prepare("UPDATE ingredients SET featured=? WHERE id=? AND category='Complementos'").bind(featured ? 1 : 0, id).run();
  if (!result.meta.changes) throw new Error("Produto do cardápio não encontrado.");
}
