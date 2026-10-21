import { Pool } from "pg";
import { writeFileSync } from "node:fs";
import { getMigrations } from "better-auth/db/migration";
import { authOptions } from "../lib/auth-config.ts";
const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL, max: 1 });
try {
  const plan = await getMigrations(authOptions(pool, process.env.BETTER_AUTH_SECRET));
  const sql = await plan.compileMigrations();
  writeFileSync("drizzle-pg/0002_admin_auth.sql", sql + `
CREATE TABLE admin_access (
  user_id text PRIMARY KEY REFERENCES auth_user(id),
  active integer NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  must_change_password integer NOT NULL DEFAULT 1 CHECK(must_change_password IN (0,1))
);
`);
  console.log("Schema de autenticação gerado; dados existentes preservados.");
} finally { await pool.end(); }
