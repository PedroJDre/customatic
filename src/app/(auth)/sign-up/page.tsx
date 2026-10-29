import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMessages } from "@/i18n/server";
import { getSession } from "@/server/access";
import { enabledSocialProviders } from "@/lib/auth";
import { AuthForm } from "../auth-form";
import { SocialButtons } from "../social-buttons";

export const metadata: Metadata = { title: "Create account" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const target = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (await getSession()) redirect(next?.startsWith("/") ? next : "/dashboard");
  const { t } = await getMessages();
  return (
    <>
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em]">{t.auth.signUpTitle}</h1>
      <p className="mt-2 mb-7 text-[15px] text-muted">{t.auth.signUpLead}</p>
      <SocialButtons providers={enabledSocialProviders()} t={t} target={target} error={error} />
      <AuthForm mode="sign-up" t={t} next={next} />
    </>
  );
}
