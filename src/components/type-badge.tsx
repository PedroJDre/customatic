import type { FeedbackType } from "@/db/schema";

const styles: Record<FeedbackType, string> = {
  problem: "bg-problem-soft text-problem-ink",
  suggestion: "bg-idea-soft text-idea-ink",
  comment: "bg-comment-soft text-comment-ink",
  rating: "bg-line-2 text-ink-2",
};

export const typeColor: Record<FeedbackType, string> = {
  problem: "var(--color-problem)",
  suggestion: "var(--color-idea)",
  comment: "var(--color-comment)",
  rating: "var(--color-ink-2)",
};

export function TypeBadge({ type, label }: { type: FeedbackType; label: string }) {
  return (
    <span className={`inline-flex h-[22px] items-center gap-1.5 rounded-md px-2 text-[12px] font-semibold ${styles[type]}`}>
      <TypeIcon type={type} size={13} />
      {label}
    </span>
  );
}

export function TypeIcon({ type, size = 16 }: { type: FeedbackType; size?: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {type === "problem" && (
        <>
          <path d="M12 3.5 21 19H3L12 3.5Z" {...common} />
          <path d="M12 9.5v4" {...common} />
          <circle cx="12" cy="16.4" r="1.1" fill="currentColor" />
        </>
      )}
      {type === "suggestion" && (
        <path d="M9 17.5h6M10 20.5h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" {...common} />
      )}
      {type === "rating" && (
        <>
          <path d="M4 16a8 8 0 1 1 16 0" {...common} />
          <path d="m12 16 3.5-4.5" {...common} />
          <circle cx="12" cy="16" r="1.4" fill="currentColor" />
        </>
      )}
      {type === "comment" && (
        <path d="M20 11.5c0 4-3.6 7-8 7-1.2 0-2.3-.2-3.3-.6L4 19.5l1.3-3.6A6.6 6.6 0 0 1 4 11.5c0-4 3.6-7 8-7s8 3 8 7Z" {...common} />
      )}
    </svg>
  );
}
