CREATE TABLE "finance" (
	"order_id" text PRIMARY KEY NOT NULL,
	"value" integer NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"unit" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"low_stock" integer DEFAULT 10 NOT NULL,
	"max_qty" integer DEFAULT 4 NOT NULL,
	"price" integer,
	"active" integer DEFAULT 1 NOT NULL,
	"extra_type" text,
	"product_name" text,
	"flavor" text,
	"size" text,
	"featured" integer DEFAULT 0 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	CONSTRAINT "non_negative_stock" CHECK ("ingredients"."stock" >= 0),
	CONSTRAINT "non_negative_price" CHECK ("ingredients"."price" IS NULL OR "ingredients"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "manual_finance" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"value" integer NOT NULL,
	"occurred_at" bigint NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "manual_positive_value" CHECK ("manual_finance"."value" > 0),
	CONSTRAINT "manual_entry_type" CHECK ("manual_finance"."type" IN ('entrada','saida'))
);
--> statement-breakpoint
CREATE TABLE "movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"ingredient_id" text NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"ingredient_id" text NOT NULL,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "positive_qty" CHECK ("order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"idempotency_key" text NOT NULL,
	"fingerprint" text NOT NULL,
	"code" text NOT NULL,
	"customer" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"reference" text NOT NULL,
	"notes" text NOT NULL,
	"status" text DEFAULT 'recebido' NOT NULL,
	"subtotal" integer NOT NULL,
	"delivery_fee" integer NOT NULL,
	"total" integer NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"count" integer PRIMARY KEY NOT NULL,
	"value" integer NOT NULL,
	CONSTRAINT "valid_price" CHECK ("prices"."value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" integer
);
--> statement-breakpoint
ALTER TABLE "finance" ADD CONSTRAINT "finance_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;