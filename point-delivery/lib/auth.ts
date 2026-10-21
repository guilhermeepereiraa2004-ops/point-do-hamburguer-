import "server-only";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { createAuth } from "./auth-config";
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  if (instance) return instance;
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32 || !process.env.DATABASE_URL) throw new Error("Acesso administrativo não configurado.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
  if (process.env.VERCEL) attachDatabasePool(pool);
  const trustedOrigins = [process.env.BETTER_AUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
    ...(process.env.NODE_ENV !== "production" ? ["http://127.0.0.1:4178", "http://localhost:4178", "http://127.0.0.1:5173", "http://localhost:5173"] : []),
  ].filter((value): value is string => Boolean(value));
  instance = createAuth(pool, secret, { baseURL: process.env.BETTER_AUTH_URL, trustedOrigins });
  return instance;
}
