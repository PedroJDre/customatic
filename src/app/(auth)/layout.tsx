import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { Logo } from "@/components/logo";
import { getLocale } from "@/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" aria-label="Customatic home"><Logo /></Link>
        <LangSwitch locale={locale} />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-[8vh] pb-16">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}
