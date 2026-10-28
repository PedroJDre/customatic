/** Public base URL of this Customatic install, without a trailing slash. */
export function appUrl(): string {
  const explicit = process.env.APP_URL ?? process.env.BETTER_AUTH_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
