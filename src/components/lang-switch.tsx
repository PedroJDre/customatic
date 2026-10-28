"use client";

import { useTransition } from "react";
import { setLocale } from "@/server/actions";

export function LangSwitch({ locale, className = "" }: { locale: "en" | "es"; className?: string }) {
  const [pending, start] = useTransition();
  return (
    <div className={`inline-flex rounded-lg border border-line bg-surface p-0.5 text-[12.5px] font-semibold ${className}`} role="group" aria-label="Language / Idioma">
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          aria-pressed={locale === l}
          onClick={() => start(() => setLocale(l))}
          className="rounded-md px-2 py-1 text-muted aria-pressed:bg-ink aria-pressed:text-white"
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
