"use client";

import { useActionState, useTransition } from "react";
import { CopyButton } from "@/components/copy-button";
import type { Messages } from "@/i18n/messages";
import { cancelInvitation, inviteMember, removeMember, type ActionState } from "@/server/actions";

export function InviteForm({ t }: { t: Messages }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(inviteMember, null);
  return (
    <form action={action} className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input className="input flex-1" type="email" name="email" required placeholder="maria@acme.com" aria-label={t.auth.email} />
        <button className="btn-primary" disabled={pending}>{pending ? t.common.loading : t.team.inviteButton}</button>
      </div>
      {state?.error && <p role="alert" className="text-[13.5px] text-problem-ink">{state.error}</p>}
      {state?.link && (
        <div role="status" className="rounded-xl bg-canvas p-4 text-[13.5px]">
          <p className="font-semibold text-comment-ink">{state.message}</p>
          <p className="mt-1 text-muted">{t.team.inviteLink}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-2.5 py-1.5 text-ink">{state.link}</code>
            <CopyButton text={state.link} label={t.common.copy} done={t.common.copied} />
          </div>
        </div>
      )}
    </form>
  );
}

export function MemberActions({ kind, id, label }: { kind: "member" | "invitation"; id: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-[13px] font-semibold text-muted hover:text-problem-ink"
      onClick={() => start(() => (kind === "member" ? removeMember(id) : cancelInvitation(id)))}
    >
      {label}
    </button>
  );
}
