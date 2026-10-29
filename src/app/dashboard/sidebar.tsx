"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/logo";
import { LangSwitch } from "@/components/lang-switch";

type Props = {
  apps: { id: string; name: string }[];
  user: { name: string; email: string };
  locale: "en" | "es";
  labels: { apps: string; newApp: string; team: string; signOut: string };
};

export function Sidebar({ apps, user, locale, labels }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = pathname.split("/")[2];

  async function signOut() {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  const item = (active: boolean) =>
    `flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[14px] font-medium ${
      active ? "bg-surface text-ink shadow-[0_0_0_1px_var(--color-line)]" : "text-ink-2 hover:bg-white/60"
    }`;

  return (
    <aside className="flex flex-col gap-1 border-line bg-canvas px-3 py-4 lg:sticky lg:top-0 lg:h-dvh lg:w-[232px] lg:shrink-0 lg:border-r">
      <div className="flex items-center justify-between px-1.5 pb-4">
        <Link href="/dashboard" aria-label="Customatic"><Logo /></Link>
        <div className="flex items-center gap-3 lg:hidden">
          <LangSwitch locale={locale} />
          <button onClick={signOut} className="inline-flex min-h-8 items-center px-1 text-[13px] font-medium text-muted hover:text-ink">{labels.signOut}</button>
        </div>
      </div>
      <nav aria-label={labels.apps} className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        <p className="hidden px-2.5 pb-1 text-[12.5px] font-semibold text-faint lg:block">{labels.apps}</p>
        {apps.map((app) => (
          <Link key={app.id} href={`/dashboard/${app.id}`} className={`${item(app.id === activeId)} shrink-0`} aria-current={app.id === activeId ? "page" : undefined}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-brand-soft text-[12px] font-bold text-brand">
              {app.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="truncate">{app.name}</span>
          </Link>
        ))}
        <Link href="/dashboard/new" className={`${item(activeId === "new")} shrink-0 text-muted`}>
          <span className="grid h-6 w-6 place-items-center rounded-md border border-dashed border-[#c9cddd] text-[15px]" aria-hidden>+</span>
          {labels.newApp}
        </Link>
        <div className="hidden h-4 lg:block" />
        <Link href="/dashboard/team" className={`${item(activeId === "team")} shrink-0`}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="ml-0.5 text-muted">
            <circle cx="9" cy="8.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8M16 5.6a3 3 0 0 1 0 5.8M17.5 14.4c1.7.6 2.9 2.2 3.2 4.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {labels.team}
        </Link>
      </nav>
      <div className="mt-auto hidden border-t border-line pt-3 lg:block">
        <p className="truncate px-1.5 text-[13.5px] font-semibold">{user.name}</p>
        <p className="truncate px-1.5 text-[12.5px] text-muted">{user.email}</p>
        <div className="mt-3 flex items-center justify-between px-1">
          <LangSwitch locale={locale} />
          <button onClick={signOut} className="inline-flex min-h-8 items-center px-1 text-[13px] font-medium text-muted hover:text-ink">{labels.signOut}</button>
        </div>
      </div>
    </aside>
  );
}
