"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { SocialProvider } from "@/lib/auth";
import { format, type Messages } from "@/i18n/messages";

const NAMES: Record<SocialProvider, string> = { google: "Google", github: "GitHub" };

function Mark({ provider }: { provider: SocialProvider }) {
  if (provider === "google") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.5 12.27c0-.78-.07-1.53-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.2 3.3v2.75h3.55c2.08-1.92 3.25-4.74 3.25-8.08Z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.75c-.99.66-2.25 1.05-3.73 1.05-2.87 0-5.3-1.94-6.17-4.54H2.16v2.84A11 11 0 0 0 12 23Z" />
        <path fill="#FBBC05" d="M5.83 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.16a11 11 0 0 0 0 9.88l3.67-2.84Z" />
        <path fill="#EA4335" d="M12 5.36c1.62 0 3.07.56 4.21 1.65l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.16 7.06L5.83 9.9C6.7 7.3 9.13 5.36 12 5.36Z" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1.5a10.5 10.5 0 0 0-3.32 20.46c.53.1.72-.23.72-.5v-1.8c-2.92.63-3.54-1.4-3.54-1.4-.48-1.22-1.17-1.54-1.17-1.54-.95-.65.08-.64.08-.64 1.05.08 1.6 1.08 1.6 1.08.94 1.6 2.46 1.14 3.06.87.1-.68.37-1.14.66-1.4-2.33-.27-4.78-1.17-4.78-5.2 0-1.14.41-2.08 1.08-2.81-.1-.27-.47-1.34.1-2.79 0 0 .88-.28 2.89 1.08a10 10 0 0 1 5.26 0c2-1.36 2.88-1.08 2.88-1.08.58 1.45.21 2.52.1 2.79.68.73 1.08 1.67 1.08 2.81 0 4.04-2.46 4.93-4.8 5.19.38.33.71.97.71 1.96v2.9c0 .28.19.61.73.5A10.5 10.5 0 0 0 12 1.5Z"
      />
    </svg>
  );
}

/** "Continue with Google / GitHub". The provider sends the user back to `target` once signed in. */
export function SocialButtons({ providers, t, target, error }: { providers: SocialProvider[]; t: Messages; target: string; error?: string }) {
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [failed, setFailed] = useState<SocialProvider | null>(null);
  if (providers.length === 0) return null;

  async function go(provider: SocialProvider) {
    setPending(provider);
    setFailed(null);
    const result = await authClient.signIn.social({
      provider,
      callbackURL: target,
      newUserCallbackURL: target,
      errorCallbackURL: `/sign-in?error=${provider}`,
    });
    if (result?.error) {
      setPending(null);
      setFailed(provider);
    }
  }

  const failedProvider = failed ?? (error === "google" || error === "github" ? error : null);
  return (
    <div className="grid gap-2.5">
      {providers.map((provider) => (
        <button key={provider} type="button" className="btn-quiet h-11 w-full" disabled={pending !== null} onClick={() => go(provider)}>
          <Mark provider={provider} />
          {pending === provider ? t.common.loading : format(t.auth.continueWith, { provider: NAMES[provider] })}
        </button>
      ))}
      {failedProvider && (
        <p role="alert" className="rounded-lg bg-problem-soft px-3 py-2 text-[13.5px] text-problem-ink">
          {format(t.auth.socialFailed, { provider: NAMES[failedProvider] })}
        </p>
      )}
      <div className="my-2 flex items-center gap-3 text-[12.5px] text-faint" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        {t.auth.orEmail}
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
