import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { member } from "@/db/schema";
import { getMessages } from "@/i18n/server";
import { requireUser } from "@/server/access";
import { NewAppForm } from "./new-app-form";

export const metadata: Metadata = { title: "New app" };

export default async function NewAppPage() {
  const user = await requireUser();
  const { t } = await getMessages();
  const memberships = await db.select({ id: member.id }).from(member).where(eq(member.userId, user.id)).limit(1);
  return (
    <main className="mx-auto max-w-[560px] px-5 py-10 sm:py-16">
      <h1 className="text-[28px] leading-tight font-bold tracking-[-0.02em]">{t.onboarding.title}</h1>
      <p className="mt-2 mb-8 text-[15.5px] text-muted">{t.onboarding.lead}</p>
      <div className="card p-6">
        <NewAppForm t={t} askWorkspace={memberships.length === 0} />
      </div>
    </main>
  );
}
