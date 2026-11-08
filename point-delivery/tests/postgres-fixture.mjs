import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { postgresDatabase } from "../db/postgres-adapter.ts";
export async function postgresFixture(t, withPush = false) {
  const client = new PGlite();
  t.after(() => client.close());
  for (const name of ["0000_postgres_schema", "0001_inventory_transactions", "0003_multi_burger_orders", "0006_store_status", "0007_order_payment", "0008_cash_change"]) await client.exec(readFileSync(new URL(`../drizzle-pg/${name}.sql`, import.meta.url), "utf8"));
  if (withPush) for (const name of ["0002_admin_auth", "0004_admin_push", "0005_push_devices"]) await client.exec(readFileSync(new URL(`../drizzle-pg/${name}.sql`, import.meta.url), "utf8"));
  return postgresDatabase({
    query: query => client.query(query.sql, query.values).then(result => ({ rows: result.rows, rowCount: result.affectedRows ?? result.rows.length })),
    transaction: queries => client.transaction(async tx => {
      const results = [];
      for (const query of queries) { const result = await tx.query(query.sql, query.values); results.push({ rows: result.rows, rowCount: result.affectedRows ?? result.rows.length }); }
      return results;
    }),
  });
}
