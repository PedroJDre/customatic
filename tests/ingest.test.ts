import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/db";
import { feedback, screenshots } from "@/db/schema";
import { describeDevice, ingestFeedback, IngestError } from "@/server/ingest";
import { originAllowed } from "@/server/origins";
import { PNG_1PX, seedApp, testDb } from "./helpers";

const CHROME_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";

const meta = (overrides = {}) => ({ origin: "https://acme.com", userAgent: CHROME_MAC, ip: "1.2.3.4", ...overrides });

async function expectError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(IngestError);
  await expect(promise).rejects.toMatchObject({ code });
}

describe("ingestFeedback", () => {
  let db: Database;
  beforeEach(async () => {
    db = await testDb();
    await seedApp(db, { allowedOrigins: ["acme.com"] });
  });

  it("stores feedback with page, device and a per-app number", async () => {
    const first = await ingestFeedback(
      db,
      { appId: "app_test", type: "problem", message: "Checkout button does nothing", email: "joe@x.com",
        page: { url: "https://acme.com/checkout?step=2", title: "Checkout" }, viewport: "390x844",
        metadata: { plan: "pro", userId: 42 } },
      meta({ userAgent: IPHONE, origin: "https://www.acme.com" }),
    );
    const second = await ingestFeedback(db, { appId: "app_test", type: "comment", message: "Love it" }, meta({ ip: "5.6.7.8" }));
    expect([first.number, second.number]).toEqual([1, 2]);

    const [row] = await db.select().from(feedback).where(eq(feedback.id, first.id));
    expect(row).toMatchObject({
      type: "problem", status: "todo", email: "joe@x.com", pagePath: "/checkout", device: "mobile",
      viewport: "390x844", metadata: { plan: "pro", userId: 42 }, hasScreenshot: false,
    });
    expect(row.browser).toMatch(/Safari/);
    expect(row.os).toMatch(/iOS/);
  });

  it("saves a screenshot after checking it is a real image", async () => {
    const { id } = await ingestFeedback(db, { appId: "app_test", type: "problem", message: "Broken layout", screenshot: PNG_1PX }, meta());
    const [shot] = await db.select().from(screenshots).where(eq(screenshots.feedbackId, id));
    expect(shot.mime).toBe("image/png");
    expect(shot.data.length).toBeGreaterThan(50);

    const fake = "data:image/png;base64," + Buffer.from("<script>alert(1)</script>").toString("base64");
    await expectError(ingestFeedback(db, { appId: "app_test", type: "problem", message: "x x", screenshot: fake }, meta()), "invalid_screenshot");
  });

  it("rejects bad input, unknown apps, other domains and bots", async () => {
    await expectError(ingestFeedback(db, { appId: "app_test", type: "problem", message: "" }, meta()), "invalid_input");
    await expectError(ingestFeedback(db, { appId: "app_test", type: "rant", message: "hello" }, meta()), "invalid_input");
    await expectError(ingestFeedback(db, { appId: "app_test", type: "comment", message: "hello", email: "nope" }, meta()), "invalid_input");
    await expectError(ingestFeedback(db, { appId: "app_nope", type: "comment", message: "hello" }, meta()), "unknown_app");
    await expectError(ingestFeedback(db, { appId: "app_test", type: "comment", message: "hello" }, meta({ origin: "https://evil.com" })), "origin_not_allowed");
    await expectError(ingestFeedback(db, { appId: "app_test", type: "comment", message: "hello", website: "spam.com" }, meta()), "rejected");
    expect(await db.select().from(feedback)).toHaveLength(0);
  });

  it("limits how fast one visitor can send", async () => {
    for (let i = 0; i < 8; i++) {
      await ingestFeedback(db, { appId: "app_test", type: "comment", message: `msg ${i}` }, meta());
    }
    await expectError(ingestFeedback(db, { appId: "app_test", type: "comment", message: "one more" }, meta()), "rate_limited");
    // A different visitor is not affected.
    await ingestFeedback(db, { appId: "app_test", type: "comment", message: "hi" }, meta({ ip: "9.9.9.9" }));
  });
});

describe("originAllowed", () => {
  it("matches domains, www, wildcards and localhost", () => {
    expect(originAllowed("https://anything.com", [])).toBe(true);
    expect(originAllowed("https://acme.com", ["acme.com"])).toBe(true);
    expect(originAllowed("https://www.acme.com", ["https://acme.com/"])).toBe(true);
    expect(originAllowed("https://app.acme.com", ["acme.com"])).toBe(false);
    expect(originAllowed("https://app.acme.com", ["*.acme.com"])).toBe(true);
    expect(originAllowed("https://acme.com.evil.io", ["acme.com"])).toBe(false);
    expect(originAllowed("http://localhost:5173", ["acme.com"])).toBe(true);
    expect(originAllowed(null, ["acme.com"])).toBe(false);
  });
});

describe("describeDevice", () => {
  it("reads browser, OS and device type", () => {
    expect(describeDevice(CHROME_MAC)).toMatchObject({ device: "desktop", browser: "Chrome 131" });
    expect(describeDevice(null)).toEqual({ browser: null, os: null, device: null });
  });
});
