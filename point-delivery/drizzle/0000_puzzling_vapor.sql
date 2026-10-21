CREATE TABLE `finance` (
	`order_id` text PRIMARY KEY NOT NULL,
	`value` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`unit` text NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`low_stock` integer DEFAULT 10 NOT NULL,
	`max_qty` integer DEFAULT 4 NOT NULL,
	`price` integer,
	`active` integer DEFAULT true NOT NULL,
	CONSTRAINT "non_negative_stock" CHECK("ingredients"."stock" >= 0),
	CONSTRAINT "non_negative_price" CHECK("ingredients"."price" IS NULL OR "ingredients"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE `movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ingredient_id` text NOT NULL,
	`delta` integer NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL,
	`ingredient_id` text NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "positive_qty" CHECK("order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`idempotency_key` text NOT NULL,
	`fingerprint` text NOT NULL,
	`code` text NOT NULL,
	`customer` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`reference` text NOT NULL,
	`notes` text NOT NULL,
	`status` text DEFAULT 'recebido' NOT NULL,
	`subtotal` integer NOT NULL,
	`delivery_fee` integer NOT NULL,
	`total` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_idempotency_key_unique` ON `orders` (`idempotency_key`);--> statement-breakpoint
CREATE TABLE `prices` (
	`count` integer PRIMARY KEY NOT NULL,
	`value` integer NOT NULL,
	CONSTRAINT "valid_price" CHECK("prices"."value" >= 0)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` integer
);

--> statement-breakpoint
CREATE TRIGGER order_item_reserve AFTER INSERT ON order_items BEGIN
  UPDATE ingredients SET stock = stock - NEW.quantity WHERE id = NEW.ingredient_id;
  INSERT INTO movements (ingredient_id,delta,reason,created_at) VALUES (NEW.ingredient_id,-NEW.quantity,'Pedido ' || NEW.order_id,CAST(unixepoch('subsec') * 1000 AS INTEGER));
END;
--> statement-breakpoint
CREATE TRIGGER order_cancel_restore AFTER UPDATE OF status ON orders WHEN NEW.status = 'cancelado' AND OLD.status != 'cancelado' BEGIN
  INSERT INTO movements (ingredient_id,delta,reason,created_at) SELECT ingredient_id,quantity,'Cancelamento ' || NEW.code,CAST(unixepoch('subsec') * 1000 AS INTEGER) FROM order_items WHERE order_id = NEW.id;
  UPDATE ingredients SET stock = stock + (SELECT quantity FROM order_items WHERE order_id = NEW.id AND ingredient_id = ingredients.id) WHERE id IN (SELECT ingredient_id FROM order_items WHERE order_id = NEW.id);
END;
--> statement-breakpoint
CREATE TRIGGER order_complete_finance AFTER UPDATE OF status ON orders WHEN NEW.status = 'concluido' AND OLD.status != 'concluido' BEGIN
  INSERT INTO finance (order_id,value,created_at) VALUES (NEW.id,NEW.total,CAST(unixepoch('subsec') * 1000 AS INTEGER)) ON CONFLICT(order_id) DO NOTHING;
END;
