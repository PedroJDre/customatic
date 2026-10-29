import type { Metadata } from "next";
import { db } from "@/db";
import { getMessages } from "@/i18n/server";
import { requireApp } from "@/server/access";
import { analytics, surveyStats } from "@/server/queries";
import { DailyChart } from "./daily-chart";
import { SurveyCard } from "./survey-card";

export const metadata: Metadata = { title: "Analytics" };

function Bars({ rows, color, empty }: { rows: { label: string; n: number }[]; color: string; empty: string }) {
  if (!rows.length) return <p className="py-6 text-center text-[13.5px] text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.n));
  return (
    <ul className="grid gap-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
          <span className="truncate text-[13.5px] text-ink-2" title={r.label}>{r.label}</span>
          <span className="text-[13.5px] font-semibold tabular-nums">{r.n}</span>
          <span className="col-span-2 h-2 rounded-full bg-line-2">
            <span className="block h-2 rounded-full" style={{ width: r.n ? `${Math.max(3, (r.n / max) * 100)}%` : 0, background: color }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function AnalyticsPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const [{ app }, { t, locale }] = await Promise.all([requireApp(appId), getMessages()]);
  const [data, surveys] = await Promise.all([analytics(db, app.id), surveyStats(db, app.id)]);
  const a = t.analytics;
  const median =
    data.medianHours == null ? "—" : data.medianHours < 48 ? `${Math.max(1, Math.round(data.medianHours))} ${a.hours}` : `${Math.round(data.medianHours / 24)} ${a.days}`;
  const devices = data.byDevice.sort((x, y) => y.n - x.n).map((d) => ({ label: t.devices[d.device as keyof typeof t.devices] ?? d.device, n: d.n }));
  const statuses = (["todo", "in_progress", "done"] as const).map((s) => ({
    label: t.statuses[s],
    n: data.byStatus.find((r) => r.status === s)?.n ?? 0,
  }));

  const tiles = [
    { label: a.received, value: data.total },
    { label: a.openNow, value: data.openNow },
    { label: a.resolved, value: data.resolved },
    { label: a.medianTime, value: median },
  ];

  return (
    <main className="mx-auto grid max-w-[1080px] gap-5 px-5 py-8 sm:px-8">
      <p className="text-[13.5px] font-semibold text-muted">{a.range}</p>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-surface px-5 py-4">
            <dt className="text-[13px] text-muted">{tile.label}</dt>
            <dd className="mt-1 text-[30px] leading-none font-bold tracking-[-0.02em] tabular-nums">{tile.value}</dd>
          </div>
        ))}
      </dl>
      {surveys.map((stats) => (
        <SurveyCard key={stats.survey} stats={stats} t={t} />
      ))}
      {surveys.length === 0 && (app.widget.survey ?? "nps") !== "none" && (
        <p className="card p-5 text-[14px] text-muted">{a.noSurvey}</p>
      )}
      <section className="card p-5 sm:p-6">
        <DailyChart data={data.series} labels={t.typesPlural} locale={locale} title={a.perDay} tableLabel={a.table} dayLabel={a.day} />
      </section>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr_1fr]">
        <section className="card p-5">
          <h2 className="mb-4 text-[15px] font-bold">{a.byPage}</h2>
          <Bars rows={data.byPage.map((p) => ({ label: p.page, n: p.n }))} color="var(--color-problem)" empty={a.noData} />
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-[15px] font-bold">{a.byDevice}</h2>
          <Bars rows={devices} color="var(--color-ink-2)" empty={a.noData} />
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-[15px] font-bold">{a.byStatus}</h2>
          <Bars rows={data.total ? statuses : []} color="var(--color-ink-2)" empty={a.noData} />
        </section>
      </div>
    </main>
  );
}
