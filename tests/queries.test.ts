import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { feedback, roadmapVotes } from "@/db/schema";
import { ingestFeedback } from "@/server/ingest";
import { analytics, getFeedback, listInbox, parseFilters, roadmapItems } from "@/server/queries";
import { seedApp, testDb } from "./helpers";

const meta = (ip: string) => ({ origin: "https://acme.com", userAgent: null, ip });

describe("inbox and analytics", () => {
  let db: Database;
  let ids: Record<string, string>;

  beforeEach(async () => {
    db = await testDb();
    await seedApp(db);
    const send = async (key: string, type: "problem" | "suggestion" | "comment", message: string, url: string, email?: string) => {
      const { id } = await ingestFeedback(db, { appId: "app_test", type, message, email, page: { url } }, meta(key));
      return id;
    };
    ids = {
      crash: await send("a", "problem", "App crashes on checkout", "https://acme.com/checkout", "joe@x.com"),
      slow: await send("b", "problem", "Search is slow", "https://acme.com/search"),
      csv: await send("c", "suggestion", "Export to CSV please", "https://acme.com/reports"),
      love: await send("d", "comment", "Love the new design", "https://acme.com/"),
      crash2: await send("e", "problem", "Checkout button frozen", "https://acme.com/checkout"),
    };
    await db.update(feedback).set({ status: "done", resolvedAt: new Date() }).where(eq(feedback.id, ids.slow));
  });

  it("filters by type, status and search, and counts per type", async () => {
    const open = await listInbox(db, "app_test", parseFilters({}));
    expect(open.items).toHaveLength(4); // "done" is hidden by default
    expect(open.counts).toEqual({ all: 4, problem: 2, suggestion: 1, comment: 1 });

    const problems = await listInbox(db, "app_test", parseFilters({ type: "problem", status: "all" }));
    expect(problems.items.map((i) => i.message).sort()).toEqual(["App crashes on checkout", "Checkout button frozen", "Search is slow"]);
    expect(problems.counts.all).toBe(5); // type tabs keep counting every type

    const search = await listInbox(db, "app_test", parseFilters({ q: "checkout", status: "all" }));
    expect(search.items).toHaveLength(2); // message or page URL
    const byEmail = await listInbox(db, "app_test", parseFilters({ q: "joe@", status: "all" }));
    expect(byEmail.items.map((i) => i.id)).toEqual([ids.crash]);
    const byNumber = await listInbox(db, "app_test", parseFilters({ q: "#3", status: "all" }));
    expect(byNumber.items.map((i) => i.id)).toEqual([ids.csv]);
    const weird = await listInbox(db, "app_test", parseFilters({ q: "100%_\\", status: "all" }));
    expect(weird.items).toHaveLength(0);
  });

  it("ignores unknown filter values", () => {
    expect(parseFilters({ type: "rant", status: "whatever" })).toEqual({ type: undefined, status: "open", q: undefined });
  });

  it("only returns feedback of the requested app", async () => {
    expect(await getFeedback(db, "app_other", ids.crash)).toBeNull();
    expect((await getFeedback(db, "app_test", ids.crash))?.replies).toEqual([]);
  });

  it("summarizes the last 30 days", async () => {
    const a = await analytics(db, "app_test");
    expect(a.total).toBe(5);
    expect(a.series).toHaveLength(30);
    expect(a.series.at(-1)).toMatchObject({ problem: 3, suggestion: 1, comment: 1 });
    expect(a.byPage[0]).toEqual({ page: "/checkout", n: 2 });
    expect(a.openNow).toBe(4);
    expect(a.resolved).toBe(1);
    expect(a.medianHours).not.toBeNull();
  });

  it("lists roadmap items with votes, most voted first", async () => {
    await db.update(feedback).set({ onRoadmap: true, roadmapTitle: "CSV export" }).where(eq(feedback.id, ids.csv));
    await db.update(feedback).set({ onRoadmap: true }).where(eq(feedback.id, ids.love));
    await db.insert(roadmapVotes).values([{ feedbackId: ids.love, voter: "v1" }, { feedbackId: ids.love, voter: "v2" }, { feedbackId: ids.csv, voter: "v1" }]);
    const items = await roadmapItems(db, "app_test");
    expect(items.map((i) => [i.title, i.votes])).toEqual([["Love the new design", 2], ["CSV export", 1]]);
  });
});
