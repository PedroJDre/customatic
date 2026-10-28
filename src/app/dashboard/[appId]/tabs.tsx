"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Tabs({ appId, tabs }: { appId: string; tabs: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mb-px flex gap-5 overflow-x-auto" aria-label="App sections">
      {tabs.map((tab) => {
        const href = `/dashboard/${appId}${tab.href}`;
        const active = tab.href === "" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={tab.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 border-b-2 pb-2.5 text-[14px] font-semibold ${active ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
