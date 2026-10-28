import { getMessages } from "@/i18n/server";
import { listUserApps, requireUser } from "@/server/access";
import { Sidebar } from "./sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [{ locale, t }, apps] = await Promise.all([getMessages(), listUserApps(user.id)]);
  return (
    <div className="lg:flex">
      <Sidebar
        apps={apps}
        user={{ name: user.name, email: user.email }}
        locale={locale}
        labels={{ apps: t.nav.apps, newApp: t.nav.newApp, team: t.nav.team, signOut: t.common.signOut }}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
