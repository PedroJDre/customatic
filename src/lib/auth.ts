import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { db, schema } from "@/db";
import { sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/url";

export const auth = betterAuth({
  appName: "Customatic",
  baseURL: appUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
  // Google and GitHub sign-in turn on when their credentials are set (see .env.example).
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, prompt: "select_account" as const } }
      : {}),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? { github: { clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET } }
      : {}),
  },
  // Signing in with Google or GitHub using the same email joins the existing account instead of creating another.
  account: { accountLinking: { enabled: true, trustedProviders: ["google", "github"] } },
  session: { cookieCache: { enabled: true, maxAge: 60 * 5 } },
  plugins: [
    // Workspaces: every app belongs to one, and teammates are its members.
    organization({
      allowUserToCreateOrganization: true,
      invitationExpiresIn: 60 * 60 * 24 * 7,
      async sendInvitationEmail({ email, inviter, organization: org, id }) {
        const link = `${appUrl()}/invite/${id}`;
        await sendEmail({
          to: email,
          subject: `${inviter.user.name} invited you to ${org.name} on Customatic`,
          text: `${inviter.user.name} invited you to review user feedback for ${org.name}.\n\nAccept the invitation: ${link}\n\nThe link expires in 7 days.`,
        });
      },
    }),
    nextCookies(), // must be last: lets server actions set the session cookie
  ],
});

export type Session = typeof auth.$Infer.Session;

export type SocialProvider = "google" | "github";

/** Providers with credentials on this install, in the order the buttons are shown. */
export function enabledSocialProviders(): SocialProvider[] {
  const list: SocialProvider[] = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) list.push("google");
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) list.push("github");
  return list;
}
