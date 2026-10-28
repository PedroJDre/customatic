import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { getMessages } from "@/i18n/server";
import { appUrl } from "@/lib/url";
import { requireApp } from "@/server/access";

export const metadata: Metadata = { title: "Install" };

export default async function InstallPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  const [{ app }, { t }] = await Promise.all([requireApp(appId), getMessages()]);
  const base = appUrl();
  const snippet = `<script src="${base}/widget.js" data-app-id="${app.id}" async></script>`;
  const prompt = [
    "Add the Customatic feedback widget to this project.",
    "",
    "Insert this exact script tag so it loads on every page, right before the closing </body> tag of the root layout",
    '(Next.js App Router: next/script with strategy="afterInteractive" in app/layout.tsx; Vite or CRA: index.html;',
    "Nuxt, SvelteKit or Astro: the root layout or app template):",
    "",
    snippet,
    "",
    "Keep the src and data-app-id values as they are, and don't install any npm package.",
    "If the app has signed-in users, also call window.Customatic?.identify({ email: user.email, id: user.id })",
    "after login, only in the browser.",
  ].join("\n");
  const identify = [
    "// After your user signs in (optional)",
    "window.Customatic?.identify({",
    "  email: user.email,  // prefills the email field",
    "  id: user.id,        // extra fields show up on each report",
    "  plan: user.plan,",
    "});",
    "",
    "// Open the panel from your own button (optional)",
    'window.Customatic?.open("problem");',
  ].join("\n");
  const copy = { copy: t.common.copy, copied: t.common.copied };

  return (
    <main className="mx-auto grid max-w-[760px] gap-10 px-5 py-8 sm:px-8 [&>*]:min-w-0">
      <section>
        <h2 className="text-[20px] font-bold tracking-[-0.01em]">{t.install.title}</h2>
        <p className="mt-1.5 mb-4 text-muted">{t.install.lead}</p>
        <CodeBlock code={snippet} label="HTML" {...copy} />
        <p className="hint">{t.install.works}</p>
        <p className="mt-3 text-[13.5px] text-muted">
          {t.install.appId}: <code className="rounded bg-line-2 px-1.5 py-0.5 text-ink">{app.id}</code>
        </p>
      </section>
      <section>
        <h2 className="text-[17px] font-bold">{t.install.aiTitle}</h2>
        <p className="mt-1 mb-3 text-muted">{t.install.aiLead}</p>
        <CodeBlock code={prompt} label="Prompt" {...copy} />
      </section>
      <section>
        <h2 className="text-[17px] font-bold">{t.install.apiTitle}</h2>
        <p className="mt-1 mb-3 text-muted">{t.install.apiLead}</p>
        <CodeBlock code={identify} label="JavaScript" {...copy} />
      </section>
      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-[17px] font-bold">{t.install.testTitle}</h2>
        <p className="mt-1 text-muted">{t.install.testLead}</p>
      </section>
    </main>
  );
}
