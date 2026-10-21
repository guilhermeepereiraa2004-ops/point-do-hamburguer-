CREATE TABLE `manual_finance` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`value` integer NOT NULL,
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "manual_positive_value" CHECK("manual_finance"."value" > 0),
	CONSTRAINT "manual_entry_type" CHECK("manual_finance"."type" IN ('entrada','saida'))
);
--> statement-breakpoint
ALTER TABLE `ingredients` ADD `extra_type` text;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `product_name` text;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `flavor` text;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `size` text;--> statement-breakpoint
UPDATE ingredients SET extra_type=CASE id WHEN 'refrigerante' THEN 'refrigerante' WHEN 'suco' THEN 'suco' ELSE 'batata-frita' END, product_name=name WHERE category='Complementos' AND id IN ('refrigerante','suco','batata-frita') AND extra_type IS NULL;
