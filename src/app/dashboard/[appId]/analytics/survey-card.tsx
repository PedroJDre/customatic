import type { Messages } from "@/i18n/messages";
import { format } from "@/i18n/messages";
import type { SurveyStats } from "@/server/queries";

// Diverging scale for NPS groups: two hues with a neutral middle.
const GROUP_COLORS = { detractors: "var(--color-problem)", passives: "#b8bccb", promoters: "var(--color-comment)" } as const;

/** One survey's result: the headline number, what it means, and how answers spread across the scale. */
export function SurveyCard({ stats, t }: { stats: SurveyStats; t: Messages }) {
  const a = t.analytics;
  const label = stats.survey === "nps" ? a.npsScore : stats.survey === "csat" ? a.csatScore : a.cesScore;
  const headline =
    stats.survey === "nps" ? (stats.headline > 0 ? `+${stats.headline}` : String(stats.headline)) : stats.survey === "csat" ? `${stats.headline}%` : `${stats.headline}/7`;
  const hint =
    stats.survey === "nps"
      ? a.npsHint
      : stats.survey === "csat"
        ? format(a.csatHint, { avg: String(stats.average) })
        : format(a.cesHint, { pct: String(stats.goodShare) });
  const max = Math.max(...stats.distribution.map((d) => d.n), 1);

  return (
    <section className="card grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div>
        <h2 className="text-[15px] font-bold">
          {a.surveyTitle} {t.surveys[stats.survey]}
          <span className="ml-2 text-[13px] font-normal text-muted">{format(a.responses, { n: String(stats.responses) })}</span>
        </h2>
        <p className="mt-3 text-[13px] text-muted">{label}</p>
        <p className="text-[44px] leading-none font-bold tracking-[-0.03em] tabular-nums">{headline}</p>
        <p className="mt-2 max-w-[42ch] text-[13px] text-muted">{hint}</p>
        {stats.groups && (
          <div className="mt-4">
            <div className="flex h-3 overflow-hidden rounded-full" role="img" aria-label={`${t.surveys.detractor} ${stats.groups.detractors}, ${t.surveys.passive} ${stats.groups.passives}, ${t.surveys.promoter} ${stats.groups.promoters}`}>
              {(["detractors", "passives", "promoters"] as const).map((g) =>
                stats.groups![g] ? (
                  <span key={g} style={{ width: `${(stats.groups![g] / stats.responses) * 100}%`, background: GROUP_COLORS[g] }} className="border-r-2 border-surface last:border-r-0" />
                ) : null,
              )}
            </div>
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-2">
              {(["detractors", "passives", "promoters"] as const).map((g) => (
                <li key={g} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: GROUP_COLORS[g] }} aria-hidden />
                  {t.surveys[g === "detractors" ? "detractor" : g === "passives" ? "passive" : "promoter"]}
                  <b className="font-semibold tabular-nums">{Math.round((stats.groups![g] / stats.responses) * 100)}%</b>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <figure className="m-0">
        <figcaption className="mb-2 text-[13px] text-muted">{a.distribution}</figcaption>
        <div className="flex h-[150px] items-end gap-1.5" role="img" aria-label={stats.distribution.map((d) => `${d.score}: ${d.n}`).join(", ")}>
          {stats.distribution.map((d) => (
            <div key={d.score} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${d.score}: ${d.n}`}>
              <span className="text-[11px] font-semibold text-ink-2 tabular-nums">{d.n || ""}</span>
              <span
                className="w-full rounded-t-[4px]"
                style={{
                  height: `${d.n ? Math.max(4, (d.n / max) * 110) : 0}px`,
                  background:
                    stats.survey === "nps"
                      ? GROUP_COLORS[d.score >= 9 ? "promoters" : d.score >= 7 ? "passives" : "detractors"]
                      : "var(--color-ink-2)",
                }}
              />
              <span className="text-[11.5px] text-muted tabular-nums">{d.score}</span>
            </div>
          ))}
        </div>
      </figure>
    </section>
  );
}
