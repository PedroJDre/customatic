import type { Messages } from "@/i18n/messages";

type Survey = "nps" | "csat" | "ces";
const MAX: Record<Survey, number> = { nps: 10, csat: 5, ces: 7 };

/** NPS groups: 9–10 promoters, 7–8 passives, 0–6 detractors. */
export function npsGroup(score: number): "promoter" | "passive" | "detractor" {
  return score >= 9 ? "promoter" : score >= 7 ? "passive" : "detractor";
}

/** "NPS 9 · Promoter", "CSAT 4/5", "CES 6/7". The color is a mark next to the text, never the text itself. */
export function ScoreBadge({ survey, score, t, large = false }: { survey: Survey; score: number; t: Messages; large?: boolean }) {
  const ratio = survey === "nps" ? score / 10 : (score - 1) / (MAX[survey] - 1);
  const mark = ratio >= 0.75 ? "var(--color-comment)" : ratio >= 0.5 ? "var(--color-faint)" : "var(--color-problem)";
  const detail = survey === "nps" ? t.surveys[npsGroup(score)] : `${score}/${MAX[survey]}`;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md bg-line-2 font-semibold text-ink-2 ${large ? "h-8 px-2.5 text-[14px]" : "h-[22px] px-2 text-[12px]"}`}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: mark }} aria-hidden />
      {t.surveys[survey]} {survey === "nps" ? score : ""}
      <span className="font-normal text-muted">{survey === "nps" ? `· ${detail}` : detail}</span>
    </span>
  );
}
