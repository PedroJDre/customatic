import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMessages } from "@/i18n/server";
import { getSession } from "@/server/access";
import { enabledSocialProviders } from "@/lib/auth";
import { AuthForm } from "../auth-form";
import { SocialButtons } from "../social-buttons";

export const metadata: Metadata = { title: "Sign in" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; provider?: string }> }) {
  const { next, error, provider } = await searchParams;
  const target = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (await getSession()) redirect(next?.startsWith("/") ? next : "/dashboard");
  const { t } = await getMessages();
  return (
    <>
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em]">{t.auth.signInTitle}</h1>
      <div className="mb-7" />
      <SocialButtons providers={enabledSocialProviders()} t={t} target={target} error={error} provider={provider} />
      <AuthForm mode="sign-in" t={t} next={next} />
    </>
  );
}
