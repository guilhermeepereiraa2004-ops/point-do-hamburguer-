// One-time, atomic copy into the newly provisioned database. Never resets an existing database.
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
const tables = ["ingredients", "prices", "settings", "orders", "order_items", "movements", "finance", "manual_finance"];
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const existing = await sql.query("SELECT to_regclass('public.ingredients') IS NOT NULL AS initialized");
if (existing[0].initialized) {
  console.log("Banco já inicializado. Nenhum dado sobrescrito."); process.exit(0);
}
const root = ".wrangler/state/v3/d1";
const candidates = readdirSync(root, { recursive: true }).filter(path => path.endsWith(".sqlite"));
const matches = candidates.filter(path => {
  const db = new DatabaseSync(`${root}/${path}`, { readOnly: true });
  try { return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='ingredients'").get(); } finally { db.close(); }
});
if (matches.length !== 1) throw new Error("Selecione explicitamente o banco de origem: origem ambígua.");
const db = new DatabaseSync(`${root}/${matches[0]}`, { readOnly: true });
const snapshot = Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT * FROM ${table}`).all()])); db.close();
mkdirSync(".sites-runtime", { recursive: true });
writeFileSync(".sites-runtime/pre-vercel-migration.json", JSON.stringify(snapshot));
const statements = [sql.query("SELECT pg_advisory_xact_lock(20718219)")];
const migration = name => readFileSync(`drizzle-pg/${name}.sql`, "utf8").split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean).forEach(s => statements.push(sql.query(s)));
migration("0000_postgres_schema");
for (const table of tables) for (const row of snapshot[table]) {
  const columns = Object.keys(row);
  statements.push(sql.query(`INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(",")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(",")})`, Object.values(row)));
}
for (const table of ["order_items", "movements"]) statements.push(sql.query(`SELECT setval(pg_get_serial_sequence('${table}','id'),COALESCE(MAX(id),1),COUNT(*)>0) FROM ${table}`));
migration("0001_inventory_transactions");
statements.push(sql.query("CREATE TABLE point_migrations (id text PRIMARY KEY, applied_at bigint NOT NULL)"));
statements.push(sql.query("INSERT INTO point_migrations(id,applied_at) VALUES ('d1-to-postgres-v1',$1)", [Date.now()]));
try {
  await sql.transaction(statements);
  console.log(JSON.stringify({ migrated: Object.fromEntries(tables.map(table => [table, snapshot[table].length])), stock: snapshot.ingredients.reduce((n, item) => n + item.stock, 0) }));
} catch (error) {
  console.error({ code: error.code, position: error.position, routine: error.routine, diagnostic: error.code === "42601" ? error.message : undefined });
  console.error("Migração revertida integralmente. Nenhum dado de origem alterado; confira a conexão e o schema de destino."); process.exitCode = 1;
}
