import type { Metadata } from "next";
import { getMessages } from "@/i18n/server";
import { appUrl } from "@/lib/url";
import { requireApp } from "@/server/access";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const [{ app }, { t }] = await Promise.all([requireApp(appId), getMessages()]);
  return (
    <main className="mx-auto max-w-[760px] px-5 py-8 sm:px-8">
      <SettingsForm app={app} t={t} roadmapUrl={`${appUrl()}/roadmap/${app.slug}`} />
    </main>
  );
}
