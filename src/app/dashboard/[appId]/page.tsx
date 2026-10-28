import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import type { FeedbackType } from "@/db/schema";
import { getMessages } from "@/i18n/server";
import { timeAgo } from "@/lib/time";
import { requireApp } from "@/server/access";
import { getFeedback, listInbox, listMembers, parseFilters, type InboxFilters } from "@/server/queries";
import { TypeIcon, typeColor } from "@/components/type-badge";
import { Detail } from "./detail";

export const metadata: Metadata = { title: "Inbox" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function hrefWith(appId: string, f: InboxFilters, changes: Partial<InboxFilters> & { item?: string | null }) {
  const next = { ...f, ...changes };
  const params = new URLSearchParams();
  if (next.type) params.set("type", next.type);
  if (next.status && next.status !== "open") params.set("status", next.status);
  if (next.q) params.set("q", next.q);
  if (changes.item) params.set("item", changes.item);
  const qs = params.toString();
  return `/dashboard/${appId}${qs ? `?${qs}` : ""}`;
}

export default async function InboxPage({ params, searchParams }: { params: Promise<{ appId: string }>; searchParams: SearchParams }) {
  const { appId } = await params;
  const sp = await searchParams;
  const [{ app }, { t, locale }] = await Promise.all([requireApp(appId), getMessages()]);
  const filters = parseFilters(sp);
  const selectedId = typeof sp.item === "string" ? sp.item : undefined;
  const [{ items, counts }, selected, members] = await Promise.all([
    listInbox(db, app.id, filters),
    selectedId ? getFeedback(db, app.id, selectedId) : null,
    listMembers(db, app.organizationId),
  ]);
  const hasAny = counts.all > 0 || filters.q || filters.status !== "open" || filters.type;

  const typeTabs: { key: FeedbackType | undefined; label: string; n: number }[] = [
    { key: undefined, label: t.inbox.all, n: counts.all },
    { key: "problem", label: t.typesPlural.problem, n: counts.problem },
    { key: "suggestion", label: t.typesPlural.suggestion, n: counts.suggestion },
    { key: "comment", label: t.typesPlural.comment, n: counts.comment },
  ];
  const statusOptions = [
    { key: "open", label: t.inbox.open },
    { key: "todo", label: t.statuses.todo },
    { key: "in_progress", label: t.statuses.in_progress },
    { key: "done", label: t.statuses.done },
    { key: "all", label: t.inbox.allStatuses },
  ] as const;

  if (!hasAny) {
    return (
      <div className="mx-auto max-w-[520px] px-5 py-20 text-center">
        <div className="mx-auto mb-5 flex w-fit gap-2" aria-hidden>
          {(["problem", "suggestion", "comment"] as const).map((type) => (
            <span key={type} className="grid h-11 w-11 place-items-center rounded-xl" style={{ color: typeColor[type], background: `color-mix(in srgb, ${typeColor[type]} 12%, white)` }}>
              <TypeIcon type={type} size={20} />
            </span>
          ))}
        </div>
        <h2 className="text-[20px] font-bold">{t.inbox.empty}</h2>
        <p className="mt-2 mb-6 text-muted">{t.inbox.emptyLead}</p>
        <Link href={`/dashboard/${app.id}/install`} className="btn-primary">{t.inbox.goInstall}</Link>
      </div>
    );
  }

  return (
    <div className="lg:grid lg:h-[calc(100dvh-105px)] lg:grid-cols-[minmax(340px,440px)_1fr]">
      <section className={`flex min-h-0 flex-col border-line lg:border-r ${selected ? "hidden lg:flex" : ""}`} aria-label={t.nav.inbox}>
        <div className="grid gap-3 border-b border-line bg-surface px-4 py-3">
          <div className="flex gap-1 overflow-x-auto" role="group">
            {typeTabs.map((tab) => {
              const active = filters.type === tab.key;
              return (
                <Link
                  key={tab.label}
                  href={hrefWith(app.id, filters, { type: tab.key })}
                  aria-current={active ? "true" : undefined}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold ${active ? "bg-ink text-white" : "text-ink-2 hover:bg-canvas"}`}
                >
                  {tab.key && <span className="h-2 w-2 rounded-full" style={{ background: typeColor[tab.key] }} />}
                  {tab.label}
                  <span className={active ? "text-white/70" : "text-faint"}>{tab.n}</span>
                </Link>
              );
            })}
          </div>
          <form className="flex gap-2" action={`/dashboard/${app.id}`}>
            {filters.type && <input type="hidden" name="type" value={filters.type} />}
            <input className="input h-9 flex-1" type="search" name="q" defaultValue={filters.q} placeholder={t.inbox.search} aria-label={t.inbox.search} />
            <select name="status" defaultValue={filters.status} className="input h-9 w-auto pr-7" aria-label={t.detail.status}>
              {statusOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            <button className="btn-quiet h-9 px-3" aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </form>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {items.length === 0 && <li className="px-5 py-12 text-center text-muted">{t.inbox.emptyFiltered}</li>}
          {items.map((item) => {
            const active = item.id === selectedId;
            return (
              <li key={item.id}>
                <Link
                  href={hrefWith(app.id, filters, { item: item.id })}
                  aria-current={active ? "true" : undefined}
                  className={`relative block border-b border-line-2 py-3 pr-4 pl-5 ${active ? "bg-brand-soft/70" : "bg-surface hover:bg-[#fafbfd]"}`}
                >
                  <span className="absolute top-3 bottom-3 left-0 w-[3px] rounded-r" style={{ background: typeColor[item.type] }} aria-hidden />
                  <div className="mb-1 flex items-center gap-2 text-[12.5px]">
                    <span className="font-semibold text-ink-2">{t.types[item.type]}</span>
                    <span className="text-faint">#{item.number}</span>
                    <span className="ml-auto text-faint">{timeAgo(item.createdAt, locale)}</span>
                  </div>
                  <p className={`line-clamp-2 text-[14px] leading-snug ${item.status === "done" ? "text-muted" : "text-ink"}`}>{item.message}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-muted">
                    <span className="truncate">{item.email ?? t.inbox.anonymous}</span>
                    {item.pagePath && <span className="truncate text-faint">{item.pagePath}</span>}
                    {item.hasScreenshot && (
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-label={t.detail.screenshot} className="shrink-0 text-faint"><rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m4 17 5-5 4 4 2.5-2.5L20 18" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
                    )}
                    <StatusDot status={item.status} label={t.statuses[item.status]} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
      <section className={`min-h-0 overflow-y-auto bg-surface ${selected ? "" : "hidden lg:block"}`} aria-label="Details">
        {selected ? (
          <Detail
            key={selected.id}
            item={selected}
            app={{ id: app.id, roadmapEnabled: app.roadmapEnabled }}
            members={members.map((m) => ({ id: m.id, name: m.name }))}
            t={t}
            locale={locale}
            backHref={hrefWith(app.id, filters, {})}
          />
        ) : (
          <p className="grid h-full place-items-center p-10 text-muted">{t.inbox.select}</p>
        )}
      </section>
    </div>
  );
}

function StatusDot({ status, label }: { status: "todo" | "in_progress" | "done"; label: string }) {
  const color = status === "done" ? "var(--color-comment)" : status === "in_progress" ? "var(--color-brand)" : "var(--color-faint)";
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
      {label}
    </span>
  );
}
