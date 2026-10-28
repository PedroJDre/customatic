"use client";

import { useActionState, useState } from "react";
import type { App } from "@/db/schema";
import type { Messages } from "@/i18n/messages";
import { deleteApp, updateAppSettings, type ActionState } from "@/server/actions";

export function SettingsForm({ app, t, roadmapUrl }: { app: App; t: Messages; roadmapUrl: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateAppSettings.bind(null, app.id), null);
  const [del, delAction, deleting] = useActionState<ActionState, FormData>(deleteApp.bind(null, app.id), null);
  const [color, setColor] = useState(app.widget.color);
  const [label, setLabel] = useState(app.widget.label);
  const s = t.settings;
  return (
    <>
      <form action={action} className="grid gap-8">
        <section className="card grid gap-5 p-6">
          <h2 className="text-[17px] font-bold">{s.general}</h2>
          <div>
            <label className="label" htmlFor="name">{s.name}</label>
            <input className="input" id="name" name="name" defaultValue={app.name} required minLength={2} maxLength={60} />
          </div>
          <div>
            <label className="label" htmlFor="domains">{s.domains}</label>
            <textarea className="textarea" id="domains" name="domains" rows={3} defaultValue={app.allowedOrigins.join("\n")} placeholder="acme.com" />
            <p className="hint">{s.domainsHint}</p>
          </div>
        </section>

        <section className="card grid gap-5 p-6">
          <h2 className="text-[17px] font-bold">{s.widget}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="color">{s.color}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-surface p-1"
                />
                <input className="input" value={color} onChange={(e) => setColor(e.target.value)} aria-label={s.color} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="label">{s.label}</label>
              <input className="input" id="label" name="label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={24} />
              <p className="hint">{s.labelHint}</p>
            </div>
            <div>
              <label className="label" htmlFor="position">{s.position}</label>
              <select className="input" id="position" name="position" defaultValue={app.widget.position}>
                <option value="right">{s.right}</option>
                <option value="left">{s.left}</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="language">{s.widgetLanguage}</label>
              <select className="input" id="language" name="language" defaultValue={app.widget.language}>
                <option value="auto">{s.auto}</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="askEmail">{s.askEmail}</label>
              <select className="input" id="askEmail" name="askEmail" defaultValue={app.widget.askEmail}>
                <option value="optional">{s.askOptional}</option>
                <option value="required">{s.askRequired}</option>
                <option value="hidden">{s.askHidden}</option>
              </select>
            </div>
          </div>
          <div className="flex items-center rounded-xl bg-canvas p-4" aria-hidden>
            <span className="inline-flex h-[44px] items-center gap-2 rounded-full px-4 text-[14px] font-semibold text-white" style={{ background: color }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6A.5.5 0 0 1 5 19.2V16h-.5A2.5 2.5 0 0 1 2 13.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              {label || "Feedback"}
            </span>
          </div>
        </section>

        <section className="card grid gap-3 p-6">
          <h2 className="text-[17px] font-bold">{s.roadmap}</h2>
          <p className="text-muted">{s.roadmapLead}</p>
          <label className="flex items-center gap-2.5 font-semibold">
            <input type="checkbox" name="roadmapEnabled" defaultChecked={app.roadmapEnabled} className="h-4 w-4 accent-brand" />
            {s.roadmapEnable}
          </label>
          <p className="text-[13.5px] break-all text-muted">
            {s.roadmapLink}:{" "}
            <a href={roadmapUrl} target="_blank" className="text-brand hover:underline">{roadmapUrl}</a>
          </p>
        </section>

        <div className="flex items-center gap-4">
          <button className="btn-primary" disabled={pending}>{pending ? t.common.loading : t.common.save}</button>
          {state?.message && <p role="status" className="text-[14px] text-comment-ink">{state.message}</p>}
          {state?.error && <p role="alert" className="text-[14px] text-problem-ink">{state.error}</p>}
        </div>
      </form>

      <form action={delAction} className="mt-12 grid gap-3 rounded-[var(--radius-card)] border border-problem/25 bg-surface p-6">
        <h2 className="text-[17px] font-bold">{s.danger}</h2>
        <p className="text-muted">{s.dangerLead}</p>
        <label className="label mb-0" htmlFor="confirm">{s.deleteConfirm}</label>
        <input className="input max-w-[320px]" id="confirm" name="confirm" autoComplete="off" placeholder={app.name} />
        {del?.error && <p role="alert" className="text-[13.5px] text-problem-ink">{del.error}</p>}
        <button className="btn-danger justify-self-start" disabled={deleting}>{s.deleteApp}</button>
      </form>
    </>
  );
}
