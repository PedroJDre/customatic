import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { invitation, member } from "@/db/schema";
import { getMessages } from "@/i18n/server";
import { requireUser } from "@/server/access";
import { listMembers } from "@/server/queries";
import { InviteForm, MemberActions } from "./team-forms";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const user = await requireUser();
  const { t } = await getMessages();
  const [mine] = await db.select().from(member).where(eq(member.userId, user.id)).limit(1);
  if (!mine) {
    return (
      <main className="mx-auto max-w-[640px] px-5 py-12">
        <h1 className="text-[24px] font-bold">{t.team.title}</h1>
        <p className="mt-2 text-muted">{t.onboarding.lead}</p>
      </main>
    );
  }
  const [members, pending] = await Promise.all([
    listMembers(db, mine.organizationId),
    db
      .select()
      .from(invitation)
      .where(and(eq(invitation.organizationId, mine.organizationId), eq(invitation.status, "pending"))),
  ]);
  const canManage = mine.role === "owner" || mine.role === "admin";
  const roleLabel = (role: string) => (role === "owner" ? t.team.owner : role === "admin" ? t.team.admin : t.team.member);

  return (
    <main className="mx-auto grid max-w-[720px] gap-8 px-5 py-10 sm:px-8">
      <header>
        <h1 className="text-[26px] font-bold tracking-[-0.02em]">{t.team.title}</h1>
        <p className="mt-1.5 text-muted">{t.team.lead}</p>
      </header>
      {canManage && (
        <section className="card p-6">
          <h2 className="mb-3 text-[16px] font-bold">{t.team.invite}</h2>
          <InviteForm t={t} />
        </section>
      )}
      <section>
        <h2 className="mb-3 text-[16px] font-bold">{t.team.members}</h2>
        <ul className="card divide-y divide-line">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[14px] font-bold text-brand">
                {m.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">
                  {m.name} {m.id === user.id && <span className="font-normal text-muted">({t.team.you})</span>}
                </p>
                <p className="truncate text-[13px] text-muted">{m.email}</p>
              </div>
              <span className="text-[13px] text-muted">{roleLabel(m.role)}</span>
              {canManage && m.id !== user.id && m.role !== "owner" && <MemberActions kind="member" id={m.memberId} label={t.team.remove} />}
            </li>
          ))}
        </ul>
      </section>
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-[16px] font-bold">{t.team.pending}</h2>
          <ul className="card divide-y divide-line">
            {pending.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 px-5 py-3.5">
                <p className="min-w-0 flex-1 truncate text-[14px]">{inv.email}</p>
                {canManage && <MemberActions kind="invitation" id={inv.id} label={t.team.revoke} />}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
