import { migrate } from "drizzle-orm/pglite/migrator";
import { createDb, type Database } from "@/db";
import { apps, defaultWidgetSettings, member, organization, user } from "@/db/schema";

/** A fresh in-memory Postgres with all migrations applied. */
export async function testDb(): Promise<Database> {
  const db = createDb("pglite://memory");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await migrate(db as any, { migrationsFolder: "./drizzle" });
  return db;
}

export async function seedApp(db: Database, overrides: Partial<typeof apps.$inferInsert> = {}) {
  const now = new Date();
  await db.insert(user).values({ id: "u1", name: "Ana", email: "ana@acme.test", createdAt: now, updatedAt: now });
  await db.insert(organization).values({ id: "org1", name: "Acme", slug: "acme", createdAt: now });
  await db.insert(member).values({ id: "m1", organizationId: "org1", userId: "u1", role: "owner", createdAt: now });
  const [app] = await db
    .insert(apps)
    .values({ id: "app_test", organizationId: "org1", name: "Acme web", slug: "acme-web", widget: defaultWidgetSettings, ...overrides })
    .returning();
  return app;
}

export const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
