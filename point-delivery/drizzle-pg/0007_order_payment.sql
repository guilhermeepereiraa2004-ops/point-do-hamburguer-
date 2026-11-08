ALTER TABLE orders ADD COLUMN payment_method text
  CHECK (payment_method IN ('pix', 'credito', 'debito', 'dinheiro'));
