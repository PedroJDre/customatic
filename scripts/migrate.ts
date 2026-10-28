/**
 * Apply database migrations. Runs before `next dev` and `next build`.
 * Uses DATABASE_URL when it is a postgres:// URL, otherwise the local PGlite database.
 */
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import { mkdirSync } from "node:fs";

const url = process.env.DATABASE_URL;
const migrationsFolder = "./drizzle";

async function main() {
  if (url && /^postgres(ql)?:\/\//.test(url)) {
    const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
    await migratePostgres(drizzlePostgres(client), { migrationsFolder });
    await client.end();
    console.log("Migrations applied to Postgres.");
  } else {
    const dir = url?.startsWith("pglite://") ? url.slice(9) : "./.data/pglite";
    mkdirSync(dir, { recursive: true });
    const client = new PGlite(dir);
    await migratePglite(drizzlePglite(client), { migrationsFolder });
    await client.close();
    console.log(`Migrations applied to PGlite (${dir}).`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
