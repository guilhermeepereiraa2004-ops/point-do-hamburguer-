import { useCallback, useEffect, useRef, useState } from "react";
import type { Catalog } from "../domain/menu";

export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog>({ ingredients: [], prices: {}, deliveryFee: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const request = useRef<AbortController | null>(null);
  const loadCatalog = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    try {
      const response = await fetch("/api/catalog", { cache: "no-store", signal: controller.signal });
      const data = await response.json() as Catalog & { error?: string };
      if (!response.ok) throw new Error(data.error);
      if (!controller.signal.aborted) { setCatalog(data); setLoadError(""); }
    } catch (error) {
      if (!controller.signal.aborted && !silent) setLoadError(error instanceof Error ? error.message : "Não foi possível carregar o cardápio.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
    const refresh = () => { if (document.visibilityState === "visible") void loadCatalog(true); };
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
      request.current?.abort();
    };
  }, [loadCatalog]);
  return { catalog, setCatalog, loading, loadError, loadCatalog };
}
