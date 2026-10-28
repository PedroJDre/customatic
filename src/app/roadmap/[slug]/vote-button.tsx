"use client";

import { useOptimistic, useTransition } from "react";
import { vote } from "@/server/actions";

export function VoteButton({ id, slug, votes, label, accent }: { id: string; slug: string; votes: number; label: string; accent: string }) {
  const [pending, start] = useTransition();
  const [count, bump] = useOptimistic(votes, (n: number) => n + 1);
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`${label} (${count})`}
      onClick={() =>
        start(async () => {
          bump(null);
          await vote(id, slug);
        })
      }
      className="grid h-12 w-11 shrink-0 place-items-center rounded-lg border border-line text-[13px] font-bold tabular-nums hover:border-current"
      style={{ color: accent }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
        <path d="M6 2 11 8H1Z" fill="currentColor" />
      </svg>
      <span className="-mt-1 text-ink">{count}</span>
    </button>
  );
}
