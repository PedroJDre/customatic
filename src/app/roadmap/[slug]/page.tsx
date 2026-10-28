import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { apps, type FeedbackStatus } from "@/db/schema";
import { LangSwitch } from "@/components/lang-switch";
import { format } from "@/i18n/messages";
import { getMessages } from "@/i18n/server";
import { roadmapItems } from "@/server/queries";
import { VoteButton } from "./vote-button";

async function findApp(slug: string) {
  const [app] = await db.select().from(apps).where(eq(apps.slug, slug)).limit(1);
  return app?.roadmapEnabled ? app : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const app = await findApp((await params).slug);
  return { title: app ? `${app.name} roadmap` : "Roadmap" };
}

const COLUMNS: FeedbackStatus[] = ["todo", "in_progress", "done"];

export default async function RoadmapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = await findApp(slug);
  if (!app) notFound();
  const [{ t, locale }, items] = await Promise.all([getMessages(), roadmapItems(db, app.id)]);
  const accent = app.widget.color;

  return (
    <main className="mx-auto max-w-[1080px] px-5 py-10 sm:px-8">
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-tight font-bold tracking-[-0.025em]">{format(t.roadmap.title, { app: app.name })}</h1>
          <p className="mt-2 max-w-[56ch] text-[16px] text-muted">{t.roadmap.lead}</p>
        </div>
        <LangSwitch locale={locale} />
      </header>
      {items.length === 0 ? (
        <p className="card p-10 text-center text-muted">{t.roadmap.empty}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {COLUMNS.map((status) => {
            const column = items.filter((i) => i.status === status);
            return (
              <section key={status} aria-labelledby={`col-${status}`}>
                <h2 id={`col-${status}`} className="mb-3 flex items-center gap-2 text-[15px] font-bold">
                  {t.roadmap.columns[status]}
                  <span className="text-[13px] font-semibold text-faint">{column.length}</span>
                </h2>
                <ul className="grid gap-2.5">
                  {column.map((item) => (
                    <li key={item.id} className="card flex items-start gap-3 p-4">
                      <VoteButton id={item.id} slug={app.slug} votes={item.votes} label={t.roadmap.vote} accent={accent} />
                      <p className="pt-1 text-[14.5px] leading-snug">{item.title}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      <footer className="mt-16 text-center text-[12.5px] text-faint">
        <a href="https://github.com/PedroJDre/customatic" className="hover:text-ink-2">Powered by Customatic</a>
      </footer>
    </main>
  );
}
