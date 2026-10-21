ALTER TABLE `ingredients` ADD `featured` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE ingredients SET featured=1 WHERE category='Complementos';
--> statement-breakpoint
CREATE TRIGGER order_item_require_featured BEFORE INSERT ON order_items
WHEN EXISTS (SELECT 1 FROM ingredients WHERE id=NEW.ingredient_id AND category='Complementos' AND featured=0)
BEGIN
  SELECT RAISE(ABORT, 'ingredient_unavailable');
END;
