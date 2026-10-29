import { and, asc, count, desc, eq, gte, ilike, isNotNull, ne, or, sql, type SQL } from "drizzle-orm";
import type { Database } from "@/db";
import { feedback, member, replies, roadmapVotes, user, type FeedbackStatus, type FeedbackType } from "@/db/schema";

export type InboxFilters = {
  type?: FeedbackType;
  status?: FeedbackStatus | "open" | "all";
  q?: string;
};

export function parseFilters(params: Record<string, string | string[] | undefined>): InboxFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const type = one(params.type);
  const isType = (v: string | undefined): v is FeedbackType => v === "problem" || v === "suggestion" || v === "comment" || v === "rating";
  const status = one(params.status);
  return {
    type: isType(type) ? type : undefined,
    status:
      status === "todo" || status === "in_progress" || status === "done" || status === "all" ? status : "open",
    q: one(params.q)?.trim().slice(0, 100) || undefined,
  };
}

function where(appId: string, f: InboxFilters, skip: "type" | "none" = "none"): SQL {
  const parts: SQL[] = [eq(feedback.appId, appId)];
  if (f.type && skip !== "type") parts.push(eq(feedback.type, f.type));
  if (f.status === "open") parts.push(ne(feedback.status, "done"));
  else if (f.status && f.status !== "all") parts.push(eq(feedback.status, f.status));
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, "\\$&")}%`;
    const asNumber = Number(f.q.replace(/^#/, ""));
    parts.push(
      or(
        ilike(feedback.message, like),
        ilike(feedback.email, like),
        ilike(feedback.pageUrl, like),
        Number.isInteger(asNumber) && asNumber > 0 ? eq(feedback.number, asNumber) : undefined,
      )!,
    );
  }
  return and(...parts)!;
}

export async function listInbox(db: Database, appId: string, f: InboxFilters, limit = 200) {
  const [items, typeCounts] = await Promise.all([
    db
      .select({
        id: feedback.id,
        number: feedback.number,
        type: feedback.type,
        status: feedback.status,
        message: feedback.message,
        email: feedback.email,
        pagePath: feedback.pagePath,
        device: feedback.device,
        hasScreenshot: feedback.hasScreenshot,
        survey: feedback.survey,
        score: feedback.score,
        createdAt: feedback.createdAt,
        assigneeName: user.name,
      })
      .from(feedback)
      .leftJoin(user, eq(user.id, feedback.assigneeId))
      .where(where(appId, f))
      .orderBy(desc(feedback.createdAt))
      .limit(limit),
    db
      .select({ type: feedback.type, n: count() })
      .from(feedback)
      .where(where(appId, f, "type"))
      .groupBy(feedback.type),
  ]);
  const counts = { all: 0, problem: 0, suggestion: 0, comment: 0, rating: 0 };
  for (const row of typeCounts) {
    counts[row.type] = Number(row.n);
    counts.all += Number(row.n);
  }
  return { items, counts };
}

export type InboxItem = Awaited<ReturnType<typeof listInbox>>["items"][number];

export async function getFeedback(db: Database, appId: string, id: string) {
  const [item] = await db
    .select()
    .from(feedback)
    .where(and(eq(feedback.appId, appId), eq(feedback.id, id)))
    .limit(1);
  if (!item) return null;
  const thread = await db
    .select({ id: replies.id, body: replies.body, emailStatus: replies.emailStatus, createdAt: replies.createdAt, author: user.name })
    .from(replies)
    .leftJoin(user, eq(user.id, replies.authorId))
    .where(eq(replies.feedbackId, id))
    .orderBy(asc(replies.createdAt));
  return { ...item, replies: thread };
}

export type FeedbackDetail = NonNullable<Awaited<ReturnType<typeof getFeedback>>>;

export async function listMembers(db: Database, organizationId: string) {
  return db
    .select({ id: user.id, name: user.name, email: user.email, role: member.role, memberId: member.id })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(eq(member.organizationId, organizationId))
    .orderBy(asc(member.createdAt));
}

export async function analytics(db: Database, appId: string, days = 30) {
  const since = new Date(Date.now() - days * 86_400_000);
  const recent = and(eq(feedback.appId, appId), gte(feedback.createdAt, since));
  const [perDay, byPage, byDevice, byStatus, resolved, openNow] = await Promise.all([
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${feedback.createdAt}), 'YYYY-MM-DD')`,
        type: feedback.type,
        n: count(),
      })
      .from(feedback)
      .where(and(recent, ne(feedback.type, "rating")))
      .groupBy(sql`1`, feedback.type),
    db
      .select({ page: feedback.pagePath, n: count() })
      .from(feedback)
      .where(and(recent, eq(feedback.type, "problem"), isNotNull(feedback.pagePath)))
      .groupBy(feedback.pagePath)
      .orderBy(desc(count()))
      .limit(8),
    db.select({ device: feedback.device, n: count() }).from(feedback).where(recent).groupBy(feedback.device),
    db.select({ status: feedback.status, n: count() }).from(feedback).where(recent).groupBy(feedback.status),
    db
      .select({
        n: count(),
        medianHours: sql<number | null>`percentile_cont(0.5) within group (order by extract(epoch from ${feedback.resolvedAt} - ${feedback.createdAt}) / 3600)`,
      })
      .from(feedback)
      .where(and(eq(feedback.appId, appId), gte(feedback.resolvedAt, since))),
    db.select({ n: count() }).from(feedback).where(and(eq(feedback.appId, appId), ne(feedback.status, "done"))),
  ]);

  const series: { day: string; problem: number; suggestion: number; comment: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    series.push({ day, problem: 0, suggestion: 0, comment: 0 });
  }
  const index = new Map(series.map((s) => [s.day, s]));
  for (const row of perDay) {
    const slot = index.get(row.day);
    if (slot && row.type !== "rating") slot[row.type] = Number(row.n);
  }
  // Everything received in the period, survey answers included (the daily chart shows reports only).
  const total = byStatus.reduce((sum, r) => sum + Number(r.n), 0);
  return {
    total,
    series,
    byPage: byPage.map((r) => ({ page: r.page ?? "", n: Number(r.n) })),
    byDevice: byDevice.map((r) => ({ device: r.device ?? "unknown", n: Number(r.n) })),
    byStatus: byStatus.map((r) => ({ status: r.status, n: Number(r.n) })),
    resolved: Number(resolved[0]?.n ?? 0),
    medianHours: resolved[0]?.medianHours == null ? null : Number(resolved[0].medianHours),
    openNow: Number(openNow[0]?.n ?? 0),
  };
}

export async function roadmapItems(db: Database, appId: string) {
  return db
    .select({
      id: feedback.id,
      title: sql<string>`coalesce(${feedback.roadmapTitle}, left(${feedback.message}, 120))`,
      status: feedback.status,
      votes: sql<number>`(select count(*) from ${roadmapVotes} where ${roadmapVotes.feedbackId} = ${feedback.id})`.mapWith(Number),
    })
    .from(feedback)
    .where(and(eq(feedback.appId, appId), eq(feedback.onRoadmap, true)))
    .orderBy(desc(sql`4`), desc(feedback.createdAt));
}

export type SurveyStats = {
  survey: "nps" | "csat" | "ces";
  responses: number;
  /** count per score, index = score */
  distribution: { score: number; n: number }[];
  /** NPS: −100..100. CSAT: % of 4–5. CES: average. */
  headline: number;
  average: number;
  /** NPS: promoters/passives/detractors. CSAT and CES: share of good answers (%). */
  groups?: { promoters: number; passives: number; detractors: number };
  goodShare: number;
};

/** Survey results of the last `days` days, one entry per survey kind that has answers. */
export async function surveyStats(db: Database, appId: string, days = 30): Promise<SurveyStats[]> {
  const since = new Date(Date.now() - days * 86_400_000);
  const rows = await db
    .select({ survey: feedback.survey, score: feedback.score, n: count() })
    .from(feedback)
    .where(and(eq(feedback.appId, appId), eq(feedback.type, "rating"), gte(feedback.createdAt, since), isNotNull(feedback.score)))
    .groupBy(feedback.survey, feedback.score);
  const scales = { nps: [0, 10], csat: [1, 5], ces: [1, 7] } as const;
  const result: SurveyStats[] = [];
  for (const survey of ["nps", "csat", "ces"] as const) {
    const mine = rows.filter((r) => r.survey === survey && r.score !== null);
    const responses = mine.reduce((sum, r) => sum + Number(r.n), 0);
    if (!responses) continue;
    const [min, max] = scales[survey];
    const distribution = Array.from({ length: max - min + 1 }, (_, i) => ({
      score: min + i,
      n: Number(mine.find((r) => r.score === min + i)?.n ?? 0),
    }));
    const total = distribution.reduce((sum, d) => sum + d.score * d.n, 0);
    const average = Math.round((total / responses) * 10) / 10;
    const share = (pred: (s: number) => boolean) =>
      distribution.filter((d) => pred(d.score)).reduce((sum, d) => sum + d.n, 0);
    if (survey === "nps") {
      const promoters = share((s) => s >= 9);
      const detractors = share((s) => s <= 6);
      const passives = responses - promoters - detractors;
      const headline = Math.round(((promoters - detractors) / responses) * 100);
      result.push({ survey, responses, distribution, headline, average, groups: { promoters, passives, detractors }, goodShare: Math.round((promoters / responses) * 100) });
    } else {
      const good = share((s) => (survey === "csat" ? s >= 4 : s >= 5));
      const goodShare = Math.round((good / responses) * 100);
      result.push({ survey, responses, distribution, headline: survey === "csat" ? goodShare : average, average, goodShare });
    }
  }
  return result;
}
