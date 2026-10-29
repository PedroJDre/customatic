import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export * from "./auth-schema";
import { organization, user } from "./auth-schema";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

// "rating" = an answer to the app's survey (NPS, CSAT or CES), with a score.
export const feedbackType = pgEnum("feedback_type", ["problem", "suggestion", "comment", "rating"]);
export const surveyKind = pgEnum("survey_kind", ["nps", "csat", "ces"]);
export const feedbackStatus = pgEnum("feedback_status", ["todo", "in_progress", "done"]);
export const emailStatus = pgEnum("email_status", ["sent", "skipped", "failed"]);

export type WidgetSettings = {
  color: string;
  position: "right" | "left";
  language: "auto" | "en" | "es";
  label: string;
  askEmail: "optional" | "required" | "hidden";
  /** Survey shown when the widget opens. Missing = "nps" (the default); "none" = only problems, ideas and comments. */
  survey?: "nps" | "csat" | "ces" | "none";
  /** Custom copy. Empty = the default text in the visitor's language. */
  title?: string;
  subtitle?: string;
  thanksTitle?: string;
  thanksBody?: string;
  question?: string;
};

export const WIDGET_TEXT_LIMITS = { label: 28, title: 60, subtitle: 140, thanksTitle: 60, thanksBody: 200, question: 120 } as const;

/** Score range per survey. NPS 0–10, CSAT 1–5, CES 1–7. */
export const SURVEY_SCALES = { nps: [0, 10], csat: [1, 5], ces: [1, 7] } as const;
export type SurveyKind = keyof typeof SURVEY_SCALES;

export const defaultWidgetSettings: WidgetSettings = {
  color: "#2433F5",
  position: "right",
  language: "auto",
  label: "",
  askEmail: "optional",
  survey: "nps",
};

/** A website or product that collects feedback. Belongs to a workspace (Better Auth organization). */
export const apps = pgTable(
  "apps",
  {
    id: text("id").primaryKey(), // public id used in the script tag, e.g. app_k3j9x2m1q8
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(), // public roadmap URL
    allowedOrigins: text("allowed_origins")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    widget: jsonb("widget").$type<WidgetSettings>().notNull().default(defaultWidgetSettings),
    roadmapEnabled: boolean("roadmap_enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("apps_org_idx").on(t.organizationId)],
);

export const feedback = pgTable(
  "feedback",
  {
    id: text("id").primaryKey(),
    appId: text("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    number: integer("number").notNull(), // per-app sequence shown to the team: #12
    type: feedbackType("type").notNull(),
    status: feedbackStatus("status").notNull().default("todo"),
    message: text("message").notNull(),
    email: text("email"),
    pageUrl: text("page_url"),
    pagePath: text("page_path"),
    pageTitle: text("page_title"),
    browser: text("browser"),
    os: text("os"),
    device: text("device"), // desktop | mobile | tablet
    viewport: text("viewport"),
    language: text("language"),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean>>(),
    hasScreenshot: boolean("has_screenshot").notNull().default(false),
    survey: surveyKind("survey"),
    score: integer("score"),
    assigneeId: text("assignee_id").references(() => user.id, { onDelete: "set null" }),
    onRoadmap: boolean("on_roadmap").notNull().default(false),
    roadmapTitle: text("roadmap_title"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [
    index("feedback_app_created_idx").on(t.appId, t.createdAt),
    index("feedback_app_status_idx").on(t.appId, t.status),
  ],
);

export const screenshots = pgTable("screenshots", {
  feedbackId: text("feedback_id")
    .primaryKey()
    .references(() => feedback.id, { onDelete: "cascade" }),
  mime: text("mime").notNull(),
  data: bytea("data").notNull(),
});

export const replies = pgTable(
  "replies",
  {
    id: text("id").primaryKey(),
    feedbackId: text("feedback_id")
      .notNull()
      .references(() => feedback.id, { onDelete: "cascade" }),
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    sentTo: text("sent_to"),
    emailStatus: emailStatus("email_status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("replies_feedback_idx").on(t.feedbackId)],
);

export const roadmapVotes = pgTable(
  "roadmap_votes",
  {
    feedbackId: text("feedback_id")
      .notNull()
      .references(() => feedback.id, { onDelete: "cascade" }),
    voter: text("voter").notNull(), // hash of a random id kept in the visitor's cookie
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.feedbackId, t.voter] })],
);

/** Fixed-window counters for the public widget API. Works on serverless, no Redis needed. */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
});

export type App = typeof apps.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type Reply = typeof replies.$inferSelect;
export type FeedbackType = (typeof feedbackType.enumValues)[number];
export type FeedbackStatus = (typeof feedbackStatus.enumValues)[number];
