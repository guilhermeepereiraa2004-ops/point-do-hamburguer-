"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import "./pix-payment.css";

const PIX_KEY = "27035830000100";

export function PixPayment() {
  const keyInput = useRef<HTMLInputElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "manual">("idle");

  async function copyKey() {
    setCopyState("copying");
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopyState("copied");
    } catch {
      keyInput.current?.focus();
      keyInput.current?.select();
      setCopyState("manual");
    }
  }

  return <section className="pix-payment" aria-label="Pagamento por Pix">
    <div className="pix-payment-heading"><span aria-hidden="true" className="pix-payment-symbol">◆</span><div><h4>Pague com Pix</h4><p>Copie a chave para pagar pelo app do seu banco.</p></div></div>
    <label className="pix-payment-key">Chave Pix<input ref={keyInput} readOnly value={PIX_KEY} onFocus={event => event.currentTarget.select()} spellCheck={false}/></label>
    <button type="button" className="pix-payment-copy" disabled={copyState === "copying"} onClick={() => void copyKey()}>
      {copyState === "copied" ? <Check size={17} aria-hidden="true"/> : <Copy size={17} aria-hidden="true"/>}
      {copyState === "copied" ? "Chave copiada" : copyState === "copying" ? "Copiando…" : "Copiar chave Pix"}
    </button>
    <p className="pix-payment-status" role="status">{copyState === "copied" ? "Chave Pix copiada!" : copyState === "manual" ? "A chave está selecionada. Toque e segure ou use Ctrl+C para copiar." : ""}</p>
  </section>;
}
