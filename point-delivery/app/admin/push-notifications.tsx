"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { BellRing } from "lucide-react";
import { readAdminResponse } from "@/lib/admin-api-response";
import type { PushDevice } from "@/domain/push";
import { validatePushDeviceName } from "@/domain/push";
import { ManagementDialog } from "./management-panels";
import "./push-notifications.css";

const endpoint = "/api/admin/notifications";
const failure = "Não foi possível configurar as notificações. Tente novamente.";
const deviceDate = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Bahia", dateStyle: "short", timeStyle: "short" });
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
  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState(true);
  const [message, setMessage] = useState("Preparando notificações…");
  const [attempt, setAttempt] = useState(0);
  const [devices, setDevices] = useState<PushDevice[] | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<PushDevice | null>(null);
  const [removalError, setRemovalError] = useState("");
  const [renaming, setRenaming] = useState<PushDevice | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [nameError, setNameError] = useState("");
  const nameInput = useRef<HTMLInputElement>(null);
  const devicesHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessage("Preparando notificações…");
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const needsInstall = ios && !standalone;
    const canSubscribe = !needsInstall && window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(canSubscribe);
    if (needsInstall) setMessage("No iPhone ou iPad, adicione este painel à Tela de Início pelo menu Compartilhar. Depois abra o ícone e ative os avisos.");
    else if (!canSubscribe) setMessage("Este navegador não oferece notificações com o painel fechado. Abra o painel no Chrome, Edge, Firefox ou no app da Tela de Início do iPhone.");
    async function initialize() {
      try {
        const response = await fetch(endpoint, { cache: "no-store", redirect: "manual" });
        const config = await readAdminResponse(response, failure);
        if (cancelled) return;
        setDevices(Array.isArray(config.devices) ? config.devices as PushDevice[] : []);
        setPublicKey(typeof config.publicKey === "string" ? config.publicKey : "");
        if (!canSubscribe) return;
        const worker = await navigator.serviceWorker.register("/admin-notifications-sw.js", { scope: "/admin" });
        if (!worker.active) await navigator.serviceWorker.ready;
        const subscription = await worker.pushManager.getSubscription();
        const status = subscription ? await post({ kind: "status", endpoint: subscription.endpoint }) : { enabled: false, deviceId: null };
        if (cancelled) return;
        setRegistration(worker);
        setCurrentDeviceId(typeof status.deviceId === "string" ? status.deviceId : null);
        setEnabled(Notification.permission === "granted" && status.enabled === true);
        setMessage(config.publicKey ? "" : "O envio de notificações ainda não está configurado.");
      } catch {
        if (!cancelled) setMessage(failure);
      } finally { if (!cancelled) setLoading(false); }
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
      const result = await post({ kind: "enable", subscription: subscription.toJSON() });
      setCurrentDeviceId(typeof result.deviceId === "string" ? result.deviceId : null);
      if (Array.isArray(result.devices)) setDevices(result.devices as PushDevice[]);
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
      if (!subscription) { setEnabled(false); setCurrentDeviceId(null); return; }
      await post({ kind, endpoint: subscription.endpoint });
      if (kind === "disable") {
        setEnabled(false);
        setDevices(value => value?.filter(device => device.id !== currentDeviceId) ?? null);
        setCurrentDeviceId(null);
        await subscription.unsubscribe().catch(() => {});
      }
      setMessage(kind === "test" ? "Teste enviado. Confira as notificações do aparelho." : "Avisos desativados neste aparelho.");
    } catch { setMessage("Não foi possível concluir. Tente novamente."); }
    finally { setBusy(false); }
  }

  async function removeDevice() {
    if (!removing) return;
    setBusy(true);
    setRemovalError("");
    try {
      await post({ kind: "remove-device", id: removing.id });
      setDevices(value => value?.filter(device => device.id !== removing.id) ?? null);
      if (removing.id === currentDeviceId) {
        setEnabled(false);
        setCurrentDeviceId(null);
        const subscription = await registration?.pushManager.getSubscription().catch(() => null);
        await subscription?.unsubscribe().catch(() => {});
      }
      setRemoving(null);
      setMessage("Aparelho removido. O cadastro deixará de receber novos avisos.");
      requestAnimationFrame(() => devicesHeading.current?.focus());
    } catch { setRemovalError("Não foi possível remover este aparelho. Tente novamente."); }
    finally { setBusy(false); }
  }

  async function renameDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!renaming || busy) return;
    setNameError("");
    let name: string;
    try { name = validatePushDeviceName(deviceName); }
    catch { setNameError("Informe um nome de 1 a 60 caracteres para o aparelho."); nameInput.current?.focus(); return; }
    setBusy(true);
    try {
      await post({ kind: "rename-device", id: renaming.id, name });
      setDevices(value => value?.map(device => device.id === renaming.id ? { ...device, label: name } : device) ?? null);
      setRenaming(null);
      setMessage("Nome do aparelho salvo.");
    } catch (error) {
      setNameError(error instanceof Error ? error.message : "Não foi possível salvar o nome. Tente novamente.");
      requestAnimationFrame(() => nameInput.current?.focus());
    }
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
        <button type="button" disabled={busy || loading} onClick={() => void deviceAction("test")}>Enviar teste</button>
        <button type="button" disabled={busy || loading} onClick={() => void deviceAction("disable")}>Desativar neste aparelho</button>
      </> : <button type="button" disabled={busy || loading || !registration || !publicKey} onClick={() => void enable()}>
        {busy ? "Ativando…" : "Ativar notificações"}
      </button>}
    </div>}
    {message && <p className="push-settings-message" role="status">{message}</p>}
    <div className="push-devices">
      <header><div><h3 ref={devicesHeading} tabIndex={-1}>Aparelhos cadastrados</h3>
        <p>{devices ? `${devices.length} de 20 nesta conta` : "Carregando aparelhos…"}</p></div>
        <button type="button" disabled={busy || loading} onClick={() => setAttempt(value => value + 1)}>Atualizar lista</button>
      </header>
      {devices?.length ? <ul>{devices.map(device => <li key={device.id}>
        <div><strong>{device.label}</strong>{device.id === currentDeviceId && <span className="push-current-device">Este aparelho</span>}
          <small>Cadastro {device.id.slice(0, 8)} · Última ativação {deviceDate.format(device.updatedAt)}</small></div>
        <div className="push-device-actions">
          <button type="button" disabled={busy || loading} aria-label={`Editar nome de ${device.label}, cadastro ${device.id.slice(0, 8)}`}
            onClick={() => { setNameError(""); setDeviceName(device.label); setRenaming(device); }}>Editar nome</button>
          <button type="button" disabled={busy || loading} aria-label={`Remover ${device.label}, cadastro ${device.id.slice(0, 8)}`}
            onClick={() => { setRemovalError(""); setRemoving(device); }}>Remover</button>
        </div>
      </li>)}</ul> : devices && <p>Nenhum aparelho cadastrado para receber avisos nesta conta.</p>}
    </div>
    {removing && <ManagementDialog title="Remover aparelho" closeLabel="Fechar confirmação" busy={busy} onClose={() => setRemoving(null)}>
      <p>{removing.label} · Cadastro {removing.id.slice(0, 8)}</p>
      <p>Este cadastro deixará de receber novos avisos. Para voltar a receber, ative as notificações novamente no aparelho.</p>
      {removalError && <p role="alert">{removalError}</p>}
      <button className="button primary" type="button" disabled={busy} onClick={() => void removeDevice()}>
        {busy ? "Removendo…" : "Confirmar remoção"}
      </button>
    </ManagementDialog>}
    {renaming && <ManagementDialog title="Nome do aparelho" busy={busy} onClose={() => setRenaming(null)}>
      <form onSubmit={renameDevice}>
        <p className="management-intro">Escolha um nome fácil de reconhecer, como Celular do caixa ou Celular da cozinha.</p>
        <label>Nome do aparelho<input ref={nameInput} name="deviceName" value={deviceName} onChange={event => setDeviceName(event.target.value)}
          maxLength={60} required disabled={busy} autoComplete="off" placeholder="Ex.: Celular do caixa"
          aria-invalid={Boolean(nameError)} aria-describedby={nameError ? "push-device-name-error" : undefined}/></label>
        {nameError && <p id="push-device-name-error" className="notice error" role="alert">{nameError}</p>}
        <div className="push-name-actions">
          <button className="button outline" type="button" disabled={busy} onClick={() => setRenaming(null)}>Cancelar</button>
          <button className="button primary" type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar nome"}</button>
        </div>
      </form>
    </ManagementDialog>}
  </section>;
}
