"use client";

import { useSyncExternalStore } from "react";

const options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };
const noop = () => () => {};

/**
 * A date in the viewer's own time zone. The server doesn't know it, so the server render and
 * hydration use UTC, and the browser switches to local time right after. Rendering local time
 * on the server would make React's hydration fail (error #418).
 */
export function LocalTime({ date, locale }: { date: Date | string; locale: string }) {
  const d = typeof date === "string" ? new Date(date) : date;
  const inBrowser = useSyncExternalStore(noop, () => true, () => false);
  const text = inBrowser
    ? new Intl.DateTimeFormat(locale, options).format(d)
    : `${new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(d)} UTC`;
  return <time dateTime={d.toISOString()}>{text}</time>;
}
