"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BAG_STORAGE_KEY, createBagStorage, emptySavedBag, restoreSavedBag, serializeSavedBag, type RestoredBagState, type SavedBagState } from "@/domain/saved-bag";
import type { Catalog } from "@/domain/menu";

export function usePersistentBag(state: SavedBagState, catalog: Catalog, catalogAvailable: boolean, onRestore: (state: RestoredBagState) => void) {
  const [storage] = useState(() => createBagStorage(() => window.localStorage));
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);
  const latestCatalog = useRef(catalog);
  const serialized = serializeSavedBag(state);
  useEffect(() => { latestCatalog.current = catalog; }, [catalog]);
  useEffect(() => {
    if (initialized.current || !catalogAvailable) return;
    initialized.current = true;
    const raw = storage.read();
    const restored = restoreSavedBag(raw, catalog);
    if (restored) onRestore(restored); else if (raw !== null) storage.clear();
    setReady(true);
  }, [catalogAvailable, catalog, onRestore, storage]);
  // Wait for restoration before writing, so the empty SSR bag never overwrites saved products.
  useEffect(() => { if (ready) storage.save(serialized); }, [ready, serialized, storage]);
  useEffect(() => {
    if (!ready) return;
    const sync = (event: StorageEvent) => {
      if (event.key !== BAG_STORAGE_KEY && event.key !== null) return;
      try { if (event.storageArea !== window.localStorage) return; } catch { return; }
      const restored = event.newValue === null ? emptySavedBag() : restoreSavedBag(event.newValue, latestCatalog.current);
      if (!restored) return;
      storage.acceptRemote(event.newValue);
      onRestore(restored);
    };
    const flush = () => storage.flush();
    window.addEventListener("storage", sync);
    window.addEventListener("pagehide", flush);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("pagehide", flush); };
  }, [ready, onRestore, storage]);
  const clear = useCallback(() => storage.clear(), [storage]);
  return { ready, clear };
}
