import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { feedback } from "@/db/schema";
import { ingestFeedback, IngestError } from "@/server/ingest";
import { listInbox, parseFilters, surveyStats } from "@/server/queries";
import { seedApp, testDb } from "./helpers";

let ip = 0;
const meta = () => ({ origin: "https://acme.com", userAgent: null, ip: `10.0.0.${ip++}` });
const rate = (db: Database, survey: "nps" | "csat" | "ces", score: number, message = "") =>
  ingestFeedback(db, { appId: "app_test", type: "rating", survey, score, message }, meta());

describe("survey answers", () => {
  let db: Database;
  beforeEach(async () => {
    db = await testDb();
    await seedApp(db);
  });

  it("stores a score without a comment and keeps it out of the open queue", async () => {
    const { id } = await rate(db, "nps", 9);
    const [row] = await db.select().from(feedback).where(eq(feedback.id, id));
    expect(row).toMatchObject({ type: "rating", survey: "nps", score: 9, message: "", status: "done" });

    const withComment = await rate(db, "nps", 3, "Shipping took two weeks");
    const [row2] = await db.select().from(feedback).where(eq(feedback.id, withComment.id));
    expect(row2.status).toBe("todo"); // a comment is worth reading
  });

  it("rejects scores outside each survey's scale", async () => {
    for (const [survey, score] of [["nps", 11], ["nps", -1], ["csat", 0], ["csat", 6], ["ces", 8]] as const) {
      await expect(rate(db, survey, score)).rejects.toMatchObject({ code: "invalid_input" });
    }
    await expect(ingestFeedback(db, { appId: "app_test", type: "rating", score: 5 }, meta())).rejects.toBeInstanceOf(IngestError);
    // Reports still need words.
    await expect(ingestFeedback(db, { appId: "app_test", type: "problem" }, meta())).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("computes NPS, CSAT and CES", async () => {
    // NPS: 3 promoters (9, 10, 10), 1 passive (8), 2 detractors (2, 6) → (3 − 2) / 6 = 17
    for (const s of [9, 10, 10, 8, 2, 6]) await rate(db, "nps", s);
    // CSAT: 4 and 5 are satisfied → 3 of 4 = 75%
    for (const s of [5, 4, 4, 1]) await rate(db, "csat", s);
    // CES: average of 7, 5, 3 = 5; 2 of 3 answered 5 or more
    for (const s of [7, 5, 3]) await rate(db, "ces", s);

    const stats = Object.fromEntries((await surveyStats(db, "app_test")).map((x) => [x.survey, x]));
    expect(stats.nps).toMatchObject({ responses: 6, headline: 17, groups: { promoters: 3, passives: 1, detractors: 2 } });
    expect(stats.nps.distribution).toHaveLength(11);
    expect(stats.nps.distribution[10]).toEqual({ score: 10, n: 2 });
    expect(stats.csat).toMatchObject({ responses: 4, headline: 75, average: 3.5 });
    expect(stats.ces).toMatchObject({ responses: 3, headline: 5, goodShare: 67 });
  });

  it("has its own inbox tab", async () => {
    await rate(db, "nps", 10, "Love it");
    await ingestFeedback(db, { appId: "app_test", type: "problem", message: "Broken button" }, meta());
    const { items, counts } = await listInbox(db, "app_test", parseFilters({ type: "rating" }));
    expect(items.map((i) => [i.type, i.score])).toEqual([["rating", 10]]);
    expect(counts).toMatchObject({ rating: 1, problem: 1 });
  });
});
