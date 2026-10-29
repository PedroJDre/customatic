import { getMessages } from "@/i18n/server";
import { requireApp } from "@/server/access";
import { Tabs } from "./tabs";

export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const [{ app }, { t }] = await Promise.all([requireApp(appId), getMessages()]);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface px-5 pt-5 sm:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">{app.name}</h1>
          {app.roadmapEnabled && (
            <a href={`/roadmap/${app.slug}`} target="_blank" className="inline-flex min-h-8 items-center text-[13.5px] font-semibold text-brand hover:underline">
              {t.nav.roadmap}
            </a>
          )}
        </div>
        <Tabs
          appId={app.id}
          tabs={[
            { href: "", label: t.nav.inbox },
            { href: "/analytics", label: t.nav.analytics },
            { href: "/install", label: t.nav.install },
            { href: "/settings", label: t.nav.settings },
          ]}
        />
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
