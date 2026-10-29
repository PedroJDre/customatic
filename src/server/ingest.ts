import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { UAParser } from "ua-parser-js";
import { z } from "zod";
import type { Database } from "@/db";
import { apps, feedback, screenshots, SURVEY_SCALES, type App } from "@/db/schema";
import { newId } from "./ids";
import { originAllowed } from "./origins";
import { hit } from "./rate-limit";

export const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;

const metadataValue = z.union([z.string().max(500), z.number(), z.boolean()]);

export const feedbackInput = z.object({
  appId: z.string().min(3).max(64),
  type: z.enum(["problem", "suggestion", "comment", "rating"]),
  // Survey answers can come without a comment; reports need words.
  message: z.string().trim().max(5000).default(""),
  survey: z.enum(["nps", "csat", "ces"]).optional(),
  score: z.number().int().optional(),
  email: z
    .string()
    .trim()
    .max(254)
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.email().optional()),
  page: z
    .object({ url: z.string().max(2000).optional(), title: z.string().max(300).optional() })
    .optional(),
  viewport: z.string().max(20).optional(),
  language: z.string().max(20).optional(),
  metadata: z
    .record(z.string().max(60), metadataValue)
    .refine((m) => Object.keys(m).length <= 30, "At most 30 metadata fields")
    .optional(),
  screenshot: z.string().max(Math.ceil(MAX_SCREENSHOT_BYTES * 1.4)).optional(), // data URL
  website: z.string().optional(), // honeypot: real users never fill it
});

export type FeedbackInput = z.input<typeof feedbackInput>;

export class IngestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type RequestMeta = { origin: string | null; userAgent: string | null; ip: string | null };

const IMAGE_SIGNATURES: [string, number[]][] = [
  ["image/png", [0x89, 0x50, 0x4e, 0x47]],
  ["image/jpeg", [0xff, 0xd8, 0xff]],
  ["image/webp", [0x52, 0x49, 0x46, 0x46]],
];

/** Decode a data URL and check the bytes really are an image, whatever the declared type says. */
export function decodeScreenshot(dataUrl: string): { mime: string; data: Buffer } {
  const match = /^data:image\/[a-z+]+;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new IngestError(400, "invalid_screenshot", "The screenshot must be a base64 image.");
  const data = Buffer.from(match[1], "base64");
  if (data.length > MAX_SCREENSHOT_BYTES) {
    throw new IngestError(413, "screenshot_too_large", "The screenshot is larger than 2 MB.");
  }
  const kind = IMAGE_SIGNATURES.find(([, sig]) => sig.every((byte, i) => data[i] === byte));
  if (!kind) throw new IngestError(400, "invalid_screenshot", "Only PNG, JPEG and WebP screenshots are accepted.");
  return { mime: kind[0], data };
}

export function describeDevice(userAgent: string | null) {
  if (!userAgent) return { browser: null, os: null, device: null };
  const ua = new UAParser(userAgent).getResult();
  const type = ua.device.type;
  return {
    browser: [ua.browser.name, ua.browser.major].filter(Boolean).join(" ") || null,
    os: [ua.os.name, ua.os.version].filter(Boolean).join(" ") || null,
    device: type === "mobile" || type === "tablet" ? type : "desktop",
  };
}

function pathOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}

export async function findApp(db: Database, appId: string): Promise<App | undefined> {
  const [app] = await db.select().from(apps).where(eq(apps.id, appId)).limit(1);
  return app;
}

/** Validate and store one piece of feedback sent by the widget. */
export async function ingestFeedback(db: Database, raw: unknown, meta: RequestMeta): Promise<{ id: string; number: number }> {
  const parsed = feedbackInput.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new IngestError(400, "invalid_input", `${issue.path.join(".") || "body"}: ${issue.message}`);
  }
  const input = parsed.data;
  if (input.website) throw new IngestError(400, "rejected", "Rejected.");
  if (input.type === "rating") {
    if (!input.survey || input.score === undefined) {
      throw new IngestError(400, "invalid_input", "A survey answer needs `survey` and `score`.");
    }
    const [min, max] = SURVEY_SCALES[input.survey];
    if (input.score < min || input.score > max) {
      throw new IngestError(400, "invalid_input", `score: ${input.survey.toUpperCase()} scores go from ${min} to ${max}.`);
    }
  } else if (input.message.length < 2) {
    throw new IngestError(400, "invalid_input", "message: Write a few words");
  }

  const app = await findApp(db, input.appId);
  if (!app) throw new IngestError(404, "unknown_app", "No app with this id. Check data-app-id in your script tag.");
  if (!originAllowed(meta.origin, app.allowedOrigins)) {
    throw new IngestError(403, "origin_not_allowed", "This domain is not in the app's allowed domains.");
  }
  if (app.widget.askEmail === "required" && !input.email) {
    throw new IngestError(400, "email_required", "An email is required.");
  }

  const visitor = createHash("sha256").update(`${meta.ip ?? "unknown"}|${app.id}`).digest("hex").slice(0, 24);
  if (!(await hit(db, `fb:min:${visitor}`, 8, 60))) {
    throw new IngestError(429, "rate_limited", "Too many messages in a minute. Try again shortly.");
  }
  if (!(await hit(db, `fb:day:${app.id}`, 2000, 86_400))) {
    throw new IngestError(429, "rate_limited", "This app reached its daily limit.");
  }

  const shot = input.screenshot ? decodeScreenshot(input.screenshot) : null;
  const id = newId("fb");
  const number = await db.transaction(async (tx) => {
    // Per-app number (#1, #2...). The advisory lock keeps it unique when two reports arrive together.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${app.id}))`);
    const [{ next }] = await tx
      .select({ next: sql<number>`coalesce(max(${feedback.number}), 0) + 1` })
      .from(feedback)
      .where(eq(feedback.appId, app.id));
    await tx.insert(feedback).values({
      id,
      appId: app.id,
      number: Number(next),
      type: input.type,
      message: input.message,
      email: input.email ?? null,
      pageUrl: input.page?.url ?? null,
      pagePath: pathOf(input.page?.url),
      pageTitle: input.page?.title ?? null,
      viewport: input.viewport ?? null,
      language: input.language ?? null,
      metadata: input.metadata ?? null,
      hasScreenshot: Boolean(shot),
      // A score with no comment has nothing to act on, so it doesn't sit in the open queue.
      status: input.type === "rating" && !input.message ? "done" : "todo",
      survey: input.type === "rating" ? input.survey : null,
      score: input.type === "rating" ? input.score : null,
      ...describeDevice(meta.userAgent),
    });
    if (shot) await tx.insert(screenshots).values({ feedbackId: id, ...shot });
    return Number(next);
  });
  return { id, number };
}
