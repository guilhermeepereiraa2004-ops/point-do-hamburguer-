-- Lock rows in the reservation's canonical order. A failure rolls back the entire batch.
CREATE OR REPLACE FUNCTION reserve_ingredient() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE ingredient ingredients%ROWTYPE;
BEGIN
  SELECT * INTO ingredient FROM ingredients WHERE id=NEW.ingredient_id FOR UPDATE;
  IF NOT FOUND OR ingredient.active<>1 OR (ingredient.category='Complementos' AND ingredient.featured<>1) THEN
    RAISE EXCEPTION 'ingredient_unavailable' USING ERRCODE='23514';
  END IF;
  IF NEW.quantity>ingredient.max_qty THEN RAISE EXCEPTION 'invalid_quantity' USING ERRCODE='23514'; END IF;
  UPDATE ingredients SET stock=stock-NEW.quantity WHERE id=NEW.ingredient_id;
  INSERT INTO movements(ingredient_id,delta,reason,created_at) VALUES(NEW.ingredient_id,-NEW.quantity,'Pedido '||NEW.order_id,(extract(epoch FROM clock_timestamp())*1000)::bigint);
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER order_item_reserve BEFORE INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION reserve_ingredient();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION handle_order_status() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status=OLD.status THEN RETURN NEW; END IF;
  IF NOT ((OLD.status='recebido' AND NEW.status IN ('preparo','cancelado')) OR (OLD.status='preparo' AND NEW.status IN ('entrega','cancelado')) OR (OLD.status='entrega' AND NEW.status IN ('concluido','cancelado'))) THEN
    RAISE EXCEPTION 'invalid_order_transition' USING ERRCODE='23514';
  END IF;
  IF NEW.status='cancelado' THEN
    -- Same lock order as reservations prevents crossed-ingredient deadlocks.
    PERFORM id FROM ingredients WHERE id IN (SELECT ingredient_id FROM order_items WHERE order_id=NEW.id) ORDER BY id FOR UPDATE;
    INSERT INTO movements(ingredient_id,delta,reason,created_at) SELECT ingredient_id,quantity,'Cancelamento '||NEW.code,(extract(epoch FROM clock_timestamp())*1000)::bigint FROM order_items WHERE order_id=NEW.id;
    UPDATE ingredients SET stock=stock+restored.quantity FROM (SELECT ingredient_id,SUM(quantity)::integer AS quantity FROM order_items WHERE order_id=NEW.id GROUP BY ingredient_id) restored WHERE ingredients.id=restored.ingredient_id;
  ELSIF NEW.status='concluido' THEN
    INSERT INTO finance(order_id,value,created_at) VALUES(NEW.id,NEW.total,(extract(epoch FROM clock_timestamp())*1000)::bigint) ON CONFLICT(order_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER order_status_change AFTER UPDATE OF status ON orders FOR EACH ROW EXECUTE FUNCTION handle_order_status();
--> statement-breakpoint
--> statement-breakpoint
CREATE INDEX orders_created_at_idx ON orders(created_at);
--> statement-breakpoint
CREATE INDEX order_items_order_idx ON order_items(order_id);
--> statement-breakpoint
CREATE INDEX movements_created_at_idx ON movements(created_at);
--> statement-breakpoint
CREATE INDEX finance_created_at_idx ON finance(created_at);
--> statement-breakpoint
ALTER TABLE ingredients ADD CONSTRAINT valid_active CHECK(active IN (0,1));
--> statement-breakpoint
ALTER TABLE ingredients ADD CONSTRAINT valid_featured CHECK(featured IN (0,1));
