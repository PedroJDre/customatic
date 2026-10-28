import "server-only";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import postgres from "postgres";
import { PGlite } from "@electric-sql/pglite";
import { mkdirSync } from "node:fs";
import * as schema from "./schema";

export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * DATABASE_URL=postgres://...  → a real Postgres (production, Vercel, Docker).
 * Not set                      → PGlite, Postgres compiled to WebAssembly, stored in ./.data/pglite.
 *                                Zero setup for local development and self-hosting on one machine.
 */
export function createDb(url = process.env.DATABASE_URL): Database {
  if (url && /^postgres(ql)?:\/\//.test(url)) {
    const client = postgres(url, { max: process.env.VERCEL ? 1 : 10, prepare: false });
    return drizzlePostgres(client, { schema }) as unknown as Database;
  }
  const dir = url?.startsWith("pglite://") ? url.slice("pglite://".length) : "./.data/pglite";
  if (dir === "memory") return drizzlePglite(new PGlite(), { schema }) as unknown as Database;
  mkdirSync(dir, { recursive: true });
  return drizzlePglite(new PGlite(dir), { schema }) as unknown as Database;
}

// One connection per server process, also across hot reloads in development.
const globalForDb = globalThis as unknown as { customaticDb?: Database };

function instance(): Database {
  globalForDb.customaticDb ??= createDb();
  return globalForDb.customaticDb;
}

/**
 * Opened on first use, not on import. Next.js loads server modules in helper processes too;
 * opening PGlite there would put two processes on the same data folder, which corrupts it.
 */
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const real = instance();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
