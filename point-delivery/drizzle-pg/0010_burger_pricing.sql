-- New burger prices apply to future orders. Order and finance snapshots keep their historical values.
INSERT INTO prices (count, value)
SELECT item_count, (item_count + 11) * 100
FROM generate_series(3, 19) AS item_count
ON CONFLICT (count) DO UPDATE SET value = excluded.value;
