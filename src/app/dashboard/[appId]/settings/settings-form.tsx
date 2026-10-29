"use client";

import { useActionState, useState } from "react";
import { WIDGET_TEXT_LIMITS, type App } from "@/db/schema";
import { strings as widgetStrings } from "@/widget/i18n";
import type { Messages } from "@/i18n/messages";
import { deleteApp, updateAppSettings, type ActionState } from "@/server/actions";

const TEXT_FIELDS = ["label", "question", "title", "subtitle", "thanksTitle", "thanksBody"] as const;

export function SettingsForm({ app, t, roadmapUrl, locale }: { app: App; t: Messages; roadmapUrl: string; locale: "en" | "es" }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateAppSettings.bind(null, app.id), null);
  const [del, delAction, deleting] = useActionState<ActionState, FormData>(deleteApp.bind(null, app.id), null);
  const [color, setColor] = useState(app.widget.color);
  const [language, setLanguage] = useState(app.widget.language);
  const [texts, setTexts] = useState({
    label: app.widget.label ?? "",
    title: app.widget.title ?? "",
    subtitle: app.widget.subtitle ?? "",
    thanksTitle: app.widget.thanksTitle ?? "",
    thanksBody: app.widget.thanksBody ?? "",
    question: app.widget.question ?? "",
  });
  const [survey, setSurvey] = useState(app.widget.survey ?? "nps");
  // Placeholders and preview show the default copy in the widget's language.
  const w = widgetStrings[language === "auto" ? locale : language];
  const defaults = {
    label: w.button,
    title: w.title,
    subtitle: w.subtitle,
    thanksTitle: w.thanks,
    thanksBody: w.thanksBody,
    question: survey === "none" ? "" : w.questions[survey],
  };
  const scale = survey === "nps" ? 11 : survey === "csat" ? 5 : 7;
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
          <div>
            <label className="label" htmlFor="survey">{s.survey}</label>
            <select className="input" id="survey" name="survey" value={survey} onChange={(e) => setSurvey(e.target.value as typeof survey)}>
              {(["nps", "csat", "ces", "none"] as const).map((kind) => (
                <option key={kind} value={kind}>{s.surveyOptions[kind]}</option>
              ))}
            </select>
            <p className="hint">{s.surveyLead}</p>
          </div>
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
              <label className="label" htmlFor="position">{s.position}</label>
              <select className="input" id="position" name="position" defaultValue={app.widget.position}>
                <option value="right">{s.right}</option>
                <option value="left">{s.left}</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="language">{s.widgetLanguage}</label>
              <select
                className="input"
                id="language"
                name="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as typeof language)}
              >
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
        </section>

        <section className="card grid gap-5 p-6">
          <div>
            <h2 className="text-[17px] font-bold">{s.texts}</h2>
            <p className="mt-1 text-[14px] text-muted">{s.textsLead}</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="grid content-start gap-4">
              {TEXT_FIELDS.map((field) => {
                if (field === "question" && survey === "none") return <input key={field} type="hidden" name="question" value={texts.question} />;
                const common = {
                  id: field,
                  name: field,
                  value: texts[field],
                  maxLength: WIDGET_TEXT_LIMITS[field],
                  placeholder: defaults[field],
                };
                return (
                  <div key={field}>
                    <label className="label" htmlFor={field}>{s.textLabels[field]}</label>
                    {field === "subtitle" || field === "thanksBody" ? (
                      <textarea className="textarea" rows={2} {...common} onChange={(e) => setTexts({ ...texts, [field]: e.target.value })} />
                    ) : (
                      <input className="input" {...common} onChange={(e) => setTexts({ ...texts, [field]: e.target.value })} />
                    )}
                  </div>
                );
              })}
            </div>
            <figure className="m-0 grid content-start gap-3 rounded-xl bg-canvas p-4">
              <figcaption className="text-[12.5px] font-semibold text-muted">{s.preview}</figcaption>
              {survey !== "none" && (
                <div className="rounded-xl bg-surface p-4 shadow-[0_12px_30px_-12px_rgba(20,23,51,.3),0_0_0_1px_rgba(20,23,51,.06)]">
                  <p className="text-[14.5px] leading-snug font-bold break-words">{texts.question || defaults.question}</p>
                  <div className="mt-3 flex gap-1" aria-hidden>
                    {Array.from({ length: scale }, (_, i) => (
                      <span key={i} className="grid h-7 flex-1 place-items-center rounded-md border border-line text-[10.5px] font-semibold text-ink-2">
                        {survey === "nps" ? i : i + 1}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-xl bg-surface p-4 shadow-[0_12px_30px_-12px_rgba(20,23,51,.3),0_0_0_1px_rgba(20,23,51,.06)]">
                <p className="text-[15px] leading-snug font-bold break-words">{texts.title || defaults.title}</p>
                <p className="mt-1 text-[12.5px] break-words text-muted">{texts.subtitle || defaults.subtitle}</p>
                <div className="mt-3 grid gap-1.5" aria-hidden>
                  <span className="h-7 rounded-lg border border-line" />
                  <span className="h-7 rounded-lg border border-line" />
                  <span className="h-7 rounded-lg border border-line" />
                </div>
              </div>
              <div className="rounded-xl bg-surface p-4 text-center shadow-[0_12px_30px_-12px_rgba(20,23,51,.3),0_0_0_1px_rgba(20,23,51,.06)]">
                <p className="text-[14px] font-bold break-words">{texts.thanksTitle || defaults.thanksTitle}</p>
                <p className="mt-1 text-[12.5px] break-words text-muted">{texts.thanksBody || defaults.thanksBody}</p>
              </div>
              <span
                className="inline-flex h-[42px] max-w-full items-center gap-2 justify-self-start rounded-full px-4 text-[14px] font-semibold text-white"
                style={{ background: color }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6A.5.5 0 0 1 5 19.2V16h-.5A2.5 2.5 0 0 1 2 13.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
                <span className="truncate">{texts.label || defaults.label}</span>
              </span>
            </figure>
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
