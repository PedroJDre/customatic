/** Widget CSS. Lives in a shadow root, so the host page can't break it and it can't break the page. */
export function css(accent: string, side: "left" | "right"): string {
  return `
:host { all: initial; }
* { box-sizing: border-box; }
.launcher, .panel { font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #141733; }
.launcher {
  position: fixed; ${side}: 20px; bottom: 20px; display: inline-flex; align-items: center; gap: 8px;
  height: 46px; padding: 0 18px 0 15px; border: 0; border-radius: 23px; cursor: pointer;
  background: ${accent}; color: #fff; font-weight: 600; font-size: 14.5px; letter-spacing: .01em;
  box-shadow: 0 6px 20px -6px ${accent}, 0 2px 6px rgba(20,23,51,.18);
  transition: transform .15s ease, box-shadow .15s ease;
}
.launcher:hover { transform: translateY(-1px); }
.launcher:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible, label.ghost:focus-within {
  outline: 3px solid ${accent}; outline-offset: 2px;
}
.panel {
  position: fixed; ${side}: 20px; bottom: 78px; width: 360px; max-width: calc(100vw - 24px);
  max-height: calc(100vh - 100px); overflow: auto; background: #fff; border-radius: 16px;
  box-shadow: 0 24px 60px -12px rgba(20,23,51,.35), 0 0 0 1px rgba(20,23,51,.08);
  padding: 18px;
}
.panel.enter { animation: rise .18s ease-out; }
@keyframes rise { from { opacity: 0; transform: translateY(8px); } }
@media (prefers-reduced-motion: reduce) { .panel { animation: none; } .launcher { transition: none; } }
/* Phones: the panel becomes a bottom sheet over the page, clear of the iPhone home bar. */
@media (max-width: 520px) {
  .launcher { ${side}: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); height: 44px; }
  .launcher.hidden { display: none; }
  .backdrop { position: fixed; inset: 0; background: rgba(20,23,51,.35); animation: fade .18s ease-out; }
  .panel {
    left: 0; right: 0; bottom: 0; width: 100%; max-width: none;
    max-height: calc(100dvh - 48px); border-radius: 18px 18px 0 0;
    padding: 10px 16px calc(16px + env(safe-area-inset-bottom));
    overscroll-behavior: contain;
  }
  .panel.enter { animation: sheet .22s ease-out; }
  .grabber { display: block; }
  /* 16px stops iOS Safari from zooming the page when a field gets focus. */
  .panel textarea, .panel input[type=email] { font-size: 16px; }
  .panel .type { padding: 11px 12px; }
  .panel .primary { height: 48px; }
  .panel .ghost { height: 38px; }
}
@keyframes sheet { from { transform: translateY(100%); } }
@keyframes fade { from { opacity: 0; } }
.backdrop { display: none; }
@media (max-width: 520px) { .backdrop.show { display: block; } }
.grabber { display: none; width: 40px; height: 4px; border-radius: 2px; background: #d6d9e6; margin: 0 auto 10px; }
.head { display: flex; align-items: flex-start; gap: 12px; }
.head > div { flex: 1; }
.x { flex: none; display: grid; place-items: center; width: 32px; height: 32px; margin: -4px -6px 0 0; border: 0; border-radius: 8px; background: transparent; color: #5b6079; cursor: pointer; }
.x:hover { background: #f1f2f7; color: #141733; }
header h2, .done h2 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -.01em; }
header p { margin: 3px 0 14px; color: #5b6079; font-size: 13px; }
.types { display: grid; gap: 6px; }
.type {
  display: flex; align-items: center; gap: 11px; width: 100%; padding: 9px 11px; text-align: left;
  border: 1.5px solid #e4e6ef; border-radius: 11px; background: #fff; cursor: pointer; color: inherit; font: inherit;
}
.type:hover { border-color: #c9cddd; }
.type-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 9px; flex: none; }
.type-problem .type-icon { background: #fdeceb; color: #b3322a; }
.type-suggestion .type-icon { background: #f1ebfe; color: #6d28d9; }
.type-comment .type-icon { background: #e0f4f2; color: #0b7a70; }
.type-text { display: grid; }
.type-text b { font-weight: 600; font-size: 14px; }
.type-text small { color: #5b6079; font-size: 12.5px; }
.type[aria-pressed=true] { border-color: ${accent}; background: color-mix(in srgb, ${accent} 6%, #fff); }
.types:has([aria-pressed=true]) .type:not([aria-pressed=true]) { padding-top: 6px; padding-bottom: 6px; }
.types:has([aria-pressed=true]) .type:not([aria-pressed=true]) small { display: none; }
form { margin-top: 14px; display: grid; gap: 11px; }
.field { display: grid; gap: 5px; }
.field span { font-weight: 600; font-size: 13px; }
.field i { font-style: normal; font-weight: 400; color: #8a8fa6; }
textarea, input[type=email] {
  width: 100%; border: 1.5px solid #e4e6ef; border-radius: 10px; padding: 9px 11px; font: inherit; color: inherit;
  background: #fff; resize: vertical;
}
textarea:focus, input:focus { border-color: ${accent}; outline: none; }
.shot { display: flex; flex-wrap: wrap; gap: 6px; }
.ghost {
  display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 11px; border-radius: 8px; cursor: pointer;
  border: 1px dashed #c9cddd; background: #f7f8fb; color: #3a3f5c; font: inherit; font-size: 13px;
}
.ghost:hover { border-color: ${accent}; color: ${accent}; }
figure { margin: 0; display: flex; align-items: center; gap: 10px; }
figure img { width: 84px; height: 54px; object-fit: cover; border-radius: 6px; border: 1px solid #e4e6ef; }
.link { background: none; border: 0; padding: 0; color: #5b6079; text-decoration: underline; cursor: pointer; font: inherit; font-size: 13px; }
.error { margin: 0; min-height: 0; color: #b3322a; font-size: 13px; }
.error:empty { display: none; }
.primary {
  height: 42px; border: 0; border-radius: 10px; background: ${accent}; color: #fff; font: inherit; font-weight: 600; cursor: pointer;
}
.primary:disabled { opacity: .6; cursor: progress; }
.hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
footer { margin-top: 14px; text-align: center; }
footer a { color: #8a8fa6; font-size: 11.5px; text-decoration: none; }
footer a:hover { color: #3a3f5c; }
.done { display: grid; justify-items: center; text-align: center; gap: 6px; padding: 18px 6px 6px; outline: none; }
.done-mark { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: #e0f4f2; color: #0b7a70; margin-bottom: 6px; }
.done p { margin: 0 0 12px; color: #5b6079; }
.done .primary { width: 100%; }
`;
}
