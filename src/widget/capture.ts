/**
 * Page capture, loaded only when someone clicks "Capture page" (keeps widget.js small).
 * Renders the visible part of the page in the browser; nothing leaves the page until the user sends.
 */
import { domToJpeg } from "modern-screenshot";

window.__customaticCapture = async (hide: HTMLElement) => {
  const previous = hide.style.visibility;
  hide.style.visibility = "hidden";
  // JPEG has no transparency: paint the page's own background, or transparent areas turn black.
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
  const isClear = (c: string) => !c || c === "transparent" || c === "rgba(0, 0, 0, 0)";
  const backgroundColor = !isClear(bodyBg) ? bodyBg : !isClear(htmlBg) ? htmlBg : "#ffffff";
  try {
    // Capture the visible part of the page, where the user is looking.
    return await domToJpeg(document.documentElement, {
      width: innerWidth,
      height: innerHeight,
      scale: Math.min(devicePixelRatio || 1, 1.5),
      quality: 0.82,
      backgroundColor,
      filter: (node) => node !== hide,
      style: { transform: `translate(${-scrollX}px, ${-scrollY}px)`, transformOrigin: "0 0" },
    });
  } finally {
    hide.style.visibility = previous;
  }
};
