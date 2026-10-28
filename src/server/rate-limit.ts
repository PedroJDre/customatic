import { sql } from "drizzle-orm";
import type { Database } from "@/db";
import { rateLimits } from "@/db/schema";

/**
 * Fixed-window limit stored in Postgres: returns true when the request may go through.
 * One atomic upsert per call, so it is safe across serverless instances.
 */
export async function hit(db: Database, key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.windowStart} = ${windowStart.toISOString()}::timestamptz THEN ${rateLimits.count} + 1 ELSE 1 END`,
        windowStart: sql`${windowStart.toISOString()}::timestamptz`,
      },
    })
    .returning({ count: rateLimits.count });
  return row.count <= limit;
}
