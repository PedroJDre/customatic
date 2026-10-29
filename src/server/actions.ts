"use server";

import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { apps, defaultWidgetSettings, feedback, member, replies, roadmapVotes, type WidgetSettings } from "@/db/schema";
import { LOCALE_COOKIE, getMessages } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { requireApp, requireUser } from "./access";
import { newId, slugify } from "./ids";
import { normalizeOrigin } from "./origins";

export type ActionState = { ok?: boolean; error?: string; message?: string; link?: string } | null;

export async function setLocale(locale: "en" | "es") {
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

function parseDomains(text: string): string[] {
  return [...new Set(text.split(/[\s,]+/).map(normalizeOrigin).filter((d): d is string => Boolean(d)))].slice(0, 20);
}

async function uniqueSlug(base: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const slug = i === 0 ? base : `${base}-${randomBytes(2).toString("hex")}`;
    const taken = await db.select({ id: apps.id }).from(apps).where(eq(apps.slug, slug)).limit(1);
    if (!taken.length) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Onboarding and "New app": creates the workspace on first use, then the app. */
export async function createApp(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getMessages();
  const name = String(form.get("name") ?? "").trim().slice(0, 60);
  if (name.length < 2) return { error: t.auth.failed };
  const domains = parseDomains(String(form.get("domain") ?? ""));

  let [membership] = await db.select().from(member).where(eq(member.userId, user.id)).limit(1);
  if (!membership) {
    const workspace = String(form.get("workspace") ?? "").trim().slice(0, 60) || name;
    const org = await auth.api.createOrganization({
      body: { name: workspace, slug: `${slugify(workspace)}-${randomBytes(3).toString("hex")}` },
      headers: await headers(),
    });
    if (!org) return { error: t.auth.failed };
    [membership] = await db.select().from(member).where(eq(member.userId, user.id)).limit(1);
  }

  const id = newId("app", 12);
  await db.insert(apps).values({
    id,
    organizationId: membership.organizationId,
    name,
    slug: await uniqueSlug(slugify(name)),
    allowedOrigins: domains,
    widget: defaultWidgetSettings,
  });
  revalidatePath("/dashboard", "layout"); // the sidebar lists the new app
  redirect(`/dashboard/${id}/install`);
}

const feedbackPatch = z.object({
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  assigneeId: z.string().nullable().optional(),
  onRoadmap: z.boolean().optional(),
  roadmapTitle: z.string().trim().max(120).nullable().optional(),
});

export async function updateFeedback(appId: string, id: string, patch: z.input<typeof feedbackPatch>) {
  const { app } = await requireApp(appId);
  const data = feedbackPatch.parse(patch);
  if (data.assigneeId) {
    // Only members of this workspace can be assigned.
    const [m] = await db
      .select({ id: member.id })
      .from(member)
      .where(and(eq(member.organizationId, app.organizationId), eq(member.userId, data.assigneeId)))
      .limit(1);
    if (!m) throw new Error("Assignee is not a member of this workspace.");
  }
  await db
    .update(feedback)
    .set({
      ...data,
      ...(data.status ? { resolvedAt: data.status === "done" ? new Date() : null } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(feedback.appId, app.id), eq(feedback.id, id)));
  revalidatePath(`/dashboard/${app.id}`);
}

export async function deleteFeedback(appId: string, id: string) {
  const { app } = await requireApp(appId);
  await db.delete(feedback).where(and(eq(feedback.appId, app.id), eq(feedback.id, id)));
  revalidatePath(`/dashboard/${app.id}`);
  redirect(`/dashboard/${app.id}`);
}

export async function replyToFeedback(appId: string, id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { app, userId } = await requireApp(appId);
  const { t } = await getMessages();
  const body = String(form.get("body") ?? "").trim().slice(0, 5000);
  if (body.length < 2) return { error: t.detail.replyPlaceholder };
  const [item] = await db
    .select()
    .from(feedback)
    .where(and(eq(feedback.appId, app.id), eq(feedback.id, id)))
    .limit(1);
  if (!item) return { error: "Not found" };
  if (!item.email) return { error: t.detail.replyNoEmail };

  const session = await auth.api.getSession({ headers: await headers() });
  const original = item.message.length > 400 ? `${item.message.slice(0, 400)}…` : item.message;
  const status = await sendEmail({
    to: item.email,
    subject: `Re: your feedback to ${app.name}`,
    text: `${body}\n\n— ${session?.user.name ?? app.name}, ${app.name}\n\n> ${original.replace(/\n/g, "\n> ")}`,
    replyTo: session?.user.email,
  });
  await db.insert(replies).values({ id: newId("rp"), feedbackId: item.id, authorId: userId, body, sentTo: item.email, emailStatus: status });
  if (item.status === "todo") {
    await db.update(feedback).set({ status: "in_progress", updatedAt: new Date() }).where(eq(feedback.id, item.id));
  }
  revalidatePath(`/dashboard/${app.id}`);
  return status === "sent"
    ? { ok: true, message: t.detail.replySent }
    : { ok: true, message: status === "skipped" ? t.detail.replySkipped : t.detail.replyFailed };
}

const hex = /^#[0-9a-f]{6}$/i;

export async function updateAppSettings(appId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { app } = await requireApp(appId);
  const { t } = await getMessages();
  const name = String(form.get("name") ?? "").trim().slice(0, 60);
  if (name.length < 2) return { error: t.auth.failed };
  const color = String(form.get("color") ?? "");
  const widget: WidgetSettings = {
    color: hex.test(color) ? color : defaultWidgetSettings.color,
    position: form.get("position") === "left" ? "left" : "right",
    language: (["auto", "en", "es"] as const).find((l) => l === form.get("language")) ?? "auto",
    label: String(form.get("label") ?? "").trim().slice(0, 24),
    askEmail: (["optional", "required", "hidden"] as const).find((v) => v === form.get("askEmail")) ?? "optional",
  };
  await db
    .update(apps)
    .set({
      name,
      allowedOrigins: parseDomains(String(form.get("domains") ?? "")),
      widget,
      roadmapEnabled: form.get("roadmapEnabled") === "on",
    })
    .where(eq(apps.id, app.id));
  revalidatePath(`/dashboard/${app.id}`, "layout");
  return { ok: true, message: t.common.saved };
}

export async function deleteApp(appId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { app, role } = await requireApp(appId);
  if (role === "member") return { error: "Only owners and admins can delete apps." };
  if (String(form.get("confirm") ?? "").trim() !== app.name) return { error: `Type "${app.name}" to confirm.` };
  await db.delete(apps).where(eq(apps.id, app.id));
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

async function currentOrg(userId: string) {
  const [m] = await db.select().from(member).where(eq(member.userId, userId)).limit(1);
  return m;
}

export async function inviteMember(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const { t } = await getMessages();
  const m = await currentOrg(user.id);
  if (!m) return { error: "Create an app first." };
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!z.email().safeParse(email).success) return { error: t.auth.failed };
  try {
    const invitation = await auth.api.createInvitation({
      body: { email, role: "member", organizationId: m.organizationId, resend: true },
      headers: await headers(),
    });
    revalidatePath("/dashboard/team");
    const { appUrl } = await import("@/lib/url");
    return { ok: true, message: t.team.invited, link: `${appUrl()}/invite/${invitation?.id}` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : t.auth.failed };
  }
}

export async function cancelInvitation(invitationId: string) {
  await requireUser();
  await auth.api.cancelInvitation({ body: { invitationId }, headers: await headers() });
  revalidatePath("/dashboard/team");
}

export async function removeMember(memberId: string) {
  const user = await requireUser();
  const m = await currentOrg(user.id);
  if (!m) return;
  await auth.api.removeMember({ body: { memberIdOrEmail: memberId, organizationId: m.organizationId }, headers: await headers() });
  revalidatePath("/dashboard/team");
}

export async function acceptInvitation(invitationId: string) {
  await requireUser();
  await auth.api.acceptInvitation({ body: { invitationId }, headers: await headers() });
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

const VOTER_COOKIE = "customatic_voter";

/** Public roadmap vote: one per browser per item, no account needed. */
export async function vote(feedbackId: string, slug: string) {
  const jar = await cookies();
  let voter = jar.get(VOTER_COOKIE)?.value;
  if (!voter) {
    voter = randomBytes(16).toString("hex");
    jar.set(VOTER_COOKIE, voter, { path: "/", maxAge: 60 * 60 * 24 * 365 * 2, httpOnly: true, sameSite: "lax" });
  }
  const [item] = await db
    .select({ id: feedback.id })
    .from(feedback)
    .innerJoin(apps, eq(apps.id, feedback.appId))
    .where(and(eq(feedback.id, feedbackId), eq(feedback.onRoadmap, true), eq(apps.roadmapEnabled, true), eq(apps.slug, slug)))
    .limit(1);
  if (!item) return;
  const hash = createHash("sha256").update(voter).digest("hex").slice(0, 32);
  await db.insert(roadmapVotes).values({ feedbackId: item.id, voter: hash }).onConflictDoNothing();
  revalidatePath(`/roadmap/${slug}`);
}
