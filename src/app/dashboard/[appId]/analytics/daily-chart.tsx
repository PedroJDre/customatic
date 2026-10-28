"use client";

import { useState } from "react";

type Day = { day: string; problem: number; suggestion: number; comment: number };
type Labels = { problem: string; suggestion: string; comment: string };

const SERIES = [
  { key: "problem", color: "var(--color-problem)" },
  { key: "suggestion", color: "var(--color-idea)" },
  { key: "comment", color: "var(--color-comment)" },
] as const;

/** Stacked daily bars by feedback type. Hover (or focus) a day to read its numbers. */
export function DailyChart({ data, labels, locale, title, tableLabel, dayLabel }: { data: Day[]; labels: Labels; locale: string; title: string; tableLabel: string; dayLabel: string }) {
  const [active, setActive] = useState<number | null>(null);
  const W = 720;
  const H = 200;
  const pad = { top: 12, right: 8, bottom: 24, left: 28 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const totals = data.map((d) => d.problem + d.suggestion + d.comment);
  const max = Math.max(4, ...totals);
  const niceMax = Math.ceil(max / 4) * 4;
  const step = innerW / data.length;
  const barW = Math.max(4, Math.min(18, step - 4));
  const y = (v: number) => pad.top + innerH - (v / niceMax) * innerH;
  const ticks = [0, niceMax / 2, niceMax];
  const fmtDay = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
  const a = active === null ? null : data[active];

  return (
    <figure className="m-0">
      <figcaption className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1">
        <span className="text-[15px] font-bold">{title}</span>
        <span className="flex gap-4 text-[12.5px] text-muted" aria-hidden>
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />
              {labels[s.key]}
            </span>
          ))}
        </span>
      </figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={title} onMouseLeave={() => setActive(null)}>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={pad.left} x2={W - pad.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-line)" strokeDasharray={tick === 0 ? undefined : "3 4"} />
              <text x={pad.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--color-faint)">{tick}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = pad.left + i * step + (step - barW) / 2;
            let acc = 0;
            const segments = SERIES.filter((s) => d[s.key] > 0);
            return (
              <g key={d.day} opacity={active === null || active === i ? 1 : 0.45}>
                {segments.map((s, j) => {
                  const v = d[s.key];
                  const top = y(acc + v);
                  const height = y(acc) - top;
                  acc += v;
                  const isTop = j === segments.length - 1;
                  // 2px surface gap between stacked segments; only the top of the stack is rounded.
                  const gap = j > 0 ? 2 : 0;
                  return isTop ? (
                    <path
                      key={s.key}
                      d={roundedTop(x, top, barW, Math.max(0, height - gap), Math.min(4, barW / 2, height - gap))}
                      fill={s.color}
                    />
                  ) : (
                    <rect key={s.key} x={x} y={top} width={barW} height={Math.max(0, height - gap)} fill={s.color} />
                  );
                })}
                {/* Hit area wider than the bar */}
                <rect
                  x={pad.left + i * step}
                  y={pad.top}
                  width={step}
                  height={innerH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${fmtDay(d.day)}: ${labels.problem} ${d.problem}, ${labels.suggestion} ${d.suggestion}, ${labels.comment} ${d.comment}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                />
              </g>
            );
          })}
          {[0, Math.floor(data.length / 2), data.length - 1].map((i) => (
            <text key={i} x={pad.left + i * step + step / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--color-faint)">
              {fmtDay(data[i].day)}
            </text>
          ))}
        </svg>
        {a && active !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-[150px] rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] shadow-[0_8px_24px_-8px_rgba(20,23,51,.25)]"
            style={{
              left: `${((pad.left + active * step + step / 2) / W) * 100}%`,
              transform: active > data.length * 0.6 ? "translateX(calc(-100% - 10px))" : "translateX(10px)",
            }}
          >
            <p className="mb-1 font-semibold">{fmtDay(a.day)}</p>
            {SERIES.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-4 text-ink-2">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-[2px]" style={{ background: s.color }} />
                  {labels[s.key]}
                </span>
                <b className="font-semibold text-ink tabular-nums">{a[s.key]}</b>
              </p>
            ))}
          </div>
        )}
      </div>
      <details className="mt-2 text-[12.5px] text-muted">
        <summary className="cursor-pointer">{tableLabel}</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead>
            <tr><th className="font-semibold">{dayLabel}</th><th>{labels.problem}</th><th>{labels.suggestion}</th><th>{labels.comment}</th></tr>
          </thead>
          <tbody>
            {data.filter((d) => d.problem + d.suggestion + d.comment > 0).map((d) => (
              <tr key={d.day}><td>{fmtDay(d.day)}</td><td>{d.problem}</td><td>{d.suggestion}</td><td>{d.comment}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return "";
  r = Math.max(0, Math.min(r, h));
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
