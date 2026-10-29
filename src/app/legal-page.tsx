import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { Logo } from "@/components/logo";
import { getLocale } from "@/i18n/server";

export type LegalDoc = { title: string; updated: string; sections: { heading: string; body: string[] }[] };

/** Shared layout for the privacy policy and terms. Plain, readable text. */
export async function LegalPage({ docs }: { docs: Record<"en" | "es", LegalDoc> }) {
  const locale = await getLocale();
  const doc = docs[locale];
  return (
    <div className="min-h-dvh bg-surface">
      <header className="mx-auto flex max-w-[760px] items-center justify-between px-5 py-5">
        <Link href="/" aria-label="Customatic"><Logo /></Link>
        <LangSwitch locale={locale} />
      </header>
      <main className="mx-auto max-w-[680px] px-5 pt-8 pb-20">
        <h1 className="text-[32px] leading-tight font-bold tracking-[-0.025em]">{doc.title}</h1>
        <p className="mt-2 text-[14px] text-muted">{doc.updated}</p>
        {doc.sections.map((section) => (
          <section key={section.heading} className="mt-9">
            <h2 className="text-[18px] font-bold">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-[15.5px] leading-relaxed text-ink-2">{paragraph}</p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
