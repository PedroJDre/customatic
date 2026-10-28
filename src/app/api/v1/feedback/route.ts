import { db } from "@/db";
import { corsHeaders } from "@/server/cors";
import { ingestFeedback, IngestError } from "@/server/ingest";

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json", message: "Send a JSON body." }, { status: 400, headers });
  }
  try {
    const result = await ingestFeedback(db, body, {
      origin: origin ?? request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"),
    });
    return Response.json(result, { status: 201, headers });
  } catch (error) {
    if (error instanceof IngestError) {
      return Response.json({ error: error.code, message: error.message }, { status: error.status, headers });
    }
    console.error("[feedback] unexpected error", error);
    return Response.json({ error: "server_error", message: "Something failed on our side." }, { status: 500, headers });
  }
}
