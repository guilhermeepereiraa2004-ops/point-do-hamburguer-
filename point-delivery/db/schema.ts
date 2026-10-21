import { sqliteTable, text, integer, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const ingredients = sqliteTable("ingredients", {
  id: text("id").primaryKey(), name: text("name").notNull(), category: text("category").notNull(), unit: text("unit").notNull(),
  stock: integer("stock").notNull().default(0), lowStock: integer("low_stock").notNull().default(10), maxQty: integer("max_qty").notNull().default(4),
  price: integer("price"), active: integer("active", { mode: "boolean" }).notNull().default(true),
  extraType: text("extra_type"), productName: text("product_name"), flavor: text("flavor"), size: text("size"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  description: text("description").notNull().default(""),
}, t => [check("non_negative_stock", sql`${t.stock} >= 0`), check("non_negative_price", sql`${t.price} IS NULL OR ${t.price} >= 0`)]);
export const prices = sqliteTable("prices", { count: integer("count").primaryKey(), value: integer("value").notNull() }, t => [check("valid_price", sql`${t.value} >= 0`)]);
export const settings = sqliteTable("settings", { key: text("key").primaryKey(), value: integer("value") });
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(), idempotencyKey: text("idempotency_key").notNull().unique(), fingerprint: text("fingerprint").notNull(), code: text("code").notNull(),
  customer: text("customer").notNull(), phone: text("phone").notNull(), address: text("address").notNull(), reference: text("reference").notNull(), notes: text("notes").notNull(),
  status: text("status").notNull().default("recebido"), subtotal: integer("subtotal").notNull(), deliveryFee: integer("delivery_fee").notNull(), total: integer("total").notNull(), createdAt: integer("created_at").notNull(),
});
export const orderItems = sqliteTable("order_items", { id: integer("id").primaryKey({ autoIncrement: true }), orderId: text("order_id").notNull().references(() => orders.id), ingredientId: text("ingredient_id").notNull().references(() => ingredients.id), name: text("name").notNull(), quantity: integer("quantity").notNull() }, t => [check("positive_qty", sql`${t.quantity} > 0`)]);
export const movements = sqliteTable("movements", { id: integer("id").primaryKey({ autoIncrement: true }), ingredientId: text("ingredient_id").notNull(), delta: integer("delta").notNull(), reason: text("reason").notNull(), createdAt: integer("created_at").notNull() });
export const finance = sqliteTable("finance", { orderId: text("order_id").primaryKey().references(() => orders.id), value: integer("value").notNull(), createdAt: integer("created_at").notNull() });
export const manualFinance = sqliteTable("manual_finance", {
  id: text("id").primaryKey(), type: text("type").notNull(), description: text("description").notNull(), value: integer("value").notNull(),
  occurredAt: integer("occurred_at").notNull(), createdAt: integer("created_at").notNull(),
}, t => [check("manual_positive_value", sql`${t.value} > 0`), check("manual_entry_type", sql`${t.type} IN ('entrada','saida')`)]);
