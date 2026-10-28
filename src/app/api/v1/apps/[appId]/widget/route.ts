import { db } from "@/db";
import { corsHeaders } from "@/server/cors";
import { findApp } from "@/server/ingest";

/** Public widget settings (color, position, language...). Cached briefly by browsers and CDNs. */
export async function GET(request: Request, { params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const headers = corsHeaders(request.headers.get("origin"));
  const app = await findApp(db, appId);
  if (!app) return Response.json({ error: "unknown_app" }, { status: 404, headers });
  return Response.json(
    { name: app.name, ...app.widget },
    { headers: { ...headers, "Cache-Control": "public, max-age=60, s-maxage=300" } },
  );
}
