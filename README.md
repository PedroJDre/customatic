<p align="center">
  <img src="docs/landing.png" alt="Customatic: a feedback button on your site and a shared inbox for your team" width="900">
</p>

# Customatic

**[Live demo →](https://customatic.vercel.app)**

**An open-source feedback widget for web apps.** One script tag puts a feedback button on your site. Users report problems, ideas and comments in a few seconds, and every report reaches your team with the page, the device and a screenshot.

[![CI](https://github.com/PedroJDre/customatic/actions/workflows/ci.yml/badge.svg)](https://github.com/PedroJDre/customatic/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Postgres](https://img.shields.io/badge/Postgres-4169E1?logo=postgresql&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

```html
<script src="https://your-customatic.com/widget.js" data-app-id="app_..." async></script>
```

## What you get

**For your users: a widget that stays out of the way**
- A floating button. Users pick **problem**, **idea** or **comment**, type, and send. No account needed.
- One-click **page capture**, or they can attach their own image.
- Speaks **English and Spanish**, picked from the visitor's browser.
- **16 KB** (6 KB gzipped), no dependencies, and isolated in a Shadow DOM, so your CSS can't break it and it can't break your page. The capture code only loads when someone uses it.

**For your team: one inbox**
- Feedback sorted by type, with search across messages, emails, pages and `#numbers`.
- Each report shows the **page URL, browser, OS, device, screen size, language, screenshot**, plus any data your app passes.
- **To do → In progress → Done**, with a teammate assigned.
- **Reply by email** from the dashboard, with the thread saved.
- **Analytics**: reports per day, pages with the most problems, devices, and median time to resolve.
- **Public roadmap**: publish ideas, show what's planned and shipped, and let visitors vote.
- **Sign in with Google, GitHub or email**, plus **workspaces and teammates** through email invitations.

| Widget | Inbox | Analytics |
| --- | --- | --- |
| ![Widget](docs/widget.png) | ![Inbox](docs/inbox.png) | ![Analytics](docs/analytics.png) |

**Made for phones too.** On small screens the widget opens as a bottom sheet, fields are sized so iOS doesn't zoom in, and it stays clear of the home bar. The dashboard works on a phone as well, so you can triage from anywhere.

![Customatic on a phone: the widget as a bottom sheet, a report with a screenshot, and the inbox](docs/mobile.png)

## Quick start

You need Node.js 20.9+.

```bash
git clone https://github.com/PedroJDre/customatic.git
cd customatic
npm install
cp .env.example .env.local     # set BETTER_AUTH_SECRET (openssl rand -base64 32)
npm run dev
```

Open http://localhost:3000, create an account and an app, and paste the snippet from the **Install** tab into any page. `localhost` is always allowed, so you can test before going live.

**No database setup needed.** Without `DATABASE_URL`, Customatic uses [PGlite](https://pglite.dev), a full Postgres compiled to WebAssembly that stores data in `./.data`. Point `DATABASE_URL` at a real Postgres for production.

To see a filled inbox right away, stop the dev server and run `npm run seed:demo`. It adds 30 days of sample feedback to your first app.

## Deploy

**Vercel + Postgres**
1. Import the repo in Vercel and add a Postgres database (Neon, Supabase or any other). Make sure its connection string is set as `DATABASE_URL`.
2. Add `BETTER_AUTH_SECRET`, plus `SMTP_URL` and `EMAIL_FROM` if you want emails.
3. Deploy. Migrations run during the build (`vercel-build`).

**Docker**
```bash
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" > .env
docker compose up -d      # Customatic + Postgres on http://localhost:3000
```
Or just the app with the embedded database: `docker build -t customatic . && docker run -p 3000:3000 -e BETTER_AUTH_SECRET=... -v customatic-data:/app/.data customatic`.

### Configuration

| Variable | Required | What it does |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Yes | Signs sessions. A random string of at least 32 characters. |
| `APP_URL` | In production | Public URL, used in emails and the install snippet. |
| `DATABASE_URL` | No | `postgres://...` for Postgres. Empty uses PGlite in `./.data`. |
| `SMTP_URL` | No | Any SMTP server (`smtps://user:pass@smtp.resend.com:465`). Without it, replies and invitations are saved and logged, but not emailed. |
| `EMAIL_FROM` | No | Sender, e.g. `Customatic <feedback@yourdomain.com>`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Adds "Continue with Google". Redirect URI: `<APP_URL>/api/auth/callback/google`. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | No | Adds "Continue with GitHub". Callback URL: `<APP_URL>/api/auth/callback/github`. |

Social sign-in buttons only appear for providers with credentials. Signing in with Google or GitHub using the same email as an existing account joins that account.

## Widget API

```js
// Attach who is writing (optional). The email prefills the form; other fields show up on each report.
window.Customatic?.identify({ email: user.email, id: user.id, plan: user.plan });

// Open the panel from your own button, optionally on a type.
window.Customatic?.open("problem");
```

Script tag options: `data-app-id` (required), `data-lang="en|es"` to force a language, `data-position="left|right"` to override the app's setting, and `data-api` to send reports to a different host than the one serving the script.

If your site has its own fixed bar or chat button at the bottom, lift the feedback button above it with a CSS variable:

```css
body.has-buy-bar #customatic-widget { --customatic-bottom: 88px; }
``` Color, position, button text and whether to ask for an email are set per app in **Settings**.

The **Install** tab also gives you a ready-made prompt for Claude Code, Cursor or any coding assistant, with your app ID already filled in.

### HTTP API

`POST /api/v1/feedback` (CORS enabled, no auth; the app ID plus allowed domains decide who can send)

```json
{
  "appId": "app_...",
  "type": "problem",
  "message": "The pay button does nothing",
  "email": "joe@example.com",
  "page": { "url": "https://acme.com/checkout", "title": "Checkout" },
  "metadata": { "plan": "pro" },
  "screenshot": "data:image/jpeg;base64,..."
}
```

## Security and privacy

- **Allowed domains** per app: reports from other sites are rejected. `localhost` is always allowed for testing.
- **Rate limits** per visitor and per app, stored in Postgres, so they work on serverless too. Plus a honeypot field against bots.
- **Screenshots are checked byte by byte** to be real PNG, JPEG or WebP images, limited to 2 MB, and only visible to members of the app's workspace.
- **Workspace isolation**: every dashboard query and action checks that you belong to the app's workspace. Unknown app IDs return 404, so they can't be probed.
- Your users' feedback lives in **your database**.

## How it's built

- **Next.js 16** (App Router, server actions) + **TypeScript** + **Tailwind CSS 4**
- **Postgres** through **Drizzle ORM**: PGlite locally, any Postgres in production
- **Better Auth** for email, Google and GitHub sign-in, workspaces and invitations
- The widget is plain TypeScript bundled with **esbuild**. Page capture uses `modern-screenshot`, loaded on demand.
- **Vitest** tests run against a real Postgres (PGlite in memory): validation, allowed domains, rate limits, screenshots, inbox filters, analytics and the roadmap.

```
src/widget/            the embeddable widget (→ public/widget.js)
src/server/ingest.ts   validation and storage of incoming feedback
src/server/queries.ts  inbox, analytics, roadmap
src/server/actions.ts  dashboard actions (status, replies, settings, team)
src/app/               landing, dashboard, public roadmap, API routes
src/db/                schema and migrations (drizzle/)
```

```bash
npm test            # unit and integration tests
npm run typecheck
npm run lint
```

## License

MIT. Built by [Pedro Dreyer](https://www.linkedin.com/in/pedro-dreyer/) at [Loopers](https://loopersarg.com).
