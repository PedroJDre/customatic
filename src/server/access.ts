import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { apps, member, type App } from "@/db/schema";
import { auth } from "@/lib/auth";

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}

/** Apps the user can see: every app of every workspace they belong to. */
export async function listUserApps(userId: string) {
  return db
    .select({ id: apps.id, name: apps.name, organizationId: apps.organizationId })
    .from(apps)
    .innerJoin(member, eq(member.organizationId, apps.organizationId))
    .where(eq(member.userId, userId))
    .orderBy(asc(apps.createdAt));
}

/** The app plus the user's role in its workspace. 404 (not 403) so app ids can't be probed. */
export const requireApp = cache(async (appId: string): Promise<{ app: App; role: string; userId: string }> => {
  const user = await requireUser();
  const [row] = await db
    .select({ app: apps, role: member.role })
    .from(apps)
    .innerJoin(member, and(eq(member.organizationId, apps.organizationId), eq(member.userId, user.id)))
    .where(eq(apps.id, appId))
    .limit(1);
  if (!row) notFound();
  return { app: row.app, role: row.role, userId: user.id };
});
