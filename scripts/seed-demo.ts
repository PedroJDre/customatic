/**
 * Fill an app with 30 days of realistic sample feedback, to see the inbox and analytics in action.
 *
 *   npm run seed:demo              (uses the first app in the database)
 *   npm run seed:demo -- app_xxx   (a specific app)
 *
 * Stop `npm run dev` first when using the local PGlite database: only one process can open it.
 */
import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "../src/db/schema";

const url = process.env.DATABASE_URL;
const pg = url && /^postgres/.test(url) ? postgres(url, { max: 1, prepare: false }) : null;
const lite = pg ? null : new PGlite(url?.startsWith("pglite://") ? url.slice(9) : "./.data/pglite");
const db = pg ? drizzlePostgres(pg, { schema }) : drizzlePglite(lite!, { schema });

type T = "problem" | "suggestion" | "comment";
const SAMPLES: { type: T; message: string; page: string }[] = [
  { type: "problem", message: "The pay button does nothing on step 2 of checkout. I clicked it three times.", page: "/checkout" },
  { type: "problem", message: "Search bar disappears on Safari when I rotate the phone.", page: "/search" },
  { type: "problem", message: "Invoice PDF downloads empty since this morning.", page: "/billing" },
  { type: "problem", message: "I can't change my password, the form keeps saying 'invalid token'.", page: "/settings/security" },
  { type: "problem", message: "Dates show in US format even though my language is Spanish.", page: "/reports" },
  { type: "problem", message: "Checkout total doesn't update when I remove a coupon.", page: "/checkout" },
  { type: "problem", message: "The dashboard takes almost 10 seconds to load on my phone.", page: "/dashboard" },
  { type: "problem", message: "Uploading a CSV with accents breaks the import.", page: "/import" },
  { type: "suggestion", message: "Let me export the report as CSV so I can open it in Excel.", page: "/reports" },
  { type: "suggestion", message: "Dark mode please, I use this at night a lot.", page: "/settings" },
  { type: "suggestion", message: "It would be great to pay with Mercado Pago.", page: "/checkout" },
  { type: "suggestion", message: "Keyboard shortcuts to move between orders.", page: "/orders" },
  { type: "suggestion", message: "Send me a weekly summary by email.", page: "/dashboard" },
  { type: "suggestion", message: "Allow more than one user per account.", page: "/settings/team" },
  { type: "comment", message: "The new onboarding is so much clearer, thanks!", page: "/welcome" },
  { type: "comment", message: "Super fast checkout, nice work.", page: "/checkout" },
  { type: "comment", message: "Support answered in 5 minutes. Impressive.", page: "/help" },
  { type: "comment", message: "I like the new reports, the charts are easy to read.", page: "/reports" },
];
const PEOPLE = ["lucia@northwind.io", "mark@globex.com", "sofia@initech.ar", null, "joe@hooli.dev", null, "ana@umbrella.co", "tom@acme.app"];
const DEVICES = [
  { device: "desktop", browser: "Chrome 131", os: "Windows 11", viewport: "1536x864" },
  { device: "desktop", browser: "Safari 18", os: "macOS 15.1", viewport: "1440x900" },
  { device: "mobile", browser: "Mobile Safari 18", os: "iOS 18.1", viewport: "390x844" },
  { device: "mobile", browser: "Chrome 131", os: "Android 15", viewport: "412x915" },
  { device: "tablet", browser: "Safari 18", os: "iPadOS 18", viewport: "820x1180" },
];
const pick = <X>(list: X[], i: number) => list[i % list.length];

async function main() {
  const appArg = process.argv[2];
  const [app] = appArg
    ? await db.select().from(schema.apps).where(eq(schema.apps.id, appArg))
    : await db.select().from(schema.apps).orderBy(schema.apps.createdAt).limit(1);
  if (!app) throw new Error("No app found. Sign up and create an app first.");
  const [owner] = await db.select().from(schema.member).where(eq(schema.member.organizationId, app.organizationId)).limit(1);
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${schema.feedback.number}), 0)` })
    .from(schema.feedback)
    .where(eq(schema.feedback.appId, app.id));

  let number = Number(max);
  const onRoadmap = new Set<string>(); // publish each idea once
  const rows: (typeof schema.feedback.$inferInsert)[] = [];
  for (let i = 0; i < 64; i++) {
    const s = pick(SAMPLES, i * 7);
    const daysAgo = Math.floor((i / 64) ** 1.4 * 29); // more recent days get more feedback
    const createdAt = new Date(Date.now() - daysAgo * 86_400_000 - ((i * 37) % 600) * 60_000);
    const status = daysAgo > 12 ? (i % 4 === 0 ? "in_progress" : "done") : i % 3 === 0 ? "in_progress" : "todo";
    const resolvedAt = status === "done" ? new Date(createdAt.getTime() + ((i % 9) + 2) * 3_600_000) : null;
    const email = pick(PEOPLE, i);
    rows.push({
      id: `fb_${randomBytes(8).toString("hex")}`,
      appId: app.id,
      number: ++number,
      type: s.type,
      status,
      message: s.message,
      email,
      pageUrl: `https://acme.app${s.page}`,
      pagePath: s.page,
      pageTitle: "Acme",
      language: i % 3 === 0 ? "es-AR" : "en-US",
      metadata: email ? { plan: pick(["free", "pro", "team"], i), userId: 1000 + i } : null,
      assigneeId: i % 2 === 0 ? owner?.userId : null,
      onRoadmap: s.type === "suggestion" && !onRoadmap.has(s.message) && Boolean(onRoadmap.add(s.message)),
      createdAt,
      updatedAt: resolvedAt ?? createdAt,
      resolvedAt,
      ...pick(DEVICES, i * 3),
    });
  }
  // Oldest first, so numbers grow with time.
  rows.sort((a, b) => +a.createdAt! - +b.createdAt!).forEach((row, i) => (row.number = Number(max) + i + 1));
  await db.insert(schema.feedback).values(rows);
  const votes = rows.filter((r) => r.onRoadmap).flatMap((r, i) => Array.from({ length: (i * 5) % 11 + 1 }, (_, v) => ({ feedbackId: r.id!, voter: `seed-${v}` })));
  if (votes.length) await db.insert(schema.roadmapVotes).values(votes).onConflictDoNothing();
  await db.update(schema.apps).set({ roadmapEnabled: true }).where(eq(schema.apps.id, app.id));
  console.log(`Added ${rows.length} sample reports to "${app.name}" (${app.id}) and published its roadmap.`);
}

main()
  .then(async () => {
    await pg?.end();
    await lite?.close();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
