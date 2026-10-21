import { pgTable, text, integer, bigint, serial, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
const millis = (name: string) => bigint(name, { mode: "number" });
export const ingredients = pgTable("ingredients", {
  id: text("id").primaryKey(), name: text("name").notNull(), category: text("category").notNull(), unit: text("unit").notNull(),
  stock: integer("stock").notNull().default(0), lowStock: integer("low_stock").notNull().default(10), maxQty: integer("max_qty").notNull().default(4),
  price: integer("price"), active: integer("active").notNull().default(1),
  extraType: text("extra_type"), productName: text("product_name"), flavor: text("flavor"), size: text("size"),
  featured: integer("featured").notNull().default(0), description: text("description").notNull().default(""),
}, t => [check("non_negative_stock", sql`${t.stock} >= 0`), check("non_negative_price", sql`${t.price} IS NULL OR ${t.price} >= 0`)]);
export const prices = pgTable("prices", { count: integer("count").primaryKey(), value: integer("value").notNull() }, t => [check("valid_price", sql`${t.value} >= 0`)]);
export const settings = pgTable("settings", { key: text("key").primaryKey(), value: integer("value") });
export const orders = pgTable("orders", {
  id: text("id").primaryKey(), idempotencyKey: text("idempotency_key").notNull().unique(), fingerprint: text("fingerprint").notNull(), code: text("code").notNull(),
  customer: text("customer").notNull(), phone: text("phone").notNull(), address: text("address").notNull(), reference: text("reference").notNull(), notes: text("notes").notNull(),
  status: text("status").notNull().default("recebido"), subtotal: integer("subtotal").notNull(), deliveryFee: integer("delivery_fee").notNull(), total: integer("total").notNull(), createdAt: millis("created_at").notNull(),
});
export const orderItems = pgTable("order_items", { id: serial("id").primaryKey(), orderId: text("order_id").notNull().references(() => orders.id), ingredientId: text("ingredient_id").notNull().references(() => ingredients.id), name: text("name").notNull(), quantity: integer("quantity").notNull() }, t => [check("positive_qty", sql`${t.quantity} > 0`)]);
export const movements = pgTable("movements", { id: serial("id").primaryKey(), ingredientId: text("ingredient_id").notNull(), delta: integer("delta").notNull(), reason: text("reason").notNull(), createdAt: millis("created_at").notNull() });
export const finance = pgTable("finance", { orderId: text("order_id").primaryKey().references(() => orders.id), value: integer("value").notNull(), createdAt: millis("created_at").notNull() });
export const manualFinance = pgTable("manual_finance", {
  id: text("id").primaryKey(), type: text("type").notNull(), description: text("description").notNull(), value: integer("value").notNull(), occurredAt: millis("occurred_at").notNull(), createdAt: millis("created_at").notNull(),
}, t => [check("manual_positive_value", sql`${t.value} > 0`), check("manual_entry_type", sql`${t.type} IN ('entrada','saida')`)]);
