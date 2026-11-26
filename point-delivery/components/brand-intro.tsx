"use client";

import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { BrandLogo } from "./brand-logo";
import { INTRO_FONTS, type IntroFont } from "./intro-fonts";
import "@/app/brand-intro.css";

export function BrandIntro({ previewMotion = false, captionFont = "anton" }: { previewMotion?: boolean; captionFont?: IntroFont }) {
  preload("/images/brand/point-icon-v2.webp", { as: "image", fetchPriority: "high" });
  preload(INTRO_FONTS[captionFont].src, { as: "font", type: "font/ttf", crossOrigin: "anonymous" });
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const documentRoot = document.documentElement;
    const previousOverflow = documentRoot.style.overflow;
    const images = Array.from(root.querySelectorAll("img"));
    let scrollLocked = false;
    let finished = false;
    let timeout: number | undefined;
    const releaseScroll = () => {
      if (scrollLocked && documentRoot.style.overflow === "hidden") documentRoot.style.overflow = previousOverflow;
      scrollLocked = false;
    };
    const onAnimationEnd = (event: AnimationEvent) => {
      if (event.target === root && (event.animationName === "point-ident-out" || event.animationName === "point-ident-fade")) hide();
    };
    const removeListeners = () => {
      root.removeEventListener("animationend", onAnimationEnd);
      images.forEach(image => image.removeEventListener("error", hide));
      window.removeEventListener("pagehide", hide);
    };
    const hide = () => {
      if (finished) return;
      finished = true;
      root.style.visibility = "hidden";
      window.clearTimeout(timeout);
      removeListeners();
      releaseScroll();
      setVisible(false);
    };

    // CSS starts at the first paint. Late hydration must never replay a finished opening.
    if (getComputedStyle(root).visibility === "hidden") { hide(); return; }
    const fullPreview = previewMotion || new URLSearchParams(window.location.search).get("abertura") === "completa";
    root.dataset.motion = fullPreview ? "full" : "system";
    const style = getComputedStyle(root);
    if (style.visibility === "hidden") { hide(); return; }

    const animation = root.getAnimations?.().find(item => ["point-ident-out", "point-ident-fade"].includes((item as CSSAnimation).animationName));
    const elapsed = typeof animation?.currentTime === "number" ? animation.currentTime : 0;
    const endTime = Number(animation?.effect?.getComputedTiming().endTime);
    const duration = Number.isFinite(endTime) ? endTime : Number.parseFloat(style.getPropertyValue("--ident-duration")) || 2200;
    const remaining = Math.max(0, duration - elapsed);
    if (remaining === 0 || images.some(image => image.complete && image.naturalWidth === 0)) { hide(); return; }

    documentRoot.style.overflow = "hidden";
    scrollLocked = true;
    root.addEventListener("animationend", onAnimationEnd);
    images.forEach(image => image.addEventListener("error", hide, { once: true }));
    window.addEventListener("pagehide", hide);
    timeout = window.setTimeout(hide, remaining + 100);
    return () => {
      finished = true;
      window.clearTimeout(timeout);
      removeListeners();
      releaseScroll();
    };
  }, [previewMotion]);

  if (!visible) return null;
  return <>
    <div className="brand-intro" data-caption-font={captionFont} data-motion={previewMotion ? "full" : undefined} ref={rootRef} role="status" aria-label="Point do Hambúrguer. O melhor da cidade">
      <div className="brand-intro-scene" aria-hidden="true">
        <div className="brand-intro-sweep" />
        <div className="brand-intro-mark">
          <div className="brand-intro-ink" />
          <BrandLogo variant="icon" className="brand-intro-logo" decorative priority />
          <div className="brand-intro-polish" />
          <p className="brand-intro-caption">
            <span>O MELHOR</span>{" "}<span className="brand-intro-caption-accent">DA CIDADE</span>
          </p>
        </div>
      </div>
    </div>
    <noscript><style>{".brand-intro{display:none!important}"}</style></noscript>
  </>;
}
