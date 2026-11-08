INSERT INTO settings (key, value) VALUES ('storeOpen', 1) ON CONFLICT (key) DO NOTHING;

-- Keep the shared lock until reservation commits; closing takes an UPDATE lock.
CREATE FUNCTION point_require_open_store() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE is_open integer;
BEGIN
  SELECT value INTO is_open FROM settings WHERE key = 'storeOpen' FOR SHARE;
  IF is_open IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'POINT_STORE_CLOSED';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER orders_require_open_store BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION point_require_open_store();
