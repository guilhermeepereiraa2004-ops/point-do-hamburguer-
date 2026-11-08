ALTER TABLE orders ADD COLUMN needs_change integer, ADD COLUMN change_for integer;
ALTER TABLE orders ADD CONSTRAINT valid_cash_change CHECK (
  (needs_change IS NULL AND change_for IS NULL) OR
  (payment_method IS NOT NULL AND payment_method = 'dinheiro' AND needs_change IS NOT NULL AND (
    (needs_change = 0 AND change_for IS NULL) OR
    (needs_change = 1 AND change_for IS NOT NULL AND change_for >= total AND change_for > 0)
  ))
);
