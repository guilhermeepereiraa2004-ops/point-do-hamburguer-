"use client";

import { useEffect, useRef, type ReactNode } from "react";
import "./checkout-dialog.css";

export function CheckoutDialog({ children, locked, onClose }: { children: ReactNode; locked: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected && previous !== document.body) previous.focus({ preventScroll: true });
      else document.querySelector<HTMLButtonElement>(".floating-order-bag")?.focus({ preventScroll: true });
    };
  }, []);

  return <dialog ref={dialog} className="checkout-dialog" aria-labelledby="checkout-title"
    onCancel={event => { event.preventDefault(); if (!locked) onClose(); }}
    onMouseDown={event => { if (!locked && event.target === event.currentTarget) onClose(); }}
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(node => node.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>{children}</dialog>;
}
