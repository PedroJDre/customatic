"use client";

import { useActionState } from "react";
import { createApp, type ActionState } from "@/server/actions";
import type { Messages } from "@/i18n/messages";

export function NewAppForm({ t, askWorkspace }: { t: Messages; askWorkspace: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createApp, null);
  return (
    <form action={action} className="grid gap-5">
      {askWorkspace && (
        <div>
          <label className="label" htmlFor="workspace">{t.onboarding.workspace}</label>
          <input className="input" id="workspace" name="workspace" placeholder="Acme" autoComplete="organization" />
          <p className="hint">{t.onboarding.workspaceHint}</p>
        </div>
      )}
      <div>
        <label className="label" htmlFor="name">{t.onboarding.name}</label>
        <input className="input" id="name" name="name" required minLength={2} maxLength={60} placeholder={t.onboarding.namePlaceholder} />
      </div>
      <div>
        <label className="label" htmlFor="domain">{t.onboarding.domain}</label>
        <input className="input" id="domain" name="domain" placeholder="acme.com" inputMode="url" />
        <p className="hint">{t.onboarding.domainHint}</p>
      </div>
      {state?.error && <p role="alert" className="text-[13.5px] text-problem-ink">{state.error}</p>}
      <button className="btn-primary h-11 justify-self-start px-6" disabled={pending}>
        {pending ? t.common.loading : t.onboarding.create}
      </button>
    </form>
  );
}
