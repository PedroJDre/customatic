"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { Messages } from "@/i18n/messages";

export function AuthForm({ mode, t, next }: { mode: "sign-in" | "sign-up"; t: Messages; next?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const result =
      mode === "sign-up"
        ? await authClient.signUp.email({ name: String(form.get("name")), email, password })
        : await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      const code = result.error.code ?? "";
      setError(
        code.includes("ALREADY_EXISTS") ? t.auth.exists : mode === "sign-in" ? t.auth.invalid : (result.error.message ?? t.auth.failed),
      );
      return;
    }
    router.push(target);
    router.refresh();
  }

  const otherHref = `${mode === "sign-in" ? "/sign-up" : "/sign-in"}${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate={false}>
      {mode === "sign-up" && (
        <div>
          <label className="label" htmlFor="name">{t.auth.name}</label>
          <input className="input" id="name" name="name" required autoComplete="name" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">{t.auth.email}</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">{t.auth.password}</label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
        />
        {mode === "sign-up" && <p className="hint">{t.auth.passwordHint}</p>}
      </div>
      {error && <p role="alert" className="rounded-lg bg-problem-soft px-3 py-2 text-[13.5px] text-problem-ink">{error}</p>}
      <button className="btn-primary h-11" disabled={pending}>
        {pending ? t.common.loading : mode === "sign-up" ? t.common.signUp : t.common.signIn}
      </button>
      <p className="text-center text-[13.5px] text-muted">
        {mode === "sign-in" ? t.auth.noAccount : t.auth.haveAccount}{" "}
        <Link href={otherHref} className="font-semibold text-brand underline-offset-2 hover:underline">
          {mode === "sign-in" ? t.common.signUp : t.common.signIn}
        </Link>
      </p>
    </form>
  );
}
