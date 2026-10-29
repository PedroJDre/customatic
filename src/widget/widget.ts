/**
 * Customatic feedback widget. Built into public/widget.js by `npm run widget:build`.
 *
 *   <script src="https://YOUR-CUSTOMATIC/widget.js" data-app-id="app_..." async></script>
 *
 * Optional JavaScript API, once loaded:
 *   Customatic.open("problem")              open the panel (optionally on a type)
 *   Customatic.identify({ email, id, plan }) prefill the email and attach data to every report
 */
import { css } from "./styles";
import { strings, type Lang } from "./i18n";

type FeedbackType = "problem" | "suggestion" | "comment";
type Settings = {
  name: string;
  color: string;
  position: "right" | "left";
  language: "auto" | Lang;
  label: string;
  askEmail: "optional" | "required" | "hidden";
  title?: string;
  subtitle?: string;
  thanksTitle?: string;
  thanksBody?: string;
};

declare global {
  interface Window {
    Customatic?: CustomaticApi;
    __customaticCapture?: (hide: HTMLElement) => Promise<string>;
  }
}

type CustomaticApi = {
  open: (type?: FeedbackType) => void;
  close: () => void;
  identify: (data: Record<string, string | number | boolean>) => void;
};

const ICONS: Record<FeedbackType | "chat" | "close" | "camera" | "image", string> = {
  chat: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6A.5.5 0 0 1 5 19.2V16h-.5A2.5 2.5 0 0 1 2 13.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 8.5h8M8 11.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  close: '<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  problem: '<path d="M12 3.5 21 19H3L12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9.5v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="16.4" r="1.1" fill="currentColor"/>',
  suggestion: '<path d="M9 17.5h6M10 20.5h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>',
  comment: '<path d="M20 11.5c0 4-3.6 7-8 7-1.2 0-2.3-.2-3.3-.6L4 19.5l1.3-3.6A6.6 6.6 0 0 1 4 11.5c0-4 3.6-7 8-7s8 3 8 7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12.8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m4 17 5-5 4 4 2.5-2.5L20 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15.5" cy="9" r="1.5" fill="currentColor"/>',
};

const icon = (name: keyof typeof ICONS, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Downscale to at most 1600px wide and re-encode, so screenshots stay small. */
async function shrink(dataUrl: string): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const scale = Math.min(1, 1600 / img.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

// document.currentScript is only set while this file first runs, so read it now, not in boot().
const loadingScript = document.currentScript as HTMLScriptElement | null;

function boot() {
  const script =
    loadingScript ??
    document.querySelector<HTMLScriptElement>("script[data-app-id][src*='widget']");
  const appId = script?.dataset.appId;
  if (!script || !appId) {
    console.warn("[Customatic] Missing data-app-id on the widget script tag.");
    return;
  }
  if (document.getElementById("customatic-widget")) return; // loaded twice
  const base = script.dataset.api ?? new URL(script.src).origin;
  const forcedSide = script.dataset.position; // data-position="left|right" overrides the app setting

  let settings: Settings = {
    name: "",
    color: "#2433F5",
    position: "right",
    language: "auto",
    label: "",
    askEmail: "optional",
  };
  let identity: Record<string, string | number | boolean> = {};
  let state: { open: boolean; type: FeedbackType | null; sending: boolean; done: boolean; error: string; shot: string | null } =
    { open: false, type: null, sending: false, done: false, error: "", shot: null };
  let justOpened = false; // play the opening animation once, not on every re-render

  const host = document.createElement("div");
  host.id = "customatic-widget";
  host.style.cssText = "position:fixed;z-index:2147483000;inset:auto;";
  const root = host.attachShadow({ mode: "open" });
  document.body.appendChild(host);

  const lang = (): Lang => {
    const forced = script.dataset.lang ?? settings.language;
    if (forced === "en" || forced === "es") return forced;
    return (navigator.language || "en").toLowerCase().startsWith("es") ? "es" : "en";
  };
  const t = () => strings[lang()];

  function render() {
    const s = t();
    const side = forcedSide === "left" || forcedSide === "right" ? forcedSide : settings.position === "left" ? "left" : "right";
    const label = settings.label || s.button;
    root.innerHTML = `<style>${css(settings.color, side)}</style>
      <div class="backdrop ${state.open ? "show" : ""}" data-action="close" aria-hidden="true"></div>
      <button class="launcher ${state.open ? "hidden" : ""}" part="launcher" aria-expanded="${state.open}" aria-controls="cm-panel"
        aria-label="${escapeHtml(state.open ? s.close : label)}">
        ${icon(state.open ? "close" : "chat", 20)}<span>${escapeHtml(state.open ? s.close : label)}</span>
      </button>
      ${state.open ? panel() : ""}`;
    if (justOpened) root.querySelector(".panel")?.classList.add("enter");
    justOpened = false;
    wire();
  }

  function panel(): string {
    const s = t();
    if (state.done) {
      return `<div class="panel" id="cm-panel" role="dialog" aria-label="${escapeHtml(settings.title || s.title)}">
        <span class="grabber" aria-hidden="true"></span>
        <header class="head"><div></div><button type="button" class="x" data-action="close" aria-label="${s.close}">${icon("close", 18)}</button></header>
        <div class="done" tabindex="-1">
          <div class="done-mark">${icon("comment", 28)}</div>
          <h2>${escapeHtml(settings.thanksTitle || s.thanks)}</h2>
          <p>${escapeHtml(settings.thanksBody || (identity.email ? s.thanksReply : s.thanksBody))}</p>
          <button class="primary" data-action="again">${s.sendAnother}</button>
        </div></div>`;
    }
    const types: FeedbackType[] = ["problem", "suggestion", "comment"];
    const typeButtons = types
      .map(
        (type) => `<button class="type type-${type}" data-type="${type}" aria-pressed="${state.type === type}">
          <span class="type-icon">${icon(type, 20)}</span><span class="type-text"><b>${s.types[type]}</b>
          <small>${s.typeHints[type]}</small></span></button>`,
      )
      .join("");
    const form = state.type
      ? `<form novalidate>
          <label class="field"><span>${s.messageLabel}</span>
            <textarea name="message" rows="4" maxlength="5000" required placeholder="${s.placeholders[state.type]}"></textarea></label>
          ${settings.askEmail === "hidden" ? "" : `<label class="field"><span>${s.emailLabel}${settings.askEmail === "required" ? "" : ` <i>${s.optional}</i>`}</span>
            <input name="email" type="email" autocomplete="email" ${settings.askEmail === "required" ? "required" : ""}
              value="${escapeHtml(String(identity.email ?? ""))}" placeholder="${s.emailPlaceholder}"></label>`}
          <div class="shot">
            ${state.shot
              ? `<figure><img src="${state.shot}" alt="${s.screenshotAlt}"><button type="button" class="link" data-action="remove-shot">${s.removeScreenshot}</button></figure>`
              : `<button type="button" class="ghost" data-action="capture">${icon("camera", 16)}${s.capture}</button>
                 <label class="ghost">${icon("image", 16)}${s.upload}<input type="file" accept="image/png,image/jpeg,image/webp" hidden></label>`}
          </div>
          <p class="error" role="alert">${escapeHtml(state.error)}</p>
          <button class="primary" type="submit" ${state.sending ? "disabled" : ""}>${state.sending ? s.sending : s.send}</button>
          <input name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
        </form>`
      : "";
    return `<div class="panel" id="cm-panel" role="dialog" aria-label="${escapeHtml(settings.title || s.title)}">
      <span class="grabber" aria-hidden="true"></span>
      <header class="head"><div><h2>${escapeHtml(settings.title || s.title)}</h2>
        <p>${escapeHtml(settings.subtitle || s.subtitle)}</p></div>
        <button type="button" class="x" data-action="close" aria-label="${s.close}">${icon("close", 18)}</button></header>
      <div class="types" role="group" aria-label="${s.pickType}">${typeButtons}</div>
      ${form}
      <footer><a href="https://github.com/PedroJDre/customatic" target="_blank" rel="noopener">${s.poweredBy}</a></footer>
    </div>`;
  }

  function wire() {
    const q = <T extends Element>(sel: string) => root.querySelector<T>(sel);
    q<HTMLButtonElement>(".launcher")!.onclick = () => (state.open ? api.close() : api.open());
    root.querySelectorAll<HTMLElement>("[data-action=close]").forEach((el) => (el.onclick = () => api.close()));
    root.querySelectorAll<HTMLButtonElement>("[data-type]").forEach((button) => {
      button.onclick = () => {
        state = { ...state, type: button.dataset.type as FeedbackType, error: "" };
        render();
        q<HTMLTextAreaElement>("textarea")?.focus();
      };
    });
    q<HTMLButtonElement>("[data-action=again]")?.addEventListener("click", () => {
      state = { ...state, done: false, type: null, shot: null };
      render();
    });
    q<HTMLButtonElement>("[data-action=remove-shot]")?.addEventListener("click", () => {
      state = { ...state, shot: null };
      keepDraft(render);
    });
    q<HTMLButtonElement>("[data-action=capture]")?.addEventListener("click", capture);
    q<HTMLInputElement>("input[type=file]")?.addEventListener("change", async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        state = { ...state, shot: await shrink(String(reader.result)) };
        keepDraft(render);
      };
      reader.readAsDataURL(file);
    });
    q<HTMLFormElement>("form")?.addEventListener("submit", submit);
    q<HTMLElement>(".done")?.focus();
  }

  /** Re-rendering replaces the form, so carry over what the user already typed. */
  function keepDraft(fn: () => void) {
    const message = root.querySelector<HTMLTextAreaElement>("textarea")?.value ?? "";
    const email = root.querySelector<HTMLInputElement>("input[name=email]")?.value;
    fn();
    const textarea = root.querySelector<HTMLTextAreaElement>("textarea");
    if (textarea) textarea.value = message;
    const emailInput = root.querySelector<HTMLInputElement>("input[name=email]");
    if (emailInput && email !== undefined) emailInput.value = email;
  }

  async function capture() {
    const s = t();
    try {
      if (!window.__customaticCapture) {
        await new Promise<void>((resolve, reject) => {
          const tag = document.createElement("script");
          tag.src = `${base}/widget-capture.js`;
          tag.onload = () => resolve();
          tag.onerror = () => reject(new Error("load"));
          document.head.appendChild(tag);
        });
      }
      const shot = await window.__customaticCapture!(host);
      state = { ...state, shot: await shrink(shot), error: "" };
    } catch {
      state = { ...state, error: s.captureFailed };
    }
    keepDraft(render);
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const s = t();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const message = String(data.get("message") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    if (message.length < 2) {
      state = { ...state, error: s.errors.message };
      return keepDraft(render);
    }
    if (settings.askEmail === "required" && !email) {
      state = { ...state, error: s.errors.email };
      return keepDraft(render);
    }
    state = { ...state, sending: true, error: "" };
    keepDraft(render);
    const metadata = Object.fromEntries(Object.entries(identity).filter(([key]) => key !== "email"));
    try {
      const response = await fetch(`${base}/api/v1/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId,
          type: state.type,
          message,
          email: email || undefined,
          page: { url: location.href, title: document.title },
          viewport: `${innerWidth}x${innerHeight}`,
          language: navigator.language,
          metadata: Object.keys(metadata).length ? metadata : undefined,
          screenshot: state.shot ?? undefined,
          website: String(data.get("website") ?? ""),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error === "rate_limited" ? s.errors.rateLimited : s.errors.generic);
      }
      if (email) identity = { ...identity, email };
      state = { ...state, sending: false, done: true, shot: null };
      render();
    } catch (error) {
      state = { ...state, sending: false, error: error instanceof Error && error.message ? error.message : s.errors.generic };
      keepDraft(render);
    }
  }

  const api: CustomaticApi = {
    open(type) {
      justOpened = !state.open;
      state = { ...state, open: true, done: false, type: type ?? state.type };
      render();
      (root.querySelector<HTMLElement>("textarea") ?? root.querySelector<HTMLElement>("[data-type]"))?.focus();
    },
    close() {
      state = { ...state, open: false, error: "" };
      render();
      root.querySelector<HTMLButtonElement>(".launcher")?.focus();
    },
    identify(data) {
      identity = { ...identity, ...data };
    },
  };
  window.Customatic = api;

  root.addEventListener("keydown", (event) => {
    if ((event as KeyboardEvent).key === "Escape" && state.open) api.close();
  });

  render();
  fetch(`${base}/api/v1/apps/${encodeURIComponent(appId)}/widget`)
    .then((r) => (r.ok ? r.json() : null))
    .then((remote: Settings | null) => {
      if (remote) {
        settings = { ...settings, ...remote };
        render();
      }
    })
    .catch(() => {});
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
