import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMessages } from "@/i18n/server";
import { getSession } from "@/server/access";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getSession()) redirect(next?.startsWith("/") ? next : "/dashboard");
  const { t } = await getMessages();
  return (
    <>
      <h1 className="text-[26px] leading-tight font-bold tracking-[-0.02em]">{t.auth.signInTitle}</h1>
      <div className="mb-7" />
      <AuthForm mode="sign-in" t={t} next={next} />
    </>
  );
}
