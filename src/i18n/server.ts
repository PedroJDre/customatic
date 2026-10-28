import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { messages, type Locale, type Messages } from "./messages";

export const LOCALE_COOKIE = "customatic_lang";

/** The visitor's choice (cookie) or their browser language. English otherwise. */
export const getLocale = cache(async (): Promise<Locale> => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (chosen === "en" || chosen === "es") return chosen;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("es") ? "es" : "en";
});

export async function getMessages(): Promise<{ locale: Locale; t: Messages }> {
  const locale = await getLocale();
  return { locale, t: messages[locale] };
}
