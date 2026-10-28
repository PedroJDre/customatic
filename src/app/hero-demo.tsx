"use client";

import { useState } from "react";
import { TypeIcon } from "@/components/type-badge";

type Type = "problem" | "suggestion" | "comment";
type Item = { type: Type; text: string; who: string; page: string; device: string; fresh?: boolean };
type Copy = {
  site: string;
  siteTitle: string;
  siteLine: string;
  tryIt: string;
  inbox: string;
  live: string;
  typeHere: string;
  send: string;
  sent: string;
  you: string;
  seed: readonly { type: string; text: string; who: string; page: string; device: string }[];
};

const COLOR: Record<Type, string> = { problem: "var(--color-problem)", suggestion: "var(--color-idea)", comment: "var(--color-comment)" };
const SOFT: Record<Type, string> = { problem: "var(--color-problem-soft)", suggestion: "var(--color-idea-soft)", comment: "var(--color-comment-soft)" };
const INK: Record<Type, string> = { problem: "var(--color-problem-ink)", suggestion: "var(--color-idea-ink)", comment: "var(--color-comment-ink)" };

/** The hero: a working copy of the widget next to a tiny inbox. Nothing is sent anywhere. */
export function HeroDemo({ copy, types, button }: { copy: Copy; types: Record<Type, string>; button: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<Type>("problem");
  const [text, setText] = useState("");
  const [items, setItems] = useState<Item[]>(copy.seed.map((s) => ({ ...s, type: s.type as Type })));
  const [sent, setSent] = useState(false);

  function send(event: React.FormEvent) {
    event.preventDefault();
    if (text.trim().length < 2) return;
    setItems((list) => [{ type, text: text.trim(), who: copy.you, page: "/checkout", device: "Desktop", fresh: true }, ...list.map((i) => ({ ...i, fresh: false }))].slice(0, 5));
    setText("");
    setSent(true);
    setOpen(false);
  }

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] sm:items-start">
      {/* The customer's site, with the widget */}
      <div className="relative h-[400px] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_60px_-30px_rgba(20,23,51,.35)]">
        <div className="flex items-center gap-1.5 border-b border-line-2 bg-canvas px-3 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d8dbe6]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d8dbe6]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#d8dbe6]" />
          <span className="ml-2 truncate rounded-md bg-surface px-2.5 py-0.5 text-[12px] text-muted">{copy.site}</span>
        </div>
        <div className="p-5">
          <p className="text-[15px] font-bold">{copy.siteTitle}</p>
          <div className="mt-3 grid gap-2" aria-hidden>
            <div className="h-3 w-3/4 rounded bg-line-2" />
            <div className="h-3 w-1/2 rounded bg-line-2" />
            <div className="mt-2 h-16 rounded-lg bg-line-2" />
          </div>
          <p className="mt-4 text-[13px] text-muted">{sent ? copy.sent : copy.tryIt}</p>
        </div>

        {open && (
          <form onSubmit={send} className="absolute right-3 bottom-[62px] left-3 rounded-xl bg-surface p-3.5 shadow-[0_18px_40px_-12px_rgba(20,23,51,.4),0_0_0_1px_rgba(20,23,51,.08)] sm:left-auto sm:w-[280px]">
            <div className="grid grid-cols-3 gap-1.5" role="group">
              {(Object.keys(types) as Type[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={type === t}
                  onClick={() => setType(t)}
                  className="flex flex-col items-center gap-1 rounded-lg border-[1.5px] border-line py-2 text-[12px] font-semibold text-ink-2 aria-pressed:border-brand aria-pressed:text-ink"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-md" style={{ background: SOFT[t], color: INK[t] }}>
                    <TypeIcon type={t} size={15} />
                  </span>
                  {types[t]}
                </button>
              ))}
            </div>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder={copy.typeHere}
              aria-label={copy.typeHere}
              className="textarea mt-2.5 text-[13.5px]"
            />
            <button className="btn-primary mt-2 h-9 w-full" disabled={text.trim().length < 2}>{copy.send}</button>
          </form>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="absolute right-3 bottom-3 inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-[13.5px] font-semibold text-white shadow-[0_6px_18px_-6px_var(--color-brand)]"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6A.5.5 0 0 1 5 19.2V16h-.5A2.5 2.5 0 0 1 2 13.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          {button}
        </button>
      </div>

      {/* Your inbox */}
      <div className="rounded-2xl border border-[#262a4d] bg-[#151833] p-3 text-white shadow-[0_30px_60px_-30px_rgba(20,23,51,.5)]">
        <div className="flex items-center justify-between px-1.5 pt-0.5 pb-2.5">
          <span className="text-[13px] font-semibold">{copy.inbox}</span>
          <span className="flex items-center gap-1.5 text-[12px] text-white/60">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5eead4]" aria-hidden />
            {copy.live}
          </span>
        </div>
        <ul className="grid gap-1.5" aria-live="polite">
          {items.map((item, i) => (
            <li
              key={`${item.text}-${i}`}
              className={`relative rounded-lg bg-white/[.06] py-2.5 pr-3 pl-4 ${item.fresh ? "animate-[drop_.45s_ease-out]" : ""}`}
            >
              <span className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-r" style={{ background: COLOR[item.type] }} aria-hidden />
              <p className="flex items-center gap-2 text-[11.5px] text-white/55">
                <span className="font-semibold text-white/85">{types[item.type]}</span>
                <span className="truncate">{item.page}</span>
                <span className="ml-auto shrink-0">{item.device}</span>
              </p>
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-white">{item.text}</p>
              <p className="mt-0.5 text-[11.5px] text-white/50">{item.who}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
