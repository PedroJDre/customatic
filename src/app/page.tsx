import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { Logo } from "@/components/logo";
import { TypeIcon } from "@/components/type-badge";
import { landing } from "@/i18n/landing";
import { getMessages } from "@/i18n/server";
import { getSession } from "@/server/access";
import { HeroDemo } from "./hero-demo";

const GITHUB = "https://github.com/PedroJDre/customatic";

export default async function Home() {
  const [{ locale, t }, session] = await Promise.all([getMessages(), getSession()]);
  const l = landing[locale];
  const types = { problem: t.types.problem, suggestion: t.types.suggestion, comment: t.types.comment };

  return (
    <div className="bg-surface">
      <header className="mx-auto flex max-w-[1180px] items-center gap-6 px-5 py-4 sm:px-8">
        <Link href="/" aria-label="Customatic"><Logo /></Link>
        <nav className="hidden gap-6 text-[14px] font-medium text-ink-2 md:flex">
          <a href="#how" className="hover:text-ink">{l.nav.how}</a>
          <a href="#self-host" className="hover:text-ink">{l.nav.selfHost}</a>
          <a href={GITHUB} className="hover:text-ink">{l.nav.github}</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LangSwitch locale={locale} className="hidden sm:inline-flex" />
          {session ? (
            <Link href="/dashboard" className="btn-primary h-9 px-3.5">Dashboard</Link>
          ) : (
            <>
              <Link href="/sign-in" className="btn h-9 px-3 text-ink-2 hover:text-ink">{t.common.signIn}</Link>
              <Link href="/sign-up" className="btn-primary hidden h-9 px-3.5 sm:inline-flex">{t.common.signUp}</Link>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1180px] gap-12 px-5 pt-10 pb-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pt-16">
          <div className="min-w-0">
            <h1 className="text-[40px] leading-[1.05] font-bold tracking-[-0.035em] text-balance sm:text-[54px]">{l.hero.title}</h1>
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-ink-2">{l.hero.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sign-up" className="btn-primary h-12 px-6 text-[15px]">{l.hero.primary}</Link>
              <a href="#self-host" className="btn-quiet h-12 px-6 text-[15px]">{l.hero.secondary}</a>
            </div>
            <p className="mt-4 text-[13.5px] text-muted">{l.hero.note}</p>
          </div>
          <HeroDemo copy={l.demo} types={types} button={locale === "es" ? "Opinar" : "Feedback"} />
        </section>

        <section id="how" className="border-y border-line bg-canvas">
          <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8">
            <h2 className="max-w-[20ch] text-[32px] leading-tight font-bold tracking-[-0.025em]">{l.steps.title}</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-3">
              {l.steps.items.map((step, i) => (
                <li key={step.title} className="relative min-w-0 pt-10">
                  <span className="absolute top-0 left-0 text-[44px] leading-none font-bold tracking-[-0.04em] text-[#d6d9e6]" aria-hidden>{i + 1}</span>
                  <h3 className="text-[18px] font-bold">{step.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{step.body}</p>
                  {i === 0 && (
                    <code className="mt-4 block overflow-x-auto rounded-lg bg-[#151833] px-3 py-2.5 text-[12.5px] whitespace-nowrap text-[#e6e8ff]">
                      {'<script src="…/widget.js" data-app-id="app_…" async></script>'}
                    </code>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1180px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-[32px] leading-tight font-bold tracking-[-0.025em]">{l.context.title}</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{l.context.lead}</p>
          </div>
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {l.context.items.map((item) => (
              <div key={item.title} className="border-t-2 border-ink pt-4">
                <dt className="text-[16px] font-bold">{item.title}</dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{item.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="bg-[#151833] text-white">
          <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <h2 className="max-w-[22ch] text-[32px] leading-tight font-bold tracking-[-0.025em]">{l.features.title}</h2>
              <div className="flex gap-2" aria-hidden>
                {(["problem", "suggestion", "comment"] as const).map((type) => (
                  <span key={type} className="grid h-11 w-11 place-items-center rounded-xl bg-white/[.07]" style={{ color: `var(--color-${type === "suggestion" ? "idea" : type})` }}>
                    <TypeIcon type={type} size={20} />
                  </span>
                ))}
              </div>
            </div>
            <ul className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {l.features.items.map((f) => (
                <li key={f.title}>
                  <h3 className="text-[16.5px] font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-white/70">{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="self-host" className="mx-auto grid max-w-[1180px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-[32px] leading-tight font-bold tracking-[-0.025em]">{l.selfHost.title}</h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-2">{l.selfHost.lead}</p>
            <a href={GITHUB} className="btn-quiet mt-7 h-11 px-5">{l.selfHost.cta}</a>
          </div>
          <div className="min-w-0">
            <pre className="overflow-x-auto rounded-2xl bg-[#151833] p-5 text-[13.5px] leading-[1.9] text-[#e6e8ff]">
              <code>
                <span className="text-white/45">$ </span>git clone https://github.com/PedroJDre/customatic{"\n"}
                <span className="text-white/45">$ </span>cd customatic && npm install{"\n"}
                <span className="text-white/45">$ </span>npm run dev
              </code>
            </pre>
            <p className="mt-3 text-[14px] text-muted">{l.selfHost.steps}</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-[13.5px] text-muted sm:px-8">
          <Logo className="opacity-80" />
          <p>{l.footer}</p>
          <nav className="flex gap-4" aria-label="Legal">
            <Link href="/privacy" className="hover:text-ink">{locale === "es" ? "Privacidad" : "Privacy"}</Link>
            <Link href="/terms" className="hover:text-ink">{locale === "es" ? "Términos" : "Terms"}</Link>
          </nav>
          <LangSwitch locale={locale} className="sm:hidden" />
        </div>
      </footer>
    </div>
  );
}
