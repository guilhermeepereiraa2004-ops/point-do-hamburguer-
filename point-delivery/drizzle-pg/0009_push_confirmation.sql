ALTER TABLE push_deliveries ADD COLUMN confirmed_at bigint;
ALTER TABLE push_deliveries ADD COLUMN confirmation_required integer NOT NULL DEFAULT 1 CHECK (confirmation_required IN (0,1));
-- Preserve legacy acceptances without inventing a device confirmation or replaying alerts.
UPDATE push_deliveries SET confirmation_required = 0 WHERE sent_at IS NOT NULL;
CREATE INDEX push_deliveries_unconfirmed_idx ON push_deliveries(next_attempt,locked_until)
  WHERE confirmed_at IS NULL AND confirmation_required = 1;
