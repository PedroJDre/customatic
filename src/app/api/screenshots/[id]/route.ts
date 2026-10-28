import { eq } from "drizzle-orm";
import { db } from "@/db";
import { feedback, screenshots } from "@/db/schema";
import { requireApp } from "@/server/access";

/** Screenshots are private: only members of the app's workspace can see them. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db
    .select({ appId: feedback.appId, mime: screenshots.mime, data: screenshots.data })
    .from(screenshots)
    .innerJoin(feedback, eq(feedback.id, screenshots.feedbackId))
    .where(eq(screenshots.feedbackId, id))
    .limit(1);
  if (!row) return new Response("Not found", { status: 404 });
  await requireApp(row.appId); // 404s or redirects if the viewer has no access
  return new Response(new Uint8Array(row.data), {
    headers: { "Content-Type": row.mime, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
