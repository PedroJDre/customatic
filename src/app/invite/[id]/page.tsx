import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invitation, organization, user } from "@/db/schema";
import { Logo } from "@/components/logo";
import { format } from "@/i18n/messages";
import { getMessages } from "@/i18n/server";
import { getSession } from "@/server/access";
import { AcceptButton } from "./accept-button";

export const metadata: Metadata = { title: "Invitation" };

export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getMessages();
  const [row] = await db
    .select({ inv: invitation, org: organization.name, inviter: user.name })
    .from(invitation)
    .innerJoin(organization, eq(organization.id, invitation.organizationId))
    .innerJoin(user, eq(user.id, invitation.inviterId))
    .where(eq(invitation.id, id))
    .limit(1);
  const session = await getSession();
  const valid = row && row.inv.status === "pending" && row.inv.expiresAt > new Date();
  const next = `/invite/${id}`;

  return (
    <main className="mx-auto max-w-[440px] px-5 py-16">
      <Link href="/" className="mb-10 inline-block"><Logo /></Link>
      {!valid ? (
        <p className="text-[16px] text-muted">{t.invite.invalid}</p>
      ) : (
        <div className="card grid gap-4 p-7">
          <h1 className="text-[22px] leading-tight font-bold tracking-[-0.02em]">{format(t.invite.title, { org: row.org })}</h1>
          <p className="text-muted">{format(t.invite.lead, { inviter: row.inviter })}</p>
          {!session ? (
            <>
              <p className="text-[14px]">{format(t.invite.signInFirst, { email: row.inv.email })}</p>
              <div className="flex gap-2">
                <Link className="btn-primary" href={`/sign-up?next=${encodeURIComponent(next)}`}>{t.common.signUp}</Link>
                <Link className="btn-quiet" href={`/sign-in?next=${encodeURIComponent(next)}`}>{t.common.signIn}</Link>
              </div>
            </>
          ) : session.user.email.toLowerCase() !== row.inv.email.toLowerCase() ? (
            <p className="rounded-xl bg-canvas p-4 text-[14px]">{format(t.invite.wrongAccount, { email: row.inv.email })}</p>
          ) : (
            <AcceptButton id={id} label={t.invite.accept} />
          )}
        </div>
      )}
    </main>
  );
}
