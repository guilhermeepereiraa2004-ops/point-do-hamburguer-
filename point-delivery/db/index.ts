import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./pg-schema";
import { postgresDatabase } from "./postgres-adapter";
function client() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Banco de dados não configurado.");
  return neon(url);
}
export function getDb() { return drizzle(client(), { schema }); }
export function getStore() {
  const sql = neon(process.env.DATABASE_URL!, { fullResults: true });
  return postgresDatabase({
    query: query => sql.query(query.sql, query.values),
    transaction: queries => sql.transaction(queries.map(query => sql.query(query.sql, query.values))),
  });
}
