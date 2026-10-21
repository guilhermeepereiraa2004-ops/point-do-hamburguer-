import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { postgresDatabase } from "../db/postgres-adapter.ts";
export async function postgresFixture(t) {
  const client = new PGlite();
  t.after(() => client.close());
  for (const name of ["0000_postgres_schema", "0001_inventory_transactions"]) await client.exec(readFileSync(new URL(`../drizzle-pg/${name}.sql`, import.meta.url), "utf8"));
  return postgresDatabase({
    query: query => client.query(query.sql, query.values).then(result => ({ rows: result.rows, rowCount: result.affectedRows ?? result.rows.length })),
    transaction: queries => client.transaction(async tx => {
      const results = [];
      for (const query of queries) { const result = await tx.query(query.sql, query.values); results.push({ rows: result.rows, rowCount: result.affectedRows ?? result.rows.length }); }
      return results;
    }),
  });
}
