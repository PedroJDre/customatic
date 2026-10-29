"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { FeedbackStatus } from "@/db/schema";
import type { Messages } from "@/i18n/messages";
import { deleteFeedback, replyToFeedback, updateFeedback, type ActionState } from "@/server/actions";
import type { FeedbackDetail } from "@/server/queries";
import { LocalTime } from "@/components/local-time";
import { ScoreBadge } from "@/components/score-badge";
import { TypeBadge } from "@/components/type-badge";

type Props = {
  item: FeedbackDetail;
  app: { id: string; roadmapEnabled: boolean };
  members: { id: string; name: string }[];
  t: Messages;
  locale: string;
  backHref: string;
};

const STATUSES: FeedbackStatus[] = ["todo", "in_progress", "done"];

export function Detail({ item, app, members, t, locale, backHref }: Props) {
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(item.status);
  const [roadmapTitle, setRoadmapTitle] = useState(item.roadmapTitle ?? "");
  const [reply, replyAction, replying] = useActionState<ActionState, FormData>(
    replyToFeedback.bind(null, app.id, item.id),
    null,
  );
  const replyForm = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (reply?.ok) replyForm.current?.reset();
  }, [reply]);
  const patch = (data: Parameters<typeof updateFeedback>[2]) => start(() => updateFeedback(app.id, item.id, data));

  const facts: [string, React.ReactNode][] = [
    [t.detail.received, <LocalTime key="received" date={item.createdAt} locale={locale} />],
    [t.auth.email, item.email ? <a href={`mailto:${item.email}`} className="text-brand hover:underline">{item.email}</a> : t.inbox.anonymous],
    [
      t.detail.page,
      item.pageUrl ? (
        <a href={item.pageUrl} target="_blank" rel="noreferrer noopener" className="break-all text-brand hover:underline" title={item.pageTitle ?? undefined}>
          {item.pagePath ?? item.pageUrl}
        </a>
      ) : (
        "—"
      ),
    ],
    [t.detail.device, item.device ? (t.devices[item.device as keyof typeof t.devices] ?? item.device) : "—"],
    [t.detail.browser, item.browser ?? "—"],
    [t.detail.system, item.os ?? "—"],
    [t.detail.screen, item.viewport ?? "—"],
    [t.detail.language, item.language ?? "—"],
  ];

  return (
    <article className="mx-auto max-w-[760px] px-5 py-6 sm:px-8">
      <Link href={backHref} className="mb-4 inline-flex text-[13.5px] font-semibold text-muted hover:text-ink lg:hidden">
        ← {t.common.back}
      </Link>
      <div className="flex flex-wrap items-center gap-2.5">
        <TypeBadge type={item.type} label={t.types[item.type]} />
        <span className="text-[13px] font-semibold text-faint">#{item.number}</span>
      </div>
      {item.type === "rating" && item.survey && item.score !== null && (
        <div className="mt-4">
          <ScoreBadge survey={item.survey} score={item.score} t={t} large />
        </div>
      )}
      <p className={`mt-3 text-[17px] leading-relaxed whitespace-pre-wrap ${item.message ? "text-ink" : "text-muted"}`}>
        {item.message || t.surveys.noComment}
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4 border-y border-line py-4">
        <div>
          <p className="label">{t.detail.status}</p>
          <div className="inline-flex rounded-[10px] border border-line bg-canvas p-0.5" role="group" aria-label={t.detail.status}>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={pending}
                aria-pressed={status === s}
                onClick={() => {
                  setStatus(s);
                  patch({ status: s });
                }}
                className="h-8 rounded-lg px-3 text-[13px] font-semibold text-ink-2 aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-[0_1px_2px_rgba(20,23,51,.12),0_0_0_1px_var(--color-line)]"
              >
                {t.statuses[s]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="assignee">{t.detail.assignee}</label>
          <select
            id="assignee"
            className="input h-9 w-auto min-w-[170px]"
            defaultValue={item.assigneeId ?? ""}
            disabled={pending}
            onChange={(e) => patch({ assigneeId: e.target.value || null })}
          >
            <option value="">{t.inbox.unassigned}</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <button
          type="button"
          className="ml-auto inline-flex min-h-9 items-center px-1 text-[13px] font-semibold text-muted hover:text-problem-ink"
          onClick={() => {
            if (confirm(t.detail.deleteConfirm)) start(() => deleteFeedback(app.id, item.id));
          }}
        >
          {t.detail.delete}
        </button>
      </div>

      {item.hasScreenshot && (
        <figure className="mt-6">
          <figcaption className="label">{t.detail.screenshot}</figcaption>
          <a href={`/api/screenshots/${item.id}`} target="_blank" className="block overflow-hidden rounded-xl border border-line bg-canvas">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/screenshots/${item.id}`} alt={t.detail.screenshot} className="max-h-[420px] w-full object-contain" />
          </a>
        </figure>
      )}

      <dl className="mt-6 grid grid-cols-[minmax(110px,auto)_1fr] gap-x-6 gap-y-2.5 text-[14px]">
        {facts.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="min-w-0">{value}</dd>
          </div>
        ))}
      </dl>

      {item.metadata && Object.keys(item.metadata).length > 0 && (
        <div className="mt-6">
          <p className="label">{t.detail.data}</p>
          <dl className="grid grid-cols-[minmax(110px,auto)_1fr] gap-x-6 gap-y-1.5 rounded-xl bg-canvas p-4 text-[13.5px]">
            {Object.entries(item.metadata).map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-muted">{key}</dt>
                <dd className="min-w-0 break-words">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {item.type === "suggestion" && (
        <div className="mt-6 rounded-xl border border-line p-4">
          {app.roadmapEnabled ? (
            <>
              <label className="flex items-center gap-2.5 text-[14px] font-semibold">
                <input
                  type="checkbox"
                  defaultChecked={item.onRoadmap}
                  disabled={pending}
                  onChange={(e) => patch({ onRoadmap: e.target.checked, roadmapTitle: roadmapTitle || null })}
                  className="h-4 w-4 accent-brand"
                />
                {t.detail.roadmap}
              </label>
              <label className="label mt-3" htmlFor="roadmapTitle">{t.detail.roadmapTitle}</label>
              <input
                id="roadmapTitle"
                className="input"
                maxLength={120}
                value={roadmapTitle}
                onChange={(e) => setRoadmapTitle(e.target.value)}
                onBlur={() => patch({ roadmapTitle: roadmapTitle || null })}
                placeholder={item.message.slice(0, 80)}
              />
              <p className="hint">{t.detail.roadmapTitleHint}</p>
            </>
          ) : (
            <p className="text-[13.5px] text-muted">
              {t.detail.roadmapOff}{" "}
              <Link href={`/dashboard/${app.id}/settings`} className="font-semibold text-brand hover:underline">{t.nav.settings}</Link>
            </p>
          )}
        </div>
      )}

      <section className="mt-8">
        {item.replies.length > 0 && (
          <>
            <h2 className="label">{t.detail.replies}</h2>
            <ol className="mb-5 grid gap-3">
              {item.replies.map((r) => (
                <li key={r.id} className="rounded-xl bg-brand-soft/60 p-4">
                  <p className="mb-1 text-[12.5px] text-muted">
                    <b className="font-semibold text-ink">{r.author ?? "—"}</b> · <LocalTime date={r.createdAt} locale={locale} />
                    {r.emailStatus !== "sent" && <span className="ml-2 text-warn">({r.emailStatus === "skipped" ? t.detail.notEmailed : t.detail.emailFailed})</span>}
                  </p>
                  <p className="text-[14px] whitespace-pre-wrap">{r.body}</p>
                </li>
              ))}
            </ol>
          </>
        )}
        {item.email ? (
          <form ref={replyForm} action={replyAction} className="grid gap-3">
            <label className="label mb-0" htmlFor="reply">{t.detail.reply}</label>
            <textarea id="reply" name="body" rows={4} className="textarea" placeholder={t.detail.replyPlaceholder} required minLength={2} />
            {reply?.error && <p role="alert" className="text-[13.5px] text-problem-ink">{reply.error}</p>}
            {reply?.message && <p role="status" className="text-[13.5px] text-comment-ink">{reply.message}</p>}
            <button className="btn-primary justify-self-start" disabled={replying}>{replying ? t.common.loading : t.detail.sendReply}</button>
          </form>
        ) : (
          <p className="rounded-xl bg-canvas p-4 text-[13.5px] text-muted">{t.detail.replyNoEmail}</p>
        )}
      </section>
    </article>
  );
}
