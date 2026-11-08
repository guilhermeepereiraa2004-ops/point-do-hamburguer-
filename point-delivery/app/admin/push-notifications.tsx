"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { readAdminResponse } from "@/lib/admin-api-response";
import "./push-notifications.css";

const endpoint = "/api/admin/notifications";
const failure = "Não foi possível configurar as notificações. Tente novamente.";
async function post(input: Record<string, unknown>) {
  const response = await fetch(endpoint, {
    method: "POST", redirect: "manual", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  return readAdminResponse(response, failure);
}

function applicationKey(value: string) {
  const decoded = atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4));
  return Uint8Array.from(decoded, character => character.charCodeAt(0));
}

export function PushNotifications() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [publicKey, setPublicKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);
  const [message, setMessage] = useState("Preparando notificações…");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setMessage("Preparando notificações…");
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (ios && !standalone) {
      setSupported(false);
      setMessage("No iPhone ou iPad, adicione este painel à Tela de Início pelo menu Compartilhar. Depois abra o ícone e ative os avisos.");
      return;
    }
    if (!window.isSecureContext || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setSupported(false);
      setMessage("Este navegador não oferece notificações com o painel fechado. Abra o painel no Chrome, Edge, Firefox ou no app da Tela de Início do iPhone.");
      return;
    }
    async function initialize() {
      try {
        const [response, worker] = await Promise.all([
          fetch(endpoint, { cache: "no-store", redirect: "manual" }),
          navigator.serviceWorker.register("/admin-notifications-sw.js", { scope: "/admin" }),
        ]);
        const config = await readAdminResponse(response, failure);
        if (!worker.active) await navigator.serviceWorker.ready;
        const subscription = await worker.pushManager.getSubscription();
        const status = subscription ? await post({ kind: "status", endpoint: subscription.endpoint }) : { enabled: false };
        if (cancelled) return;
        setRegistration(worker);
        setPublicKey(typeof config.publicKey === "string" ? config.publicKey : "");
        setEnabled(Notification.permission === "granted" && status.enabled === true);
        setMessage(config.publicKey ? "" : "O envio de notificações ainda não está configurado.");
      } catch {
        if (!cancelled) setMessage(failure);
      }
    }
    void initialize();
    return () => { cancelled = true; };
  }, [attempt]);

  async function enable() {
    if (!registration || !publicKey) return;
    setBusy(true);
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Permita as notificações deste site nas configurações do navegador para receber os avisos.");
        return;
      }
      const key = applicationKey(publicKey);
      let subscription = await registration.pushManager.getSubscription();
      const previousKey = subscription?.options.applicationServerKey;
      if (subscription && previousKey && !new Uint8Array(previousKey).every((value, index) => value === key[index])) {
        await subscription.unsubscribe();
        subscription = null;
      }
      subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      await post({ kind: "enable", subscription: subscription.toJSON() });
      setEnabled(true);
      setMessage("Avisos ativados neste aparelho. Use Enviar teste para conferir o recebimento.");
    } catch { setMessage(failure); }
    finally { setBusy(false); }
  }

  async function deviceAction(kind: "disable" | "test") {
    if (!registration) return;
    setBusy(true);
    try {
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) { setEnabled(false); return; }
      await post({ kind, endpoint: subscription.endpoint });
      if (kind === "disable") {
        setEnabled(false);
        await subscription.unsubscribe().catch(() => {});
      }
      setMessage(kind === "test" ? "Teste enviado. Confira as notificações do aparelho." : "Avisos desativados neste aparelho.");
    } catch { setMessage("Não foi possível concluir. Tente novamente."); }
    finally { setBusy(false); }
  }

  return <section className="push-settings" aria-label="Notificações com o painel fechado">
    <div className="push-settings-description">
      <BellRing size={22} aria-hidden="true"/>
      <div><h2>{enabled ? "Avisos ativados neste aparelho" : "Avisos com o painel fechado"}</h2>
        <p>Receba uma notificação quando chegar um pedido, mesmo sem deixar este painel aberto.</p></div>
    </div>
    {supported && <div className="push-settings-actions">
      {!registration && message === failure ? <button type="button" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button> : enabled ? <>
        <button type="button" disabled={busy} onClick={() => void deviceAction("test")}>Enviar teste</button>
        <button type="button" disabled={busy} onClick={() => void deviceAction("disable")}>Desativar neste aparelho</button>
      </> : <button type="button" disabled={busy || !registration || !publicKey} onClick={() => void enable()}>
        {busy ? "Ativando…" : "Ativar notificações"}
      </button>}
    </div>}
    {message && <p className="push-settings-message" role="status">{message}</p>}
  </section>;
}
