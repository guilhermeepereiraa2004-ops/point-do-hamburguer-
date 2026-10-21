import { Pool } from "pg";
import { readFileSync } from "node:fs";
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL, max: 1 });
const client = await pool.connect();
try {
  await client.query("BEGIN"); await client.query("SELECT pg_advisory_xact_lock(20718219)");
  await client.query("CREATE TABLE IF NOT EXISTS point_migrations(id text PRIMARY KEY,applied_at bigint NOT NULL)");
  const { rows } = await client.query("SELECT id FROM point_migrations");
  const applied = new Set(rows.map(row => row.id));
  // The initial, atomic D1 import already installed these two migrations.
  if (applied.has("d1-to-postgres-v1")) for (const id of ["0000_postgres_schema", "0001_inventory_transactions"]) {
    await client.query("INSERT INTO point_migrations(id,applied_at) VALUES($1,$2) ON CONFLICT DO NOTHING",[id,Date.now()]); applied.add(id);
  }
  const journal = JSON.parse(readFileSync("drizzle-pg/meta/_journal.json","utf8"));
  for (const migration of journal.entries) {
    if(applied.has(migration.tag)) continue;
    await client.query(readFileSync(`drizzle-pg/${migration.tag}.sql`,"utf8"));
    await client.query("INSERT INTO point_migrations(id,applied_at) VALUES($1,$2)",[migration.tag,Date.now()]);
    console.log(`Migração aplicada: ${migration.tag}`);
  }
  await client.query("COMMIT");
} catch (error) { await client.query("ROLLBACK"); console.error({migrationFailed:true,code:error.code}); process.exitCode=1; }
finally {client.release();await pool.end();}
