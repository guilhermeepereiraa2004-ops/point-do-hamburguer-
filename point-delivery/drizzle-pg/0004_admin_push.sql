CREATE TABLE push_subscriptions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES admin_access(user_id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  updated_at bigint NOT NULL
);
CREATE INDEX push_subscriptions_user_idx ON push_subscriptions(user_id);

CREATE TABLE push_deliveries (
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  subscription_id text NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  created_at bigint NOT NULL,
  sent_at bigint,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt bigint NOT NULL DEFAULT 0,
  claim_token text,
  locked_until bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (order_id, subscription_id)
);
CREATE INDEX push_deliveries_pending_idx ON push_deliveries(next_attempt, locked_until) WHERE sent_at IS NULL;

CREATE FUNCTION enqueue_order_push() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO push_deliveries(order_id, subscription_id, created_at)
    SELECT NEW.id, s.id, NEW.created_at FROM push_subscriptions s
    JOIN admin_access a ON a.user_id = s.user_id
    WHERE a.active = 1 AND a.must_change_password = 0;
  RETURN NEW;
END $$;
CREATE TRIGGER order_push_enqueue AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION enqueue_order_push();
