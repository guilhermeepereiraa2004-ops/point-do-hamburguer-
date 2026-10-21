-- Recheck manual availability inside the atomic order reservation, even for stale catalogs.
CREATE TRIGGER order_item_require_active BEFORE INSERT ON order_items
WHEN NOT EXISTS (SELECT 1 FROM ingredients WHERE id = NEW.ingredient_id AND active = 1)
BEGIN
  SELECT RAISE(ABORT, 'ingredient_unavailable');
END;
