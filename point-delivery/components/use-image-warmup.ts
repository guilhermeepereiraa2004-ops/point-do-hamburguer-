import { useEffect } from "react";
import assets from "./menu-image-assets.json";

/** Load small preview assets in the background only after entering the builder. */
export function useIngredientImageWarmup(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const urls = [...new Set(Object.values(assets.ingredients).map(item => item.preview))];
    const images = new Set<HTMLImageElement>();
    let disposed = false, next = 0;
    function loadNext() {
      if (disposed || next >= urls.length) return;
      const image = new Image();
      images.add(image);
      image.decoding = "async";
      image.fetchPriority = "low";
      image.onload = image.onerror = () => { images.delete(image); image.onload = image.onerror = null; loadNext(); };
      image.src = urls[next++];
    }
    const start = () => { loadNext(); loadNext(); };
    const idle = "requestIdleCallback" in window ? window.requestIdleCallback(start, { timeout: 1200 }) : null;
    const timer = idle === null ? window.setTimeout(start, 500) : null;
    return () => {
      disposed = true;
      if (idle !== null) window.cancelIdleCallback(idle);
      if (timer !== null) window.clearTimeout(timer);
      for (const image of images) image.onload = image.onerror = null;
    };
  }, [enabled]);
}
