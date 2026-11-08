"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const preferenceKey = "point-order-sound";

function ring(context: AudioContext | null) {
  if (!context || context.state !== "running") return;
  [1050, 1580, 2100].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(.22 / (index + 1), context.currentTime + .012);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + 1.7);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 1.8);
  });
}

export function useOrderSound(pendingIds: string[]) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const preference = useRef(false);
  const pendingKey = pendingIds.join(",");

  const resumeSound = useCallback((test = false) => {
    try {
      if (!audio.current || audio.current.state === "closed") audio.current = new AudioContext();
      const context = audio.current;
      const updateReady = () => { if (audio.current === context) setReady(context.state === "running"); };
      context.onstatechange = updateReady;
      updateReady();
      if (context.state === "running") {
        if (test && preference.current) ring(context);
      } else {
        void context.resume().then(() => {
          updateReady();
          if (test && preference.current && audio.current === context) ring(context);
        }).catch(() => { if (audio.current === context) setReady(false); });
      }
    } catch {
      setReady(false);
      setError("Não foi possível iniciar o áudio. Verifique o navegador.");
    }
  }, []);

  useEffect(() => {
    const restore = (value: string | null) => {
      preference.current = value === "true";
      setEnabled(preference.current);
      if (preference.current) resumeSound();
    };
    try { restore(localStorage.getItem(preferenceKey)); } catch {}
    const unlock = () => { if (preference.current && audio.current?.state !== "running") resumeSound(); };
    const sync = (event: StorageEvent) => { if (event.key === preferenceKey || event.key === null) restore(event.newValue); };
    window.addEventListener("pointerup", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("pointerup", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("storage", sync);
      const context = audio.current;
      audio.current = null;
      if (context) {
        context.onstatechange = null;
        void context.close().catch(() => {});
      }
    };
  }, [resumeSound]);

  useEffect(() => {
    if (!enabled || !ready || !pendingKey) return;
    ring(audio.current);
    const timer = setInterval(() => ring(audio.current), 4000);
    return () => clearInterval(timer);
  }, [enabled, ready, pendingKey]);

  function toggleSound() {
    preference.current = !preference.current;
    setEnabled(preference.current);
    setError(null);
    try { localStorage.setItem(preferenceKey, String(preference.current)); }
    catch { setError("A sineta funciona nesta aba, mas o navegador não permitiu salvar a preferência."); }
    if (preference.current) resumeSound(true);
  }

  return { enabled, ready, error, toggleSound, unlockSound: () => resumeSound() };
}
